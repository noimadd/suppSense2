import { Router } from 'express';
import { getProductResponse } from '@suppsense/shared-types';

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

export default router;