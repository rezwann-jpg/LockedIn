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
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 lg:p-10">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-text">Employer Dashboard</h1>
                        <p className="text-muted">Manage your job postings and candidates</p>
                    </div>
                    <button
                        onClick={() => navigate('/jobs/post')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-accent transition-colors font-medium shadow-sm"
                    >
                        <Plus size={18} />
                        Post a New Job
                    </button>
                </header>

                {error && (
                    <div className="p-4 mb-6 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-secondary p-6 rounded-xl border border-muted/30 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <p className="text-muted text-sm font-medium">Active Jobs</p>
                                <p className="text-2xl font-bold text-text">{jobs.filter(j => j.isActive).length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-secondary p-6 rounded-xl border border-muted/30 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-muted text-sm font-medium">Total Applicants</p>
                                <p className="text-2xl font-bold text-text">
                                    {jobs.reduce((acc, job) => acc + (job.applicationCount || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-secondary p-6 rounded-xl border border-muted/30 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                                <Eye size={24} />
                            </div>
                            <div>
                                <p className="text-muted text-sm font-medium">Total Views</p>
                                <p className="text-2xl font-bold text-text">
                                    {jobs.reduce((acc, job) => acc + (job.viewsCount || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <section>
                    <h2 className="text-xl font-semibold text-text mb-4">Your Job Postings</h2>

                    {jobs.length === 0 ? (
                        <div className="text-center py-12 bg-secondary rounded-xl border border-dashed border-muted/40">
                            <Briefcase size={48} className="mx-auto text-muted/50 mb-4" />
                            <h3 className="text-lg font-medium text-text mb-2">No jobs posted yet</h3>
                            <p className="text-muted mb-6">Start hiring by posting your first job opening.</p>
                            <button
                                onClick={() => navigate('/jobs/post')}
                                className="px-6 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                            >
                                Create Job Post
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {jobs.map(job => (
                                <div key={job.id} className="bg-secondary rounded-xl border border-muted/30 p-6 hover:border-primary/30 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-semibold text-text">{job.title}</h3>
                                                {job.isActive ? (
                                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">Active</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 text-xs font-medium rounded-full">Closed</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted">
                                                <span>{job.location}</span>
                                                <span>•</span>
                                                <span>{job.jobType.replace('_', ' ')}</span>
                                                <span>•</span>
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    <span>Posted {formatDate(job.postedAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <span className="block text-lg font-bold text-text">{job.applicationCount}</span>
                                                <span className="text-xs text-muted uppercase tracking-wider">Applicants</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-lg font-bold text-text">{job.viewsCount}</span>
                                                <span className="text-xs text-muted uppercase tracking-wider">Views</span>
                                            </div>
                                            <div className="w-px h-10 bg-muted/30 hidden md:block"></div>
                                            <button
                                                className="px-4 py-2 border border-muted rounded-lg text-sm font-medium hover:bg-background transition-colors"
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
