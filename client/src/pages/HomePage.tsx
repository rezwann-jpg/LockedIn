import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="bg-background">
      <main className="min-h-[calc(100vh-64px-200px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-3xl text-center relative z-10">
          <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-text mb-8">
            Find Your Next Role.
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Stay Locked In.</span>
          </h2>
          <p className="mt-6 text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            A job board built for focus — detailed company profiles, smart matching, and zero distractions.
          </p>

          {user ? (
            user.role === 'job_seeker' ? (
              <div className="mt-12">
                <Link
                  to="/jobs"
                  className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-accent transition-all transform hover:scale-105 shadow-xl shadow-primary/25"
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="mt-12">
                <Link
                  to="/jobs/post"
                  className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-accent transition-all transform hover:scale-105 shadow-xl shadow-primary/25"
                >
                  Post a New Job
                </Link>
              </div>
            )
          ) : (
            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
              <Link
                to="/signup"
                className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-accent transition-all transform hover:scale-105 shadow-xl shadow-primary/25"
              >
                Get Started
              </Link>
              <Link
                to="/jobs"
                className="px-8 py-4 bg-secondary text-text font-bold rounded-xl border border-muted/50 hover:bg-muted/50 transition-all transform hover:scale-105"
              >
                Browse Jobs
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
