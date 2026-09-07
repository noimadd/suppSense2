import { Router } from 'express';
import { getIngredientResponse } from '@suppsense/shared-types';
import { getIngredient } from '../db/supplement';

const router = Router();

router.get('/:name', async (req, res) => {
    const { name } = req.params;
    const ingredient = await getIngredient(name);

    if (!ingredient) {return res.status(404).json({ message: 'Ingredient not found' }); }

    const response: getIngredientResponse = {
        id: ingredient.id,
        name: ingredient.name,
        description: ingredient.description,
        paper_url: ingredient.paper_url,
        recommended_dosage: ingredient.recommended_dosage,
        maximum_dosage: ingredient.maximum_dosage,
        verified: ingredient.verified,
        image_url: ingredient.image_url,
        date_added: ingredient.date_added,
        date_updated: ingredient.date_updated,
    };

    res.json(response);
});

export default router;