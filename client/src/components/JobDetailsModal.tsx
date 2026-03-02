import React, { useState } from 'react';
import { X, MapPin, Briefcase, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import ApplicationModal from './ApplicationModal';

interface Job {
    id: number;
    title: string;
    companyName: string;
    companyLogo?: string;
    location: string;
    jobType: string;
    salaryMin?: number;
    salaryMax?: number;
    description: string;
    requirements?: string;
    responsibilities?: string;
    postedAt: string;
    applicationCount: number;
    hasApplied?: boolean;
    remote: boolean;
    matchPercentage?: number;
}

interface JobDetailsModalProps {
    job: Job;
    onClose: () => void;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose }) => {
    const [isApplied, setIsApplied] = useState(job.hasApplied);
    const [showApplyModal, setShowApplyModal] = useState(false);

    const handleApplySuccess = () => {
        setIsApplied(true);
        setShowApplyModal(false);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-background w-full max-w-4xl max-h-[90vh] rounded-[48px] shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="relative p-8 md:p-12 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 overflow-hidden shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-white/5 z-10"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-black border border-white/5 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl overflow-hidden">
                                {job.companyLogo ? (
                                    <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-5xl font-black text-primary">{(job.companyName || 'C').charAt(0)}</span>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">{job.title}</h2>
                                    {job.matchPercentage !== undefined && (
                                        <span className="px-4 py-1.5 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full shadow-lg">
                                            {Math.round(job.matchPercentage)}% Match
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                                    <span className="text-xl md:text-2xl font-bold text-gray-400">{job.companyName}</span>
                                    <div className="flex items-center gap-3 text-sm font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                                        <MapPin size={16} />
                                        {job.location} {job.remote && '(Remote)'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-white/5">
                            <div className="space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                    <Briefcase size={14} className="text-primary" /> Job Type
                                </div>
                                <p className="text-xl font-black text-white capitalize">{job.jobType.replace('_', ' ')}</p>
                            </div>
                            <div className="space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                    <DollarSign size={14} className="text-primary" /> Salary Range
                                </div>
                                <p className="text-xl font-black text-emerald-500">
                                    {job.salaryMin ? `$${Math.round(job.salaryMin / 1000)}k - $${Math.round((job.salaryMax || 0) / 1000)}k` : 'Competitive'}
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                    <Calendar size={14} className="text-primary" /> Posted On
                                </div>
                                <p className="text-xl font-black text-white">{format(new Date(job.postedAt), 'MMM dd, yyyy')}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">About the <span className="text-primary">Role</span></h3>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-gray-400 text-lg leading-relaxed font-medium whitespace-pre-wrap">{job.description}</p>
                                </div>
                            </div>

                            {job.requirements && (
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Requirements</h3>
                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-gray-400 text-lg leading-relaxed font-medium whitespace-pre-wrap">{job.requirements}</p>
                                    </div>
                                </div>
                            )}

                            {job.responsibilities && (
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Responsibilities</h3>
                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-gray-400 text-lg leading-relaxed font-medium whitespace-pre-wrap">{job.responsibilities}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-8 md:p-12 border-t border-white/5 bg-white/5 backdrop-blur-xl shrink-0">
                        <button
                            onClick={() => setShowApplyModal(true)}
                            disabled={isApplied}
                            className={`w-full py-6 font-black rounded-3xl transition-all duration-300 flex items-center justify-center gap-4 text-2xl shadow-2xl ${isApplied
                                ? 'bg-emerald-500/10 text-emerald-500 cursor-default border border-emerald-500/20'
                                : 'bg-primary text-white hover:bg-accent hover:scale-[1.02] active:scale-[0.98] shadow-primary/20 hover:shadow-primary/40 uppercase tracking-widest'
                                }`}
                        >
                            {isApplied ? <><CheckCircle size={32} /> Already Applied</> : 'Submit Application'}
                        </button>
                    </div>
                </div>
            </div>

            {showApplyModal && (
                <ApplicationModal
                    jobId={job.id}
                    jobTitle={job.title}
                    onClose={() => setShowApplyModal(false)}
                    onSuccess={handleApplySuccess}
                />
            )}
        </>
    );
};

export default JobDetailsModal;
