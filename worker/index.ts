import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { sessionsRouter } from './routes/sessions';
import { boothsRouter } from './routes/booths';
import { gachaRouter } from './routes/gacha';
import { connectionsRouter } from './routes/connections';
import { notificationsRouter } from './routes/notifications';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors({ origin: '*' }));

// Health Check Endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'DevFest KL 2026 Cloudflare Worker (Hono)',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.route('/api/auth', authRouter);
app.route('/api/sessions', sessionsRouter);
app.route('/api/booths', boothsRouter);
app.route('/api/gacha', gachaRouter);
app.route('/api/connections', connectionsRouter);
app.route('/api/notifications', notificationsRouter);

// Fallback for non-API requests if routed to Worker
app.all('*', async (c) => {
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.json({ message: 'Not Found' }, 404);
});

export default app;
