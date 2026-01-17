import jwt from 'jsonwebtoken';

const JWT_SECRET : string = process.env.JWT_SECRET!;

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
  } catch (error) {
    return null;
  }
};
