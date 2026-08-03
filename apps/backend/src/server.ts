import express from 'express';
import cors from 'cors';
import path from 'path';
import supplementsRouter from './routes/supplements.routes';

// route stuff
// barcode routes

// library routes

// profile routes

// admin routes

// middleware 
const authMiddleware = require("./middleware/auth.middleware.ts");

// random 
const supplements = require("./routes/supplements.routes.ts");


const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));