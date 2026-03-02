import { useState, useEffect } from 'react';
import api from '../lib/api';
import { TrendingUp, Users, Briefcase, BarChart3, Loader2, Target, Sparkles } from 'lucide-react';

interface Trend {
    category_name: string;
    total_jobs: string;
    total_applications: string;
    applications_per_job: string;
}

export default function MarketTrendsPage() {
    const [trends, setTrends] = useState<Trend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const res = await api.get<{ trends: Trend[] }>('/jobs/trends');
                setTrends(res.data.trends);
            } catch (err) {
                console.error('Failed to fetch trends:', err);
                setError('Unable to load market data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchTrends();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-muted font-bold animate-pulse uppercase tracking-widest text-xs">Analyzing Market Data...</p>
                </div>
            </div>
        );
    }

    const totalJobs = trends.reduce((acc, t) => acc + parseInt(t.total_jobs), 0);
    const totalApps = trends.reduce((acc, t) => acc + parseInt(t.total_applications), 0);

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background p-6 md:p-12 relative overflow-hidden">
            {/* Decorative gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-6xl mx-auto space-y-12">
                <header className="space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                        <BarChart3 size={24} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Intelligence</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[0.8]">
                        Market <span className="text-primary italic">Trends</span>
                    </h1>
                    <p className="text-gray-400 text-lg font-medium max-w-2xl">
                        Real-time data on job demand and competition across industries. Use these insights to optimize your search or hiring strategy.
                    </p>
                </header>

                {error ? (
                    <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl flex items-center gap-4">
                        <span className="text-2xl">⚠️</span>
                        <p className="font-bold">{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 space-y-4">
                                <div className="p-3 bg-primary/10 text-primary w-fit rounded-2xl">
                                    <Briefcase size={24} />
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-white">{totalJobs}</p>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Total Open Positions</p>
                                </div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 space-y-4">
                                <div className="p-3 bg-blue-500/10 text-blue-500 w-fit rounded-2xl">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-white">{totalApps}</p>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Active Applications</p>
                                </div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 space-y-4">
                                <div className="p-3 bg-emerald-500/10 text-emerald-500 w-fit rounded-2xl">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-white">{(totalApps / (totalJobs || 1)).toFixed(1)}</p>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Avg. Apps Per Job</p>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Trends */}
                        <section className="space-y-8">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Category <span className="text-primary underline decoration-primary/30 underline-offset-8">Deep Dive</span></h2>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                            </div>

                            <div className="grid gap-4">
                                {trends.map((item, index) => (
                                    <div
                                        key={item.category_name}
                                        className="group bg-white/5 hover:bg-white/10 rounded-3xl border border-white/5 p-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className="text-gray-700 font-black text-2xl italic">{(index + 1).toString().padStart(2, '0')}</span>
                                            <div>
                                                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{item.category_name}</h3>
                                                <div className="flex items-center gap-4 mt-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    <span>{item.total_jobs} Jobs</span>
                                                    <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                                    <span>{item.total_applications} Applicants</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 pl-12 md:pl-0">
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <span className={`text-2xl font-black ${parseFloat(item.applications_per_job) > 5 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                                        {item.applications_per_job}
                                                    </span>
                                                    {parseFloat(item.applications_per_job) > 5 ? <Target size={16} className="text-orange-500" /> : <Sparkles size={16} className="text-emerald-500" />}
                                                </div>
                                                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-0.5">Apps / Job</p>
                                            </div>

                                            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${parseFloat(item.applications_per_job) > 5 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(parseFloat(item.applications_per_job) * 10, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
