import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import api from '../../lib/api';
import { Plus, Users, Briefcase, Eye, Calendar, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';

type Job = {
    id: number;
    title: string;
    location: string;
    jobType: string;
    applicationCount: number;
    viewsCount: number;
    isActive: boolean;
    postedAt: string;
};

// ... existing formatDate helpers in other files, keeping it simple here
function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}


export default function EmployerDashboard() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'company')) {
            navigate('/');
            return;
        }

        const fetchJobs = async () => {
            try {
                const res = await api.get<{ jobs: Job[] }>('/company/jobs');
                setJobs(res.data.jobs);
            } catch (err) {
                console.error(err);
                if (err instanceof AxiosError) {
                    if (err.response?.status === 401) {
                        navigate('/login');
                    } else if (err.response?.status === 404) {
                        navigate('/onboarding/company-profile', {
                            state: { redirectAfter: '/employer/dashboard' }
                        });
                    } else {
                        setError('Failed to load your jobs.');
                    }
                } else {
                    setError('Failed to load your jobs.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (user && user.role === 'company') {
            fetchJobs();
        }
    }, [user, authLoading, navigate]);

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-muted font-medium animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'Active Jobs', value: jobs.filter(j => j.isActive).length, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Total Applicants', value: jobs.reduce((acc, job) => acc + (job.applicationCount || 0), 0), icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Total Views', value: jobs.reduce((acc, job) => acc + (job.viewsCount || 0), 0), icon: Eye, color: 'text-green-500', bg: 'bg-green-500/10' },
    ];

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background p-6 lg:p-10 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-6xl mx-auto space-y-10">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold text-text tracking-tight">Employer Dashboard</h1>
                        <p className="text-muted text-lg">Manage your job postings and grow your team.</p>
                    </div>
                    <button
                        onClick={() => navigate('/jobs/post')}
                        className="group flex items-center gap-3 px-6 py-3.5 bg-primary text-white rounded-2xl hover:bg-accent transition-all font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        Post a New Job
                    </button>
                </header>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <span className="text-lg">⚠️</span>
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-secondary/50 backdrop-blur-xl p-8 rounded-3xl border border-muted/20 shadow-xl group hover:border-primary/30 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon size={28} />
                                </div>
                                <span className="text-4xl font-black text-text tracking-tighter">{stat.value}</span>
                            </div>
                            <p className="text-muted font-bold uppercase tracking-widest text-xs">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-text tracking-tight">Your Job Postings</h2>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-muted/20 to-transparent"></div>
                    </div>

                    {jobs.length === 0 ? (
                        <div className="text-center py-20 bg-secondary/30 backdrop-blur-md rounded-3xl border-2 border-dashed border-muted/20">
                            <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6 text-muted/30">
                                <Briefcase size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-text mb-2">No jobs posted yet</h3>
                            <p className="text-muted mb-8 max-w-sm mx-auto font-medium">Start hiring by posting your first job opening to find your perfect match.</p>
                            <button
                                onClick={() => navigate('/jobs/post')}
                                className="px-8 py-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all font-bold"
                            >
                                Create Job Post
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {jobs.map(job => (
                                <div key={job.id} className="group bg-secondary/50 backdrop-blur-xl rounded-3xl border border-muted/20 p-8 hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/5">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-2xl font-bold text-text group-hover:text-primary transition-colors">{job.title}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${job.isActive
                                                        ? 'bg-green-500/10 text-green-500'
                                                        : 'bg-muted/10 text-muted'
                                                    }`}>
                                                    {job.isActive ? 'Active' : 'Closed'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted font-medium">
                                                <span className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                                                    {job.location}
                                                </span>
                                                <span className="flex items-center gap-2 capitalize">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                                                    {job.jobType.replace('_', ' ')}
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-primary/50" />
                                                    Posted {formatDate(job.postedAt)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 md:gap-12 pl-6 md:pl-12 md:border-l border-muted/20">
                                            <div className="text-center group-hover:scale-105 transition-transform">
                                                <span className="block text-2xl font-black text-text tracking-tighter">
                                                    {job.applicationCount || 0}
                                                </span>
                                                <span className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">Applicants</span>
                                            </div>
                                            <div className="text-center group-hover:scale-105 transition-transform delay-75">
                                                <span className="block text-2xl font-black text-text tracking-tighter">
                                                    {job.viewsCount || 0}
                                                </span>
                                                <span className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">Views</span>
                                            </div>
                                            <button
                                                className="px-6 py-3 border-2 border-muted/30 rounded-2xl text-sm font-bold text-text hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                                                onClick={() => { /* View Applicants logic later */ }}
                                            >
                                                Manage
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
