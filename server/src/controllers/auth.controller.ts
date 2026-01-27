import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../config/db';
import { users, companies } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateToken } from '../lib/auth';

export const signup = async (req: Request, res: Response) => {
  const { email, password, name, role = 'job_seeker' } = req.body;

  // Validate inputs
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const validRoles = ['job_seeker', 'company', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password FIRST before any DB ops
    const hashedPassword = await bcrypt.hash(password, 10);

    // ATOMIC TRANSACTION: User record
    const newUser = await db.transaction(async (tx) => {
      // Insert user
      const [user] = await tx.insert(users).values({
        email: normalizedEmail,
        name,
        role: role as any,
        passwordHash: hashedPassword,
      }).returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

      return user;
    });

    const token = generateToken(newUser.id, newUser.role);

    // NEVER return password hash
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    // Drizzle transaction auto-rolls back on error
    res.status(500).json({ error: 'Failed to create account' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));

    if (!user || !user.passwordHash) {
      // Prevent user enumeration
      await new Promise(resolve => setTimeout(resolve, 200));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Timing attack mitigation
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update lastLoginAt SAFELY (don't fail login if update fails)
    db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id))
      .catch(err => console.error('Failed to update lastLoginAt:', err));

    const token = generateToken(user.id, user.role);

    // NEVER return password hash
    res.json({
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
    res.status(500).json({ error: 'Authentication failed' });
  }
};