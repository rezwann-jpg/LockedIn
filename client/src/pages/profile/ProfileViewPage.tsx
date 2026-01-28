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
  salaryMin: number | null;
  salaryMax: number | null;
  postedAt: string;
  companyName: string;
  companyLogo: string | null;
  matching_skills: number;
  total_skills: number;
  match_percentage: number;
};

type CompanyData = {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  logoUrl: string | null;
  isVerified: boolean;
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
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<MatchedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<{ profile: ProfileData; company: CompanyData | null }>('/profile');
        setProfile(res.data.profile);
        setCompany(res.data.company);

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
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-secondary/50 via-background to-background">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[0%] right-[10%] w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full"></div>
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-end">
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-primary/20 rounded-3xl flex items-center justify-center text-5xl font-bold text-primary shadow-2xl shadow-primary/20 transform group-hover:scale-[1.02] transition-transform duration-300">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => navigate('/profile/setup')}
                className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 hover:bg-accent transition-all active:scale-95"
              >
                <Edit2 size={18} />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-bold text-text tracking-tight">{user.name || 'Your Profile'}</h1>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-muted pt-2">
                  <span className="flex items-center gap-2 px-4 py-1.5 bg-background/50 border border-muted/20 rounded-full text-sm font-medium backdrop-blur-sm">
                    {user.role === 'job_seeker' ? <UserIcon size={14} /> : <Building size={14} />}
                    {user.role === 'job_seeker' ? 'Job Seeker' : 'Company'}
                  </span>
                  <span className="flex items-center gap-2 py-1.5 text-sm">
                    <Mail size={16} className="text-primary/70" />
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-end gap-3 self-center">
              <div className="text-right">
                <p className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-1">Profile Strength</p>
                <div className="w-48 h-2 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: isProfileEmpty ? '20%' : '85%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <span className="shrink-0 text-lg">⚠️</span>
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-20">
            {/* Skills Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-2xl">
                  <Award size={24} />
                </div>
                <h2 className="text-2xl font-bold text-text tracking-tight">Expertise & Skills</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-muted/30 to-transparent ml-4"></div>
              </div>

              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill, i) => (
                    <span
                      key={`${skill}-${i}`}
                      className="px-5 py-2.5 bg-secondary/30 border border-muted/10 text-text rounded-2xl text-sm font-medium hover:border-primary/50 hover:bg-primary/5 transition-all cursor-default shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : user.role === 'job_seeker' ? (
                <div className="group border-2 border-dashed border-muted/20 rounded-3xl p-10 text-center hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate('/profile/setup')}>
                  <Sparkles className="mx-auto text-muted/30 mb-4 group-hover:text-primary/50 transition-colors" size={40} />
                  <p className="text-muted text-lg">Add your skills to showcase your expertise.</p>
                </div>
              ) : null}
            </section>

            {/* Company Info section for Employers */}
            {user.role === 'company' && company && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                    <Building size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-text tracking-tight">Company Details</h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-muted/30 to-transparent ml-4"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Industry</h4>
                      <p className="text-lg text-text font-medium">{company.industry || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Company Size</h4>
                      <p className="text-lg text-text font-medium">{company.size || 'Not specified'} Employees</p>
                    </div>
                    {company.website && (
                      <div>
                        <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Website</h4>
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-lg text-primary hover:underline font-medium">
                          {company.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                  {company.description && (
                    <div>
                      <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">About</h4>
                      <p className="text-muted leading-relaxed whitespace-pre-wrap">{company.description}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Experience Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-2.5 bg-green-500/10 text-green-500 rounded-2xl">
                  <Briefcase size={24} />
                </div>
                <h2 className="text-2xl font-bold text-text tracking-tight">Work Experience</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-muted/30 to-transparent ml-4"></div>
              </div>

              {experiences.length > 0 ? (
                <div className="space-y-12 ml-4">
                  {experiences.map((exp, idx) => (
                    <div key={exp.id} className="relative pl-12 group">
                      {/* Timeline line */}
                      {idx !== experiences.length - 1 && (
                        <div className="absolute left-[11px] top-8 bottom-[-48px] w-[2px] bg-muted/20"></div>
                      )}

                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-background bg-primary group-hover:scale-110 transition-transform"></div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors">{exp.position}</h3>
                            <div className="flex items-center gap-3 text-lg text-text/80 mt-1">
                              <span className="font-semibold">{exp.company}</span>
                              {exp.location && (
                                <>
                                  <span className="text-muted/40">•</span>
                                  <span className="flex items-center gap-1.5 text-muted text-sm font-medium">
                                    <MapPin size={16} />
                                    {exp.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                              <Calendar size={14} className="text-primary/70" />
                              {formatDate(exp.startDate)} — {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                            </span>
                            {exp.currentlyWorking && (
                              <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                        {exp.description && (
                          <p className="text-muted mt-4 text-base leading-relaxed max-w-2xl">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted/20 rounded-3xl p-10 text-center">
                  <Briefcase className="mx-auto text-muted/30 mb-4" size={40} />
                  <p className="text-muted text-lg">Your professional history will appear here.</p>
                </div>
              )}
            </section>

            {/* Education Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-2xl">
                  <GraduationCap size={24} />
                </div>
                <h2 className="text-2xl font-bold text-text tracking-tight">Education</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-muted/30 to-transparent ml-4"></div>
              </div>

              {educations.length > 0 ? (
                <div className="space-y-10 ml-4">
                  {educations.map((edu, idx) => (
                    <div key={edu.id} className="relative pl-12 group">
                      {idx !== educations.length - 1 && (
                        <div className="absolute left-[11px] top-8 bottom-[-40px] w-[2px] bg-muted/20"></div>
                      )}

                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-background bg-purple-500 group-hover:scale-110 transition-transform"></div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-text group-hover:text-purple-400 transition-colors uppercase tracking-tight">{edu.school}</h3>
                            <p className="text-lg font-medium text-text/80 mt-1">
                              {edu.degree}
                              {edu.fieldOfStudy && (
                                <>
                                  <span className="mx-2 text-muted/40">—</span>
                                  {edu.fieldOfStudy}
                                </>
                              )}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14} className="text-purple-400/70" />
                            {formatDate(edu.startDate)} — {formatDate(edu.endDate) || 'Present'}
                          </span>
                        </div>
                        {edu.description && (
                          <p className="text-muted mt-3 text-base leading-relaxed max-w-2xl">{edu.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted/20 rounded-3xl p-10 text-center">
                  <GraduationCap className="mx-auto text-muted/30 mb-4" size={40} />
                  <p className="text-muted text-lg">Showcase your academic background.</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar Area */}
          <aside className="lg:col-span-4 space-y-12">
            {user.role === 'job_seeker' && (
              <div className="sticky top-24">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-2xl">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-text tracking-tight">Matched Jobs</h3>
                  </div>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="group flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-widest hover:text-accent transition-colors"
                  >
                    All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {matchingLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="text-sm text-muted font-medium">Crunching matches...</p>
                  </div>
                ) : matchedJobs.length > 0 ? (
                  <div className="space-y-6">
                    {matchedJobs.slice(0, 3).map((job) => (
                      <div
                        key={job.id}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="group flex gap-4 p-4 -mx-4 rounded-3xl hover:bg-secondary/30 transition-all cursor-pointer"
                      >
                        <div className="w-14 h-14 bg-background border border-muted/20 rounded-2xl flex items-center justify-center text-xl font-bold text-muted overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
                          {job.companyLogo ? (
                            <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
                          ) : (
                            job.companyName.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <h4 className="font-bold text-text text-base group-hover:text-primary transition-colors truncate">
                            {job.title}
                          </h4>
                          <p className="text-sm text-muted font-medium truncate">{job.companyName}</p>
                          <div className="flex items-center justify-between gap-4 mt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                              {Math.round(job.match_percentage)}% Match
                            </span>
                            {job.salaryMin && (
                              <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md">
                                ${Math.round(job.salaryMin / 1000)}k+
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-6 bg-secondary/20 rounded-3xl border border-dashed border-muted/20">
                    <Sparkles className="mx-auto text-muted/30 mb-4" size={32} />
                    <p className="text-muted text-sm leading-relaxed">Add more skills to unlock personalized career opportunities.</p>
                  </div>
                )}
              </div>
            )}

            <div className="p-8 bg-primary/5 rounded-3xl border border-primary/10">
              <h4 className="font-bold text-text mb-2">Want a new look?</h4>
              <p className="text-sm text-muted mb-6 leading-relaxed">Keep your profile updated to increase your visibility by up to 5x.</p>
              <button
                onClick={() => navigate('/profile/setup')}
                className="w-full py-3 bg-background border border-primary/20 text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all active:scale-95"
              >
                Refine Profile
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
