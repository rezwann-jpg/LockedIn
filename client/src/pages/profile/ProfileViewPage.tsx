import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { AxiosError } from 'axios';
import {
  Briefcase,
  GraduationCap,
  MapPin,
  Calendar,
  Edit2,
  LogOut,
  User as UserIcon,
  Mail,
  Building,
  Award,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

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

type MatchedJob = {
  id: number;
  title: string;
  salary_min: number | null;
  salary_max: number | null;
  posted_at: string;
  company_name: string;
  company_logo: string | null;
  matching_skills: number;
  total_skills: number;
  match_percentage: number;
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
  const [matchedJobs, setMatchedJobs] = useState<MatchedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<{ profile: ProfileData }>('/profile');
        setProfile(res.data.profile);

        // Fetch matched jobs if user is a seeker
        if (user?.role === 'job_seeker') {
          fetchMatchedJobs();
        }
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

    const fetchMatchedJobs = async () => {
      setMatchingLoading(true);
      try {
        const res = await api.get<{ jobs: MatchedJob[] }>('/jobs/matched');
        setMatchedJobs(res.data.jobs);
      } catch (err) {
        console.error('Failed to fetch matched jobs:', err);
      } finally {
        setMatchingLoading(false);
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
          <Loader2 className="animate-spin h-6 w-6 text-primary" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="mb-4 text-muted/50">
          <UserIcon size={64} />
        </div>
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
            className="flex items-center gap-2 px-4 py-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="bg-secondary p-6 rounded-xl border border-muted/30 mb-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-3xl font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-text mb-1">{user.name}</h2>
              <div className="flex items-center gap-2 text-muted mb-3">
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium">
                {user.role === 'job_seeker' ? <UserIcon size={14} /> : <Building size={14} />}
                {user.role === 'job_seeker' ? 'Job Seeker' : 'Company'}
              </span>
            </div>

            <button
              onClick={() => navigate('/profile/setup')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent transition-colors font-medium shadow-sm"
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          </div>
        </div>

        {isProfileEmpty && (
          <div className="bg-secondary rounded-xl border border-dashed border-muted p-10 text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-background rounded-full mb-4">
              <Edit2 size={32} className="text-muted" />
            </div>
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

        <section className="bg-secondary rounded-xl border border-muted/30 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <Award size={20} />
              </div>
              <h3 className="text-xl font-semibold text-text">Skills</h3>
            </div>
            <button
              onClick={() => navigate('/profile/setup')}
              className="text-primary hover:text-accent text-sm font-medium transition-colors p-2 hover:bg-background rounded"
            >
              <Edit2 size={16} />
            </button>
          </div>

          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span
                  key={`${skill}-${i}`}
                  className="px-3 py-1.5 bg-background border border-muted/30 text-text rounded-md text-sm font-medium hover:border-primary/50 transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted italic">No skills added yet.</p>
          )}
        </section>

        {user.role === 'job_seeker' && (
          <section className="bg-secondary rounded-xl border border-muted/30 p-6 mb-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Sparkles size={120} />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-xl font-semibold text-text">Recommended Jobs</h3>
              </div>
              <button
                onClick={() => navigate('/jobs')}
                className="text-primary hover:text-accent text-sm font-medium transition-colors flex items-center gap-1"
              >
                Browse All <ArrowRight size={14} />
              </button>
            </div>

            {matchingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : matchedJobs.length > 0 ? (
              <div className="grid gap-4">
                {matchedJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="group bg-background p-4 rounded-lg border border-muted/20 hover:border-primary/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center text-lg font-bold text-muted overflow-hidden">
                          {job.company_logo ? (
                            <img src={job.company_logo} alt={job.company_name} className="w-full h-full object-cover" />
                          ) : (
                            job.company_name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-text group-hover:text-primary transition-colors line-clamp-1">{job.title}</h4>
                          <p className="text-sm text-muted">{job.company_name}</p>
                          <div className="flex items-center gap-3 mt-2">
                            {job.salary_min && (
                              <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                                ${job.salary_min.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                              </span>
                            )}
                            <span className="text-xs text-muted">
                              Matched {job.matching_skills}/{job.total_skills} skills
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <div className="text-lg font-bold text-primary">
                          {Math.round(job.match_percentage)}%
                        </div>
                        <span className="text-[10px] text-muted uppercase tracking-wider font-bold">Match Score</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background/30 rounded-lg border border-dashed border-muted/20">
                <Sparkles className="mx-auto text-muted/30 mb-2" size={32} />
                <p className="text-muted text-sm">Add more skills to see personalized job recommendations!</p>
              </div>
            )}
          </section>
        )}

        <section className="bg-secondary rounded-xl border border-muted/30 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                <GraduationCap size={20} />
              </div>
              <h3 className="text-xl font-semibold text-text">Education</h3>
            </div>
            <button
              onClick={() => navigate('/profile/setup')}
              className="text-primary hover:text-accent text-sm font-medium transition-colors p-2 hover:bg-background rounded"
            >
              <Edit2 size={16} />
            </button>
          </div>

          {educations.length > 0 ? (
            <div className="space-y-4">
              {educations.map((edu) => (
                <div
                  key={edu.id}
                  className="group relative pl-4 border-l-2 border-muted/30 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-text text-lg">{edu.school}</h4>
                      <p className="text-primary font-medium">
                        {edu.degree}
                        {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted">
                      <Calendar size={14} />
                      <span>
                        {formatDate(edu.startDate)} — {formatDate(edu.endDate) || 'Present'}
                      </span>
                    </div>
                  </div>
                  {edu.description && (
                    <p className="text-muted mt-2 text-sm">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted italic">No education listed.</p>
          )}
        </section>

        <section className="bg-secondary rounded-xl border border-muted/30 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                <Briefcase size={20} />
              </div>
              <h3 className="text-xl font-semibold text-text">Work Experience</h3>
            </div>
            <button
              onClick={() => navigate('/profile/setup')}
              className="text-primary hover:text-accent text-sm font-medium transition-colors p-2 hover:bg-background rounded"
            >
              <Edit2 size={16} />
            </button>
          </div>

          {experiences.length > 0 ? (
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="group relative pl-4 border-l-2 border-muted/30 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="font-semibold text-text text-lg">{exp.position}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-medium">{exp.company}</span>
                        {exp.location && (
                          <>
                            <span className="text-muted">•</span>
                            <span className="text-muted text-sm flex items-center gap-1">
                              <MapPin size={12} />
                              {exp.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-sm text-muted mb-1">
                        <Calendar size={14} />
                        <span>
                          {formatDate(exp.startDate)} — {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                        </span>
                      </div>
                      {exp.currentlyWorking && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-xs font-medium">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-muted mt-2 text-sm leading-relaxed">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted italic">No experience listed.</p>
          )}
        </section>
      </div>
    </div>
  );
}
