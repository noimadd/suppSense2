import { Router } from 'express';
//import { getUserLibrariesResponse } from '@suppsense/shared-types';
import { decodeAccessToken } from '../middleware/auth.middleware'
import { getProductLibrary, ProductLibrary } from '../db/libraries'

const router = Router();

router.get('/', async (req, res) => {
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
            
            const query_res = await getProductLibrary(token_decode.sub);
            
            console.log(query_res);
            
            res.json(query_res);
        });

export default router;