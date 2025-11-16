import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';
import messagesRoutes from './routes/messages.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Campus Cart API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/messages', messagesRoutes);

app.listen(PORT, () => {
  console.log(`✓ Campus Cart API running on http://localhost:${PORT}`);
});

export default app;
