import { Router } from 'express';
//import { getUserLibrariesResponse } from '@suppsense/shared-types';
import { decodeAccessToken, isValidResourceURL } from '../middleware/auth.middleware'
import { getProductLibrary, createProductLibrary, deleteProductLibrary, addProductToProductLibrary, removeProductFromProductLibrary } from '../db/libraries'

const router = Router();

// Get the libraries that a particular user owns
router.get('/', async (req, res) => {
    // We need to take the user's token and decode it to find their ID.
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if(!token)
    {
        console.log("Fake news token");
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token_decode = decodeAccessToken(token);
    if(!token_decode)
    {
        console.log("Mclovin token");
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Collect all the user's libraries.
    const query_res = await getProductLibrary(token_decode.sub);
    
    if(!query_res)
    {
        return res.json([]);
    }
    
    res.json(query_res);
});

// Create a new library for a particular user
router.post('/create', async (req, res) => {
    // We need to take the user's token and decode it to find their ID.
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if(!token)
    {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token_decode = decodeAccessToken(token);
    if(!token_decode)
    {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { library_name, img_url } = req.body ?? {};
    
    if(!library_name || !img_url)
    {
        return res.status(401).json({ message: 'Invalid library name/image url' });
    }
    
    if(!isValidResourceURL(img_url))
    {
        return res.status(401).json({ message: 'Invalid image url' });
    }
    
    // Create the library entry in the DB.
    await createProductLibrary(token_decode.sub, library_name, img_url);
    
    return res.json({message: 'Success'});
});

// Delete a particular library belonging to a specific user
router.delete('/delete', async (req, res) => {
    // We need to take the user's token and decode it to find their ID.
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if(!token)
    {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token_decode = decodeAccessToken(token);
    if(!token_decode)
    {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { library_id } = req.body ?? {};
    
    if(!library_id)
    {
        return res.status(401).json({ message: 'Invalid library id' });
    }
    
    // Delete the library entry in the DB.
    // Note(Leo): Deletion is protected via the JWT token encoding the user that it belongs to by their ID. We dont have to do a seperate query to 
    // verify ownership of the library because the deletion query does a combined check of both the user ID and the library ID when deleting.
    await deleteProductLibrary(token_decode.sub, library_id);
    
    return res.json({message: 'Success'});
});

// Insert a product into a particular library
router.post('/insert_product', async (req, res) => {
    // We need to take the user's token and decode it to find their ID.
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if(!token)
    {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token_decode = decodeAccessToken(token);
    if(!token_decode)
    {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { library_id, product_id } = req.body ?? {};
    
    if(!library_id || !product_id)
    {
        return res.status(401).json({ message: 'Invalid library or product id' });
    }
    
    // Inser the product entry into the DB.
    // Note(Leo): Insertion is protected via the JWT token encoding the user that it belongs to by their ID. We dont have to do a seperate query to 
    // verify ownership of the library because the insertion query does a combined check of both the user ID and the library ID when deleting.
    await addProductToProductLibrary(token_decode.sub, library_id, product_id);
        
    return res.json({message: 'Success'});
});


// Remove a product from a particular library
router.delete('/remove_product', async (req, res) => {
    // We need to take the user's token and decode it to find their ID.
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if(!token)
    {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token_decode = decodeAccessToken(token);
    if(!token_decode)
    {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { library_id, product_id } = req.body ?? {};
    
    if(!library_id || !product_id)
    {
        return res.status(401).json({ message: 'Invalid library or product id' });
    }
    
    // Remove the product entry in the DB.
    // Note(Leo): Removal is protected via the JWT token encoding the user that it belongs to by their ID. We dont have to do a seperate query to 
    // verify ownership of the library because the deletion query does a combined check of both the user ID and the library ID when deleting.
    await removeProductFromProductLibrary(token_decode.sub, library_id, product_id);
        
    return res.json({message: 'Success'});
});

export default router;