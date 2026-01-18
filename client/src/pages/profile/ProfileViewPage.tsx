import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { AxiosError } from 'axios';

type Education = {
  id: number;
  school: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
};

type Experience = {
  id: number;
  company: string;
  position: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  currentlyWorking: boolean;
  description: string | null;
};

type ProfileData = {
  skills: string[];
  educations: Education[];
  experiences: Experience[];
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function ProfileViewPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<{ profile: ProfileData }>('/profile');
        setProfile(res.data.profile);
      } catch (err) {
        console.error(err);
        if (err instanceof AxiosError) {
          if (err.response?.status === 401) {
            logout();
            return;
          }
          setError('Failed to load profile. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user, logout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-text">
          <svg
            className="animate-spin h-5 w-5 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-text mb-4 text-center">
          You need to be signed in to view your profile.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-accent transition-colors font-medium"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const skills = profile?.skills ?? [];
  const educations = profile?.educations ?? [];
  const experiences = profile?.experiences ?? [];

  const isProfileEmpty = skills.length === 0 && educations.length === 0 && experiences.length === 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text mb-1">My Profile</h1>
            <p className="text-muted">Manage your professional information</p>
          </div>
          <button
            onClick={() => logout()}
            className="px-4 py-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="bg-secondary p-6 rounded-xl border border-muted/30 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-text mb-1">{user.name}</h2>
              <p className="text-muted mb-3">{user.email}</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                {user.role === 'job_seeker' ? '👤 Job Seeker' : '🏢 Company'}
              </span>
            </div>

            <button
              onClick={() => navigate('/profile/setup')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent transition-colors font-medium"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {isProfileEmpty && (
          <div className="bg-secondary rounded-xl border border-muted/30 p-8 text-center mb-8">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-text mb-2">Complete Your Profile</h3>
            <p className="text-muted mb-6 max-w-md mx-auto">
              Add your skills, education, and work experience to help employers find you and stand out from other candidates.
            </p>
            <button
              onClick={() => navigate('/profile/setup')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent transition-colors font-medium"
            >
              Get Started
            </button>
          </div>
        )}

        <section className="bg-secondary rounded-xl border border-muted/30 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <span className="text-xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-text">Skills</h3>
            </div>
            <button
              onClick={() => navigate('/profile/setup')}
              className="text-primary hover:text-accent text-sm font-medium transition-colors"
            >
              Edit
            </button>
          </div>

          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span
                  key={`${skill}-${i}`}
                  className="px-3 py-1.5 bg-primary/20 text-primary rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-background/50 rounded-lg border-2 border-dashed border-muted/30">
              <p className="text-muted">No skills added yet.</p>
            </div>
          )}
        </section>

        <section className="bg-secondary rounded-xl border border-muted/30 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <span className="text-xl">🎓</span>
              </div>
              <h3 className="text-xl font-semibold text-text">Education</h3>
            </div>
            <button
              onClick={() => navigate('/profile/setup')}
              className="text-primary hover:text-accent text-sm font-medium transition-colors"
            >
              Edit
            </button>
          </div>

          {educations.length > 0 ? (
            <div className="space-y-4">
              {educations.map((edu) => (
                <div
                  key={edu.id}
                  className="bg-background p-4 rounded-lg border border-muted/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-text text-lg">{edu.school}</h4>
                      <p className="text-primary font-medium">
                        {edu.degree}
                        {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                      </p>
                    </div>
                    <span className="text-sm text-muted whitespace-nowrap">
                      {formatDate(edu.startDate)} — {formatDate(edu.endDate) || 'Present'}
                    </span>
                  </div>
                  {edu.description && (
                    <p className="text-muted mt-2 text-sm">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-background/50 rounded-lg border-2 border-dashed border-muted/30">
              <p className="text-muted">No education listed.</p>
            </div>
          )}
        </section>

        <section className="bg-secondary rounded-xl border border-muted/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <span className="text-xl">💼</span>
              </div>
              <h3 className="text-xl font-semibold text-text">Work Experience</h3>
            </div>
            <button
              onClick={() => navigate('/profile/setup')}
              className="text-primary hover:text-accent text-sm font-medium transition-colors"
            >
              Edit
            </button>
          </div>

          {experiences.length > 0 ? (
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-background p-4 rounded-lg border border-muted/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-text text-lg">{exp.position}</h4>
                      <p className="text-primary font-medium">
                        {exp.company}
                        {exp.location && (
                          <span className="text-muted font-normal"> • {exp.location}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-muted whitespace-nowrap">
                        {formatDate(exp.startDate)} — {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                      </span>
                      {exp.currentlyWorking && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                            Current
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-muted mt-2 text-sm">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-background/50 rounded-lg border-2 border-dashed border-muted/30">
              <p className="text-muted">No experience listed.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
