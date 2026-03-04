import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import api from '../../lib/api';
import { Plus, Users, Briefcase, Eye, Calendar, Loader2, Edit2 } from 'lucide-react';
import { AxiosError } from 'axios';
import JobApplicantsList from '../../components/JobApplicantsList';
import CompanySubscribers from '../../components/CompanySubscribers';

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
    const [selectedJob, setSelectedJob] = useState<{ id: number, title: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'listings' | 'subscribers'>('listings');

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
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-6xl mx-auto space-y-10">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black text-text tracking-tight uppercase">Employer <span className="text-primary">Dashboard</span></h1>
                        <p className="text-muted text-lg font-medium">Manage your job postings and grow your team.</p>
                    </div>
                    <button
                        onClick={() => navigate('/jobs/post')}
                        className="group flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-[24px] hover:bg-accent transition-all font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
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
                        <div key={idx} className="bg-secondary/40 backdrop-blur-2xl p-8 rounded-[40px] border border-muted/10 shadow-xl group hover:border-primary/30 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-5 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon size={32} />
                                </div>
                                <span className="text-5xl font-black text-text tracking-tighter">{stat.value}</span>
                            </div>
                            <p className="text-muted font-black uppercase tracking-[0.2em] text-[10px]">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-4 border-b border-muted/10 pb-2">
                    <button
                        onClick={() => setActiveTab('listings')}
                        className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'listings' ? 'text-primary' : 'text-muted hover:text-text'}`}
                    >
                        Listings
                        {activeTab === 'listings' && <div className="absolute bottom-[-2px] left-0 w-full h-[3px] bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('subscribers')}
                        className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'subscribers' ? 'text-primary' : 'text-muted hover:text-text'}`}
                    >
                        Followers
                        {activeTab === 'subscribers' && <div className="absolute bottom-[-2px] left-0 w-full h-[3px] bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></div>}
                    </button>
                </div>

                {activeTab === 'listings' ? (
                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black text-text tracking-tight uppercase italic">Active <span className="text-primary">Openings</span></h2>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-muted/20 to-transparent"></div>
                        </div>

                        {jobs.length === 0 ? (
                            <div className="text-center py-20 bg-secondary/20 backdrop-blur-md rounded-[48px] border-2 border-dashed border-muted/10">
                                <div className="w-24 h-24 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6 text-muted/20">
                                    <Briefcase size={48} />
                                </div>
                                <h3 className="text-3xl font-black text-text mb-2">No jobs posted yet</h3>
                                <p className="text-muted mb-8 max-w-sm mx-auto font-bold uppercase tracking-wide text-sm">Start hiring by posting your first job opening.</p>
                                <button
                                    onClick={() => navigate('/jobs/post')}
                                    className="px-10 py-4 bg-primary text-white rounded-2xl hover:bg-accent transition-all font-black uppercase tracking-widest shadow-lg"
                                >
                                    Create Job Post
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-8">
                                {jobs.map(job => (
                                    <div key={job.id} className="group bg-secondary/50 backdrop-blur-xl rounded-[40px] border border-muted/10 p-8 md:p-10 hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/5">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                            <div className="space-y-5">
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <h3 className="text-3xl font-black text-text group-hover:text-primary transition-colors tracking-tight">{job.title}</h3>
                                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${job.isActive
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                        : 'bg-muted/10 text-muted border border-muted/20'
                                                        }`}>
                                                        {job.isActive ? 'Active' : 'Closed'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-8 text-sm text-muted font-black uppercase tracking-widest">
                                                    <span className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"></div>
                                                        {job.location}
                                                    </span>
                                                    <span className="flex items-center gap-3">
                                                        <Briefcase size={16} className="text-primary/50" />
                                                        {job.jobType.replace('_', ' ')}
                                                    </span>
                                                    <span className="flex items-center gap-3">
                                                        <Calendar size={16} className="text-primary/50" />
                                                        {formatDate(job.postedAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8 md:gap-16 pl-8 md:pl-16 md:border-l border-muted/10">
                                                <div className="text-center group-hover:scale-110 transition-transform duration-500">
                                                    <span className="block text-4xl font-black text-text tracking-tighter">
                                                        {job.applicationCount || 0}
                                                    </span>
                                                    <span className="text-[10px] text-muted font-black uppercase tracking-[0.2em] mt-2 block">Applicants</span>
                                                </div>
                                                <div className="text-center group-hover:scale-110 transition-transform duration-500 delay-100">
                                                    <span className="block text-4xl font-black text-text tracking-tighter">
                                                        {job.viewsCount || 0}
                                                    </span>
                                                    <span className="text-[10px] text-muted font-black uppercase tracking-[0.2em] mt-2 block">Views</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        className="p-4 bg-background border-2 border-muted/10 rounded-2xl text-muted hover:text-primary hover:border-primary transition-all duration-300 shadow-xl hover:scale-[1.05]"
                                                        onClick={() => navigate(`/jobs/edit/${job.id}`)}
                                                        title="Edit Job"
                                                    >
                                                        <Edit2 size={20} />
                                                    </button>
                                                    <button
                                                        className="px-10 py-4 bg-background border-2 border-muted/10 rounded-2xl text-sm font-black uppercase tracking-widest text-text hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-2xl hover:scale-[1.05]"
                                                        onClick={() => setSelectedJob({ id: job.id, title: job.title })}
                                                    >
                                                        Manage
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CompanySubscribers />
                    </section>
                )}
            </div>

            {selectedJob && (
                <JobApplicantsList
                    jobId={selectedJob.id}
                    jobTitle={selectedJob.title}
                    onClose={() => setSelectedJob(null)}
                />
            )}
        </div>
    );
}
