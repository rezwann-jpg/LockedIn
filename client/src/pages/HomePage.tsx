import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b border-muted bg-background">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">LockedIn</h1>

          <nav>
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === 'job_seeker' ? (
                  <Link
                    to="/profile"
                    className="px-4 py-2 text-text hover:text-primary transition-colors"
                  >
                    My Profile
                  </Link>
                ) : (
                  <Link
                    to="/jobs/post"
                    className="px-4 py-2 text-text hover:text-primary transition-colors"
                  >
                    Post a Job
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="text-text hover:text-primary"
                >
                  {user.name}
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1 text-sm text-muted hover:text-primary transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div>
                <Link
                  to="/login"
                  className="px-4 py-2 text-text hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="ml-3 px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text">
            Find Your Next Role.
            <br />
            <span className="text-primary">Stay Locked In.</span>
          </h2>
          <p className="mt-6 text-lg text-muted max-w-xl mx-auto">
            A job board built for focus — detailed company profiles, smart matching, and zero distractions.
          </p>

          {user ? (
            user.role === 'job_seeker' ? (
              <div className="mt-8">
                <Link
                  to="/jobs"
                  className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-accent transition-colors"
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="mt-8">
                <Link
                  to="/jobs/post"
                  className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-accent transition-colors"
                >
                  Post a New Job
                </Link>
              </div>
            )
          ) : (
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/signup"
                className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-accent transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/jobs"
                className="px-6 py-3 bg-secondary text-text font-medium rounded-lg border border-muted hover:bg-muted transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-secondary border-t border-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        </div>
      </footer>
    </div>
  );
}
