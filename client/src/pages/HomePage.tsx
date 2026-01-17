import React from 'react';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b border-muted">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">LockedIn</h1>
          <nav>
            <button className="px-4 py-2 text-text hover:text-primary transition-colors">
              Sign In
            </button>
            <button className="ml-3 px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Find Your Next Role.
            <br />
            <span className="text-primary">Stay Locked In.</span>
          </h2>
          <p className="mt-6 text-lg text-muted max-w-xl mx-auto">
            A job board built for focus — detailed company profiles, smart matching, and zero distractions.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-accent transition-colors">
              Browse Jobs
            </button>
            <button className="px-6 py-3 bg-secondary text-text font-medium rounded-lg border border-muted hover:bg-muted transition-colors">
              For Employers
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-secondary border-t border-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">About LockedIn</h3>
              <p className="text-muted text-sm">
                We help developers find meaningful roles at companies that value focus, craftsmanship, and deep work.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text mb-4">For Job Seekers</h3>
              <ul className="space-y-2 text-muted text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Browse Jobs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Profile Tips</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Application Tracker</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text mb-4">For Companies</h3>
              <ul className="space-y-2 text-muted text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Post a Job</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Company Profiles</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Subscription Plans</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text mb-4">Support</h3>
              <ul className="space-y-2 text-muted text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
