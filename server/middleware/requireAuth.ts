import { NextFunction, Request, Response } from 'express';
import { verifyToken, AuthTokenPayload } from '../auth';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
