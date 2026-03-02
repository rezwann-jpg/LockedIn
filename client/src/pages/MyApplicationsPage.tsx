import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Briefcase, MapPin, Clock, Loader2, CheckCircle, Clock3, XCircle, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ApplicationHistory from '../components/ApplicationHistory';

interface Application {
    id: number;
    status: string;
    appliedAt: string;
    jobTitle: string;
    companyName: string;
    location: string;
    history?: any[];
}

const statusStyles: Record<string, { color: string, bg: string, icon: any }> = {
    applied: { color: 'text-primary', bg: 'bg-primary/10', icon: Clock3 },
    reviewed: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock3 },
    interviewing: { color: 'text-accent', bg: 'bg-accent/10', icon: Clock },
    offered: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle },
    rejected: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
    hired: { color: 'text-emerald-600', bg: 'bg-emerald-600/10', icon: CheckCircle },
};

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAppId, setExpandedAppId] = useState<number | null>(null);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const res = await api.get<{ applications: Application[] }>('/jobs/applications/my');
                setApplications(res.data.applications);
            } catch (err) {
                console.error('Failed to fetch applications:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const toggleExpand = (id: number) => {
        setExpandedAppId(expandedAppId === id ? null : id);
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background p-6 md:p-12 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-5xl mx-auto space-y-12">
                <header className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                        My <span className="text-primary">Applications</span>
                    </h1>
                    <p className="text-gray-400 text-lg font-medium">Track your status and manage your job applications.</p>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="animate-spin h-10 w-10 text-primary" />
                        <p className="text-gray-400 font-bold">Retrieving your history...</p>
                    </div>
                ) : applications.length > 0 ? (
                    <div className="grid gap-6">
                        {applications.map(app => {
                            const statusInfo = statusStyles[app.status] || statusStyles.applied;
                            const StatusIcon = statusInfo.icon;
                            const isExpanded = expandedAppId === app.id;

                            return (
                                <div key={app.id} className="bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden group hover:border-primary/30 transition-all duration-300">
                                    <div
                                        onClick={() => toggleExpand(app.id)}
                                        className="p-6 md:p-8 flex items-center justify-between cursor-pointer"
                                    >
                                        <div className="flex gap-6 items-center">
                                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-white/10 text-primary font-black text-2xl group-hover:scale-110 transition-transform">
                                                {app.companyName.charAt(0)}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-primary transition-colors">{app.jobTitle}</h3>
                                                <div className="flex items-center gap-4 text-gray-500 font-bold">
                                                    <span>{app.companyName}</span>
                                                    <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                                    <div className="flex items-center gap-1.5 text-sm uppercase tracking-wider">
                                                        <MapPin size={14} />
                                                        {app.location}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden md:block space-y-2">
                                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest ${statusInfo.bg} ${statusInfo.color}`}>
                                                    <StatusIcon size={14} />
                                                    {app.status}
                                                </div>
                                                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                                    Applied {formatDistanceToNow(new Date(app.appliedAt))} ago
                                                </p>
                                            </div>
                                            <div className={`p-2 rounded-full bg-white/5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown size={24} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded History Section */}
                                    {isExpanded && (
                                        <div className="px-8 pb-8 pt-4 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-4 duration-300">
                                            <div className="max-w-xl">
                                                <h4 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Status Timeline</h4>
                                                <ApplicationHistory history={app.history || []} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white/5 rounded-[40px] border-2 border-dashed border-white/10 p-24 text-center space-y-6">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-700">
                            <Briefcase size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white">No Applications Yet</h3>
                            <p className="text-gray-400 font-medium max-w-xs mx-auto">Start exploring jobs and apply to see them listed here!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
