import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Briefcase, MapPin, Clock, Search, Loader2, ArrowUpDown, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';

type Job = {
    id: number;
    title: string;
    description: string;
    location: string;
    jobType: string;
    salaryMin: number | null;
    salaryMax: number | null;
    postedAt: string;
    companyName?: string;
    companyLogo?: string;
    match_percentage?: number;
    matching_skills?: number;
    total_skills?: number;
};

export default function JobSearchPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'recent' | 'match'>('recent');
    const [applyingId, setApplyingId] = useState<number | null>(null);
    const [appliedJobs, setAppliedJobs] = useState<number[]>([]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const url = sortOrder === 'match' ? '/jobs/matched' : '/jobs';
            const params = new URLSearchParams();
            if (selectedCategory) params.append('categoryId', selectedCategory);

            const res = await api.get<{ jobs: Job[] }>(`${url}${params.toString() ? `?${params.toString()}` : ''}`);
            setJobs(res.data.jobs);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [sortOrder, selectedCategory]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get<{ categories: { id: number; name: string }[] }>('/categories');
                setCategories(res.data.categories);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const handleApply = async (e: React.MouseEvent, jobId: number) => {
        e.stopPropagation();
        setApplyingId(jobId);
        try {
            await api.post(`/jobs/${jobId}/apply`);
            setAppliedJobs(prev => [...prev, jobId]);
        } catch (err) {
            console.error('Failed to apply:', err);
            alert('Failed to apply for this job. You might have already applied.');
        } finally {
            setApplyingId(null);
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-background py-16 px-4 md:px-8 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-50">
                <div className="absolute top-[5%] right-[5%] w-64 h-64 bg-primary/5 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[20%] left-[5%] w-80 h-80 bg-accent/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-text mb-4 tracking-tight">
                        Explore <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Opportunities</span>
                    </h1>
                    <p className="text-muted text-lg font-medium max-w-2xl mx-auto">Find your next career move with LockedIn's focused job matching.</p>
                </header>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by title or location..."
                            className="w-full pl-10 pr-4 py-3 bg-secondary border border-muted/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {user?.role === 'job_seeker' && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-secondary border border-muted/30 rounded-xl px-4 py-2">
                                <Search size={18} className="text-muted" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-transparent text-text border-none focus:ring-0 font-medium cursor-pointer"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 bg-secondary border border-muted/30 rounded-xl px-4 py-2">
                                <ArrowUpDown size={18} className="text-muted" />
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as any)}
                                    className="bg-transparent text-text border-none focus:ring-0 font-medium cursor-pointer"
                                >
                                    <option value="recent">Most Recent</option>
                                    <option value="match">Best Match</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin h-10 w-10 text-primary mb-4" />
                        <p className="text-muted">Fetching latest jobs...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map(job => (
                                <div key={job.id} className="bg-secondary rounded-xl border border-muted/30 p-6 hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors mb-2">{job.title}</h3>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={16} className="text-primary" />
                                                    {job.location}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={16} className="text-primary" />
                                                    {job.jobType.replace('_', ' ')}
                                                </div>
                                                {job.salaryMin && (
                                                    <div className="font-medium text-emerald-400">
                                                        ${job.salaryMin.toLocaleString()} - {job.salaryMax?.toLocaleString()}
                                                    </div>
                                                )}
                                                {job.match_percentage !== undefined && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20 font-bold">
                                                        {Math.round(job.match_percentage)}% Match
                                                    </div>
                                                )}
                                            </div>
                                            <p className="mt-4 text-muted line-clamp-2 text-sm leading-relaxed">
                                                {job.description}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleApply(e, job.id)}
                                            disabled={applyingId === job.id || appliedJobs.includes(job.id)}
                                            className={`px-6 py-2.5 font-semibold rounded-lg transition-all flex items-center gap-2 ${appliedJobs.includes(job.id)
                                                ? 'bg-emerald-500/20 text-emerald-500 cursor-default'
                                                : 'bg-primary text-white hover:bg-accent hover:scale-105 shadow-lg shadow-primary/20'
                                                }`}
                                        >
                                            {applyingId === job.id ? (
                                                <Loader2 className="animate-spin" size={18} />
                                            ) : appliedJobs.includes(job.id) ? (
                                                <><CheckCircle size={18} /> Applied</>
                                            ) : (
                                                'Apply Now'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-secondary rounded-xl border border-dashed border-muted/40">
                                <Briefcase size={48} className="mx-auto text-muted/30 mb-4" />
                                <h3 className="text-xl font-medium text-text">No jobs found</h3>
                                <p className="text-muted mt-2">Try adjusting your search criteria</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
