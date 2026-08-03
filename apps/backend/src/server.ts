import express from 'express';
import cors from 'cors';

// routes
import supplementsRouter from './routes/supplements.routes';

// authentication routes
import authRouter from './routes/auth.routes';
import { requireAuth } from './middleware/auth.middleware';


const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/supplements', requireAuth, supplementsRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));