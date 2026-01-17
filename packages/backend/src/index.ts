import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { projectsRouter } from './routes/projects.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/projects', projectsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
