import { Router } from 'express';
import { getProductResponse } from '@suppsense/shared-types';
import { getProduct, getProductById, getProductIngredients } from '../db/supplement';
import { decodeAccessToken } from '../middleware/auth.middleware'

const router = Router();

router.get('/', async (_req, res) => {
               const placeholder: getProductResponse[] = [{ id: '1', barcode: '121323',
                                                              name: "Great Juice",
                                                              brand: null,
                                                              description: "This stuff is poison",
                                                              ingredients: [],
                                                              data_added: "Today",
                                                              date_updated: "Today"}];
               res.json(placeholder);
           });

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
    };

    res.json(response);
});

export default router;