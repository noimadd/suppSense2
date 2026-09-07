import express from 'express';
import cors from 'cors';

// routes
import supplementsRouter from './routes/supplements.routes';
import ingredientsRouter from './routes/ingredients.routes';
import librariesRouter from './routes/libraries.routes'

// authentication routes
import authRouter from './routes/auth.routes';
import { requireAuth } from './middleware/auth.middleware';
import { connectRedis } from './db/redis';
import { EMAIL_TRANSPORTER } from './middleware/email.middleware'

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/supplements', requireAuth, supplementsRouter);
app.use('/api/ingredients', requireAuth, ingredientsRouter);
app.use('/api/libraries', requireAuth, librariesRouter);

const PORT = process.env.PORT || 3000;

connectRedis().then(() => {
    app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}).catch((err) => {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
});

// Check if our email service is up
EMAIL_TRANSPORTER.verify().then(() => { console.log("Email server is ready"); }).catch((err: any) => {
                                                                                           console.error('Connection to the mail server failed!');
                                                                                       });
