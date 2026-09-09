import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { config } from './config';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { dashboardRouter } from './routes/dashboard';
import { stateRouter } from './routes/state';
import { requireAuth } from './middleware/requireAuth';
import { bootstrapDatabase } from './bootstrap';

const app = express();

const allowedOrigins = config.corsOrigins;
app.use(
  cors({
    origin: allowedOrigins.length
      ? (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin))
      : true,
    credentials: true,
  })
);
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

async function start(): Promise<void> {
  if (config.autoBootstrap) {
    try {
      await bootstrapDatabase();
    } catch (error) {
      console.error('Database bootstrap failed (API will still start):', error);
    }
  }

  app.listen(config.apiPort, () => {
    console.log(`API server running on port ${config.apiPort}`);
  });
}

void start();
