import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Campus Cart API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);

app.listen(PORT, () => {
  console.log(`✓ Campus Cart API running on http://localhost:${PORT}`);
});

export default app;
