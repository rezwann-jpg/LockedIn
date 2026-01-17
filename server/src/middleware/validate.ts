import { Request, Response, NextFunction } from 'express';
import { generateToken } from '../lib/auth';

export const validateSignup = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ error: 'Email, password, and name are required' });
  }

  if (typeof email !== 'string' || email.includes('@')) {
    return res
      .status(400)
      .json({ error: 'Invalid email format' });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: 'Password must be at least 8 characters long' });
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: 'Email and password are required' });
  }

  if (typeof email !== 'string' || email.includes('@')) {
    return res
      .status(400)
      .json({ error: 'Invalid email format' });
  }

  next();
};
