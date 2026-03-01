import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Briefcase, MapPin, Clock, Search, Loader2, ArrowUpDown, CheckCircle, SlidersHorizontal, DollarSign, Globe } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import ApplicationModal from '../components/ApplicationModal';
import JobDetailsModal from '../components/JobDetailsModal';

type Job = {
    id: number;
    title: string;
    description: string;
    requirements?: string;
    responsibilities?: string;
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
    remote: boolean;
};


export default function JobSearchPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'recent' | 'match'>('recent');
    const [appliedJobs, setAppliedJobs] = useState<number[]>([]);

    // Advanced Filters
    const [jobType, setJobType] = useState<string>('');
    const [salaryMin, setSalaryMin] = useState<string>('');
    const [remote, setRemote] = useState<boolean | undefined>(undefined);
    const [showFilters, setShowFilters] = useState(false);

    // Modal State
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [viewingJob, setViewingJob] = useState<Job | null>(null);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory) params.append('categoryId', selectedCategory);
            if (sortOrder) params.append('sort', sortOrder);
            if (searchTerm) params.append('search', searchTerm);
            if (jobType) params.append('jobType', jobType);
            if (salaryMin) params.append('salaryMin', salaryMin);
            if (remote !== undefined) params.append('remote', String(remote));

            const res = await api.get<{ jobs: Job[] }>(`/jobs?${params.toString()}`);
            setJobs(res.data.jobs);

            const alreadyApplied = res.data.jobs
                .filter((j: Job) => j.hasApplied)
                .map((j: Job) => j.id);
            setAppliedJobs((prev: number[]) => Array.from(new Set([...prev, ...alreadyApplied])));
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
    }, [sortOrder, selectedCategory, searchTerm, jobType, salaryMin, remote]);

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

    const handleApplySuccess = (jobId: number) => {
        setAppliedJobs((prev: number[]) => [...prev, jobId]);
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background p-6 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/5 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-accent/5 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-6xl mx-auto space-y-12">
                <header className="space-y-4 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-black text-text tracking-tighter uppercase italic">
                            Find Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Dream Career</span>
                        </h1>
                        <p className="text-muted text-lg md:text-xl max-w-2xl font-bold uppercase tracking-wide">Opportunities designed for your growth.</p>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${showFilters ? 'bg-primary text-white shadow-2xl scale-105' : 'bg-secondary/50 text-text border border-muted/10 hover:border-primary/50'}`}
                    >
                        <SlidersHorizontal size={20} />
                        Filters
                    </button>
                </header>

                <div className="bg-secondary/40 backdrop-blur-3xl p-6 md:p-10 rounded-[48px] border border-muted/10 shadow-2xl space-y-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-muted group-focus-within:text-primary transition-colors">
                                <Search size={24} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by job title or keywords..."
                                className="w-full pl-16 pr-8 py-5 bg-background/50 border border-muted/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all text-text font-bold text-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative group">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full md:w-64 appearance-none bg-background/50 border border-muted/10 rounded-2xl px-8 py-5 text-text font-black uppercase tracking-widest text-xs cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-6 inset-y-0 flex items-center pointer-events-none text-muted group-hover:text-primary transition-colors">
                                    <ArrowUpDown size={18} />
                                </div>
                            </div>

                            {user?.role === 'job_seeker' && (
                                <div className="relative group">
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value as any)}
                                        className="w-full md:w-56 appearance-none bg-background/50 border border-muted/10 rounded-2xl px-8 py-5 text-text font-black uppercase tracking-widest text-xs cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold"
                                    >
                                        <option value="recent">Most Recent</option>
                                        <option value="match">Best Match</option>
                                    </select>
                                    <div className="absolute right-6 inset-y-0 flex items-center pointer-events-none text-muted group-hover:text-primary transition-colors">
                                        <ArrowUpDown size={18} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-muted/10 animate-in slide-in-from-top-6 duration-500">
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-muted">
                                    <Briefcase size={16} className="text-primary" /> Job Type
                                </label>
                                <select
                                    value={jobType}
                                    onChange={(e) => setJobType(e.target.value)}
                                    className="w-full bg-background/50 border border-muted/10 rounded-xl px-6 py-4 text-sm font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/20 transition-all"
                                >
                                    <option value="">Any Type</option>
                                    <option value="full_time">Full Time</option>
                                    <option value="part_time">Part Time</option>
                                    <option value="contract">Contract</option>
                                    <option value="internship">Internship</option>
                                </select>
                            </div>

                            <div className="space-y-3 text-text">
                                <label className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-muted">
                                    <DollarSign size={16} className="text-primary" /> Min Salary
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Min salary..."
                                        value={salaryMin}
                                        onChange={(e) => setSalaryMin(e.target.value)}
                                        className="w-full bg-background/50 border border-muted/10 rounded-xl px-6 py-4 text-sm font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-muted">
                                    <Globe size={16} className="text-primary" /> Work Mode
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setRemote(undefined)}
                                        className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${remote === undefined ? 'bg-primary text-white' : 'bg-background/50 text-muted border border-muted/10 hover:border-primary/30'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setRemote(true)}
                                        className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${remote === true ? 'bg-primary text-white' : 'bg-background/50 text-muted border border-muted/10 hover:border-primary/30'}`}
                                    >
                                        Remote
                                    </button>
                                    <button
                                        onClick={() => setRemote(false)}
                                        className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${remote === false ? 'bg-primary text-white' : 'bg-background/50 text-muted border border-muted/10 hover:border-primary/30'}`}
                                    >
                                        On-site
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 space-y-6">
                        <Loader2 className="animate-spin h-16 w-16 text-primary" />
                        <p className="text-muted font-black uppercase tracking-[0.2em] animate-pulse text-lg">Curating the best jobs for you...</p>
                    </div>
                ) : (
                    <div className="grid gap-10">
                        {jobs.length > 0 ? (
                            jobs.map(job => (
                                <div
                                    key={job.id}
                                    className="group bg-secondary/50 backdrop-blur-2xl rounded-[48px] border border-muted/10 p-8 md:p-12 hover:border-primary/40 transition-all duration-500 shadow-2xl hover:shadow-primary/5 relative overflow-hidden cursor-pointer"
                                    onClick={() => setViewingJob(job)}
                                >
                                    {job.matchPercentage !== undefined && (
                                        <div className="absolute top-0 right-0 px-10 py-3 bg-primary text-white font-black text-xs uppercase tracking-[0.3em] rounded-bl-[32px] shadow-2xl">
                                            {Math.round(job.matchPercentage)}% Match
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row gap-10">
                                        <div className="w-24 h-24 md:w-32 md:h-32 bg-background border border-muted/10 rounded-[32px] flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                                            {job.companyLogo ? (
                                                <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-4xl font-black text-primary">{(job.companyName || 'C').charAt(0)}</span>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-8">
                                            <div className="space-y-3">
                                                <h3 className="text-4xl font-black text-text group-hover:text-primary transition-colors tracking-tight leading-tight">
                                                    {job.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                                                    <span className="text-2xl font-bold text-muted group-hover:text-text transition-colors">{job.companyName}</span>
                                                    <div className="flex items-center gap-3 text-sm font-black text-primary/70 uppercase tracking-widest bg-primary/5 px-5 py-2 rounded-full border border-primary/10">
                                                        <MapPin size={16} />
                                                        {job.location} {job.remote && '(Remote)'}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-muted/80 leading-relaxed font-bold line-clamp-2 text-xl italic bg-background/20 p-6 rounded-3xl border border-muted/5">
                                                "{job.description}"
                                            </p>

                                            <div className="flex flex-wrap items-center justify-between gap-8 pt-4">
                                                <div className="flex flex-wrap items-center gap-10 text-text">
                                                    <div className="flex items-center gap-3 text-muted font-black uppercase tracking-widest text-xs">
                                                        <Clock size={20} className="text-primary/50" />
                                                        {job.jobType.replace('_', ' ')}
                                                    </div>
                                                    {job.salaryMin && (
                                                        <div className="text-3xl font-black text-emerald-500 tracking-tighter">
                                                            ${Math.round(job.salaryMin / 1000)}k - {Math.round((job.salaryMax || 0) / 1000)}k
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!appliedJobs.includes(job.id)) setSelectedJob(job);
                                                    }}
                                                    disabled={appliedJobs.includes(job.id)}
                                                    className={`px-12 py-5 font-black rounded-3xl transition-all duration-300 flex items-center gap-4 text-xl shadow-2xl ${appliedJobs.includes(job.id)
                                                        ? 'bg-emerald-500/10 text-emerald-500 cursor-default border border-emerald-500/20'
                                                        : 'bg-primary text-white hover:bg-accent hover:scale-[1.05] active:scale-[0.98] shadow-primary/20 hover:shadow-primary/40 uppercase tracking-widest'
                                                        }`}
                                                >
                                                    {appliedJobs.includes(job.id) ? (
                                                        <><CheckCircle size={28} /> Applied</>
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
                            <div className="text-center py-40 bg-secondary/20 backdrop-blur-md rounded-[64px] border-2 border-dashed border-muted/10 space-y-8">
                                <div className="w-32 h-32 bg-muted/10 rounded-full flex items-center justify-center mx-auto text-muted/20">
                                    <Briefcase size={64} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-4xl font-black text-text uppercase tracking-tight">No jobs found</h3>
                                    <p className="text-muted text-xl font-bold uppercase tracking-wide max-w-md mx-auto">Try adjusting your search or filters to discover new roles.</p>
                                </div>
                                <button
                                    onClick={() => { setSearchTerm(''); setSelectedCategory(''); setJobType(''); setSalaryMin(''); setRemote(undefined); }}
                                    className="text-primary font-black uppercase tracking-[0.3em] text-xs hover:underline"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {viewingJob && (
                <JobDetailsModal
                    job={viewingJob}
                    isOpen={!!viewingJob}
                    onClose={() => setViewingJob(null)}
                    onApply={() => {
                        setViewingJob(null);
                        setSelectedJob(viewingJob);
                    }}
                    hasApplied={appliedJobs.includes(viewingJob.id)}
                />
            )}

            {selectedJob && (
                <ApplicationModal
                    job={selectedJob}
                    isOpen={!!selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onSuccess={handleApplySuccess}
                />
            )}
        </div>
    );
}
