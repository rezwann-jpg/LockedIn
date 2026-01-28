import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { User as UserIcon } from 'lucide-react';

import api from '../../lib/api';
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
      name: role === 'company' ? companyName : name,
      email,
      password,
      role,
      ...(role === 'company'
        ? { company: { name: companyName } }
        : {}),
    };

    try {
      await signup(payload);

      if (role === 'company') {
        try {
          await api.get('/company/profile');
          navigate('/employer/dashboard');
        } catch (err) {
          if (err instanceof AxiosError && err.response?.status === 404) {
            navigate('/onboarding/company-profile', {
              state: {
                redirectAfter: '/employer/dashboard',
                companyName: companyName
              }
            });
          } else {
            navigate('/employer/dashboard');
          }
        }
      } else {
        navigate('/profile/setup');
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error ?? 'Signup failed');
      } else {
        setError('Signup failed');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md bg-secondary/50 backdrop-blur-xl rounded-2xl p-8 border border-muted/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4 text-primary">
            <UserIcon size={24} />
          </div>
          <h2 className="text-3xl font-bold text-text tracking-tight">
            Create Account
          </h2>
          <p className="text-muted mt-2">Join LockedIn and take the next step</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-3">
            <span className="shrink-0 text-lg">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-background/50 rounded-xl p-1 border border-muted/20 flex mb-6">
            <button
              type="button"
              onClick={() => setRole('job_seeker')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${role === 'job_seeker'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted hover:text-text'
                }`}
            >
              Job Seeker
            </button>
            <button
              type="button"
              onClick={() => setRole('company')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${role === 'company'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted hover:text-text'
                }`}
            >
              Company
            </button>
          </div>

          {role === 'job_seeker' && (
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 ml-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-background/50 border border-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          {role === 'company' && (
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 ml-1">
                Company Name
              </label>
              <input
                type="text"
                placeholder="Acme Inc."
                className="w-full px-4 py-3 bg-background/50 border border-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 ml-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-background/50 border border-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-background/50 border border-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-accent transition-all shadow-xl shadow-primary/20 mt-4 active:scale-[0.98]"
          >
            Create Account
          </button>
        </form>

        <p className="mt-8 text-center text-muted text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline decoration-2 underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
