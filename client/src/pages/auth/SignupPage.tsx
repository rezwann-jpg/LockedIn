import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';

import { useAuth } from '../../context/useAuth';

type Role = 'job_seeker' | 'company';

type SignupPayload = {
  name: string;
  email: string;
  password: string;
  role: Role;
  company?: {
    name: string;
  };
};

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('job_seeker');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const payload: SignupPayload = {
      name,
      email,
      password,
      role,
      ...(role === 'company'
        ? { company: { name: companyName } }
        : {}),
    };

    try {
      await signup(payload);
      navigate('/profile/setup');
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error ?? 'Signup failed');
      } else {
        setError('Signup failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-secondary rounded-xl p-8 border border-muted">
        <h2 className="text-2xl font-bold text-text mb-6 text-center">
          Create Account
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-3 bg-background border border-muted rounded focus:outline-none focus:ring-2 focus:ring-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 bg-background border border-muted rounded focus:outline-none focus:ring-2 focus:ring-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 bg-background border border-muted rounded focus:outline-none focus:ring-2 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-muted mb-2">I am a:</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  checked={role === 'job_seeker'}
                  onChange={() => setRole('job_seeker')}
                  className="mr-2"
                />
                Job Seeker
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  checked={role === 'company'}
                  onChange={() => setRole('company')}
                  className="mr-2"
                />
                Company
              </label>
            </div>
          </div>

          {role === 'company' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Company Name"
                className="w-full px-4 py-3 bg-background border border-muted rounded focus:outline-none focus:ring-2 focus:ring-primary"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-primary text-white font-medium rounded hover:bg-accent transition-colors"
          >
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
