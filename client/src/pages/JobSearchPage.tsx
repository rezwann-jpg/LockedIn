import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Briefcase, MapPin, Clock, Search, Loader2 } from 'lucide-react';

type Job = {
    id: number;
    title: string;
    description: string;
    location: string;
    jobType: string;
    salaryMin: number | null;
    salaryMax: number | null;
    postedAt: string;
};

export default function JobSearchPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get<{ jobs: Job[] }>('/jobs');
                setJobs(res.data.jobs);
            } catch (err) {
                console.error('Failed to fetch jobs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-bold text-text mb-4">Explore Opportunities</h1>
                    <p className="text-muted text-lg">Find your next career move with LockedIn</p>
                </header>

                <div className="relative mb-8">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by title or location..."
                        className="w-full pl-10 pr-4 py-4 bg-secondary border border-muted/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                                            </div>
                                            <p className="mt-4 text-muted line-clamp-2 text-sm leading-relaxed">
                                                {job.description}
                                            </p>
                                        </div>
                                        <button className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-accent transition-colors">
                                            View Details
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
