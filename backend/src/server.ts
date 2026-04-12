// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './database/db.js';
import authRoutes from './routes/authRoutes.js'; // 1. IMPORT ROUTES
import gameRoutes from './routes/gameRoutes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 2. USE ROUTES (This prefixes everything in authRoutes with /auth)
app.use('/auth', authRoutes);
app.use('/game', gameRoutes);
// Basic route to test server
app.get('/', (req, res) => {
  res.send('Battle Arena API is running!');
});

// ... rest of your test-db route and listen code
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});