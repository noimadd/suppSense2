import express from 'express';
import cors from 'cors';
import supplementsRouter from './routes/supplements';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/supplements', supplementsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));