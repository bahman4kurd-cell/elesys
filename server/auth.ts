import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config';

export interface AuthTokenPayload {
  userId: string;
  instanceId: string;
  username: string;
  role: string;
}

export async function hashPassword(plainText: string): Promise<string> {
  const rounds = 12;
  return bcrypt.hash(plainText, rounds);
}

export async function verifyPassword(plainText: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainText, passwordHash);
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}
