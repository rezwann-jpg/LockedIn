import {
  useEffect,
  useState,
  useCallback,
} from 'react';

import type { ReactNode } from 'react';

import api from '../lib/api';
import { AuthContext } from './auth.context';
import type { User, LoginCredentials, SignupData } from './auth.types';

type Props = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/profile');
        setUser(res.data.user);
      } catch {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (data: LoginCredentials) => {
    const res = await api.post('/login', data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const res = await api.post('/signup', data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
