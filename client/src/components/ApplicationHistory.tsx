import React from 'react';
import { Circle, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

interface HistoryItem {
    id: number;
    oldStatus: string | null;
    newStatus: string;
    createdAt: string;
    changeReason?: string;
}

interface ApplicationHistoryProps {
    history: HistoryItem[];
}

const ApplicationHistory: React.FC<ApplicationHistoryProps> = ({ history }) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'applied': return <Clock className="w-4 h-4 text-primary" />;
            case 'reviewed': return <AlertCircle className="w-4 h-4 text-blue-400" />;
            case 'interviewing': return <Circle className="w-4 h-4 text-purple-400 fill-purple-400/20" />;
            case 'offered':
            case 'hired': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
            default: return <Circle className="w-4 h-4 text-gray-400" />;
        }
    };

    if (!history || history.length === 0) {
        return <div className="text-sm text-gray-500 italic">No history recorded yet.</div>;
    }

    return (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
            {history.map((item, index) => (
                <div key={item.id} className="relative">
                    {/* Dot */}
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-black border-2 border-primary/50 flex items-center justify-center">
                        <div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-primary animate-pulse' : 'bg-gray-600'}`}></div>
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold uppercase tracking-wider ${index === 0 ? 'text-white' : 'text-gray-400'}`}>
                                {item.newStatus.replace('_', ' ')}
                            </span>
                            {getStatusIcon(item.newStatus)}
                        </div>
                        <span className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        {item.changeReason && (
                            <p className="mt-1 text-sm text-gray-400 bg-white/5 p-2 rounded-lg border border-white/5">
                                {item.changeReason}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ApplicationHistory;
