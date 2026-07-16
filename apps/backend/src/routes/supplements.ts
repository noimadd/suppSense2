import { Router } from 'express';
import { Supplement } from '@suppsense/shared-types';

const router = Router();

router.get('/', async (_req, res) => {
    const placeholder: Supplement[] = [{ id: '1' }];
    res.json(placeholder);
});

export default router;