import { Router } from 'express';
import { getProductResponse } from '@suppsense/shared-types';
import { getProduct, getProductIngredients } from '../db/supplement';

const router = Router();

router.get('/', async (_req, res) => {
               const placeholder: getProductResponse[] = [{ id: '1', barcode: '121323',
                                                              name: "Great Juice",
                                                              description: "This stuff is poison",
                                                              ingredients: [],
                                                              data_added: "Today",
                                                              date_updated: "Today"}];
               res.json(placeholder);
           });

router.get('/:barcode', async (req, res) => {
    const { barcode } = req.params;
    const product = await getProduct(barcode);

    if (!product) { return res.status(404).json({ message: 'Product not found' }); }

    const ingredients = await getProductIngredients(product.id);

    const response: getProductResponse = {
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        description: product.description,
        ingredients,
        data_added: product.date_added,
        date_updated: product.date_updated,
    };

    res.json(response);
});

export default router;