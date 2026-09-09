import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { config } from './config';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { dashboardRouter } from './routes/dashboard';
import { stateRouter } from './routes/state';
import { requireAuth } from './middleware/requireAuth';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'election-api', version: '1.0.0' });
});

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/state', requireAuth, stateRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.apiPort, () => {
  console.log(`API server running on http://localhost:${config.apiPort}`);
});
