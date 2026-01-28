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
    matchPercentage?: number;
    matchingSkills?: number;
    totalSkills?: number;
    hasApplied?: boolean;
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
            const params = new URLSearchParams();
            if (selectedCategory) params.append('categoryId', selectedCategory);
            if (sortOrder) params.append('sort', sortOrder);
            if (searchTerm) params.append('search', searchTerm);

            const res = await api.get<{ jobs: Job[] }>(`/jobs?${params.toString()}`);
            setJobs(res.data.jobs);

            // Sync applied states from server
            const alreadyApplied = res.data.jobs
                .filter(j => j.hasApplied)
                .map(j => j.id);
            setAppliedJobs(prev => Array.from(new Set([...prev, ...alreadyApplied])));
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchJobs();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [sortOrder, selectedCategory, searchTerm]);

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
        } finally {
            setApplyingId(null);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background p-6 md:p-12 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/5 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-accent/5 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-6xl mx-auto space-y-12">
                <header className="space-y-4 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-black text-text tracking-tighter">
                        Find Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Dream Career</span>
                    </h1>
                    <p className="text-muted text-lg md:text-xl max-w-2xl font-medium">Discover opportunities that match your skills and aspirations.</p>
                </header>

                {/* Search and Filters */}
                <div className="bg-secondary/50 backdrop-blur-2xl p-4 md:p-6 rounded-[32px] border border-muted/20 shadow-2xl space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-muted group-focus-within:text-primary transition-colors">
                                <Search size={22} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by job title, keywords or location..."
                                className="w-full pl-14 pr-6 py-4 bg-background/50 border border-muted/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-text font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative group">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full md:w-56 appearance-none bg-background/50 border border-muted/20 rounded-2xl px-6 py-4 text-text font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-5 inset-y-0 flex items-center pointer-events-none text-muted group-hover:text-primary transition-colors">
                                    <ArrowUpDown size={16} />
                                </div>
                            </div>

                            {user?.role === 'job_seeker' && (
                                <div className="relative group">
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value as any)}
                                        className="w-full md:w-48 appearance-none bg-background/50 border border-muted/20 rounded-2xl px-6 py-4 text-text font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    >
                                        <option value="recent">Most Recent</option>
                                        <option value="match">Best Match</option>
                                    </select>
                                    <div className="absolute right-5 inset-y-0 flex items-center pointer-events-none text-muted group-hover:text-primary transition-colors">
                                        <ArrowUpDown size={16} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="animate-spin h-12 w-12 text-primary" />
                        <p className="text-muted font-bold animate-pulse text-lg">Curating the best jobs for you...</p>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {jobs.length > 0 ? (
                            jobs.map(job => (
                                <div key={job.id} className="group bg-secondary/50 backdrop-blur-xl rounded-[40px] border border-muted/20 p-8 md:p-10 hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/5 cursor-pointer relative overflow-hidden">
                                    {/* Match Badge */}
                                    {job.matchPercentage !== undefined && (
                                        <div className="absolute top-0 right-0 px-8 py-2 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-bl-[20px] shadow-lg">
                                            {Math.round(job.matchPercentage)}% Match
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row gap-8">
                                        {/* Company Brand */}
                                        <div className="w-20 h-20 md:w-24 md:h-24 bg-background border border-muted/20 rounded-3xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                                            {job.companyLogo ? (
                                                <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-black text-primary">{(job.companyName || 'C').charAt(0)}</span>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-6">
                                            <div className="space-y-2">
                                                <h3 className="text-3xl font-black text-text group-hover:text-primary transition-colors tracking-tight leading-tight">
                                                    {job.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                                    <span className="text-xl font-bold text-muted group-hover:text-text transition-colors">{job.companyName}</span>
                                                    <div className="flex items-center gap-2 text-sm font-black text-primary/70 uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
                                                        <MapPin size={14} />
                                                        {job.location}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-muted leading-relaxed font-medium line-clamp-2 md:line-clamp-3 text-lg">
                                                {job.description}
                                            </p>

                                            <div className="flex flex-wrap items-center justify-between gap-6 pt-4">
                                                <div className="flex flex-wrap items-center gap-6">
                                                    <div className="flex items-center gap-2 text-muted font-bold">
                                                        <Clock size={18} className="text-primary/50" />
                                                        <span className="capitalize">{job.jobType.replace('_', ' ')}</span>
                                                    </div>
                                                    {job.salaryMin && (
                                                        <div className="text-2xl font-black text-emerald-500 tracking-tighter">
                                                            ${Math.round(job.salaryMin / 1000)}k - {Math.round((job.salaryMax || 0) / 1000)}k
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={(e) => handleApply(e, job.id)}
                                                    disabled={applyingId === job.id || appliedJobs.includes(job.id)}
                                                    className={`px-10 py-4 font-black rounded-2xl transition-all duration-300 flex items-center gap-3 text-lg shadow-2xl ${appliedJobs.includes(job.id)
                                                        ? 'bg-emerald-500/10 text-emerald-500 cursor-default border border-emerald-500/20'
                                                        : 'bg-primary text-white hover:bg-accent hover:scale-[1.05] active:scale-[0.98] shadow-primary/20 hover:shadow-primary/40'
                                                        }`}
                                                >
                                                    {applyingId === job.id ? (
                                                        <Loader2 className="animate-spin" size={24} />
                                                    ) : appliedJobs.includes(job.id) ? (
                                                        <><CheckCircle size={24} /> Applied</>
                                                    ) : (
                                                        'Apply Now'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-32 bg-secondary/30 backdrop-blur-md rounded-[48px] border-2 border-dashed border-muted/20 space-y-6">
                                <div className="w-24 h-24 bg-muted/10 rounded-full flex items-center justify-center mx-auto text-muted/30">
                                    <Briefcase size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-bold text-text">No jobs found</h3>
                                    <p className="text-muted text-lg font-medium max-w-sm mx-auto">Try adjusting your search or filters to find more opportunities.</p>
                                </div>
                                <button
                                    onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}
                                    className="text-primary font-black uppercase tracking-widest text-sm hover:underline"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
