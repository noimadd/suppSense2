import { Router } from 'express';
import { getProduct, getProductById, getProductIngredients, createUserSubmittedProduct } from '../db/supplement';
import { decodeAccessToken } from '../middleware/auth.middleware';
import { getProductResponse, createProductRequest } from '@suppsense/shared-types';

const router = Router();

router.get('/:barcode', async (req, res) => {
    const { barcode } = req.params;
    const product = await getProduct(barcode, (req as any).user.sub);

    if (!product) { return res.status(404).json({ message: 'Product not found' }); }

    const ingredients = await getProductIngredients(product.id);

    const response: getProductResponse = {
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        description: product.description,
        ingredients,
        data_added: product.date_added,
        date_updated: product.date_updated,
        image_url: product.image_url,
    };

    res.json(response);
});

router.get('/by_id/:p_id', async (req, res) => {
    const { p_id } = req.params;
    
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
    
    const product = await getProductById(p_id, token_decode.sub);

    if(!product)
    {
        return res.status(404).json({ message: 'Product not found' });
    }

    const ingredients = await getProductIngredients(product.id);

    const response: getProductResponse = {
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        description: product.description,
        ingredients,
        data_added: product.date_added,
        date_updated: product.date_updated,
        image_url: product.image_url,
    };

    res.json(response);
});

function IsValidProductRequest(checked: object): boolean
{
    try
    {
        const all_present = 'barcode' in checked && 'name' in checked && 'brand' in checked && 'description' in checked && 'ingredients' in checked
            && 'image_url' in checked;
        
        if(!all_present)
        {
            return false;
        }
     
        const checked_t = checked as createProductRequest;
        const all_valid = checked_t.barcode.length > 0 && checked_t.name.length > 5 && checked_t.brand.length > 5 && checked_t.description.length > 5
                            && checked_t.ingredients.length > 0 && checked_t.image_url.length > 0;
        
        return all_valid;
    }
    catch(e)
    {
        return false;
    }
    
    return false;
}

router.post('/user_submitted', async (req, res) => {
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
    
    const creation_request = req.body ?? {};

    if(!IsValidProductRequest(creation_request))
    {
        return res.status(400).json({ message: 'Malformed request' });
    }

    const product_id = await createUserSubmittedProduct(token_decode.sub, creation_request);
    
    if(!product_id)
    {
        return res.status(409).json({ message: 'Couldnt create product' });
    }
    
    res.json({"product_id": product_id});
});

export default router;