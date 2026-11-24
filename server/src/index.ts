import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { isRedisConnected } from './redis/redisClient';

import casesRoutes from './routes/cases';
import reviewsRoutes from './routes/reviews';
import dashboardRoutes from './routes/dashboard';
import evaluationRoutes from './routes/evaluation';
import auditRoutes from './routes/audit';
import troubleshootRoutes from './routes/troubleshoot';

const app = express();
const PORT = Number(process.env.PORT) || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Track DB connection state
app.locals.dbConnected = false;

// MongoDB connection with graceful fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/netsage';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ MongoDB connected');
    app.locals.dbConnected = true;
  })
  .catch((err: Error) => {
    console.warn('⚠️  MongoDB not available — running in memory-only mode');
    console.warn(`   (${err.message})`);
    console.warn('   All data will be served from JSON files and stored in memory.');
    app.locals.dbConnected = false;
  });

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — switching to memory-only mode');
  app.locals.dbConnected = false;
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
  app.locals.dbConnected = true;
});

// Routes
app.use('/api/cases', casesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/troubleshoot', troubleshootRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    db: app.locals.dbConnected ? 'connected' : 'in-memory',
    redis: isRedisConnected() ? 'connected' : 'unavailable',
    aiMode: process.env.GROQ_API_KEY ? 'groq' : 'demo',
    timestamp: new Date().toISOString()
  });
});

// Serve the built React client (single fullstack service)
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 NetPulse AI Server running on http://localhost:${PORT}`);
  console.log(`   AI Mode: ${process.env.GROQ_API_KEY ? 'Groq API' : 'Demo (no API key)'}`);
  console.log(`   DB Mode: ${app.locals.dbConnected ? 'MongoDB' : 'In-Memory'}\n`);
});
