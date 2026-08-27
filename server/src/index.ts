import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { sessionsRouter } from './routes/sessions.js';
import { boothsRouter } from './routes/booths.js';
import { gachaRouter } from './routes/gacha.js';
import { connectionsRouter } from './routes/connections.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'DevFest KL 2026 Node Backend',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/booths', boothsRouter);
app.use('/api/gacha', gachaRouter);
app.use('/api/connections', connectionsRouter);

app.listen(PORT, () => {
  console.log(`🚀 DevFest KL 2026 Node Server running on http://localhost:${PORT}`);
});
