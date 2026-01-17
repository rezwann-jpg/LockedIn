import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../config/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateToken } from '../lib/auth';

export const signup = async (req: Request, res: Response) => {
  const { email, password, name, role = 'job_seeker' } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        name,
        role,
        passwordHash: hashedPassword,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    const token = generateToken(newUser.id, newUser.role);

    return res
      .status(201)
      .json({
        message: 'User created successfully',
        user: newUser,
        token,
      });
  } catch (error) {
    console.error('Signup error:', error);
    return res
      .status(500)
      .json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));

    if (!user) {
      return res
        .status(401)
        .json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res
        .status(401)
        .json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role);

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};
