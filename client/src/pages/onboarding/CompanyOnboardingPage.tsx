import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import { Building2, Loader2, ArrowRight } from 'lucide-react';
import { AxiosError } from 'axios';
import { useAuth } from '../../context/useAuth';

export default function CompanyOnboardingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        size: '1-10',
        location: '',
        website: '',
        description: '',
    });

    useEffect(() => {
        // Carry over company name from navigation state or user profile
        const carriedCompanyName = location.state?.companyName || (user?.role === 'company' ? user.name : '');
        if (carriedCompanyName) {
            setFormData(prev => ({ ...prev, name: carriedCompanyName }));
        }
    }, [location.state, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await api.post('/company/profile', formData);
            const redirectPath = location.state?.redirectAfter || '/employer/dashboard';
            navigate(redirectPath);
        } catch (err) {
            console.error(err);
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error || 'Failed to setup company profile.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px-200px)] py-12 px-4 relative overflow-hidden bg-background">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-2xl mb-4 shadow-xl shadow-primary/10">
                        <Building2 size={36} />
                    </div>
                    <h1 className="text-4xl font-bold text-text">Welcome to LockedIn</h1>
                    <p className="text-muted mt-3 text-lg font-medium">Let's set up your company profile to get started.</p>
                </div>

                <div className="bg-secondary/40 backdrop-blur-xl rounded-2xl border border-muted/30 shadow-2xl overflow-hidden">
                    {error && (
                        <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 flex items-center gap-3 font-medium">
                            <span className="shrink-0 text-lg text-red-400">⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="col-span-2 space-y-2">
                                <label className="block text-sm font-semibold text-muted ml-1 uppercase tracking-wider">Company Name <span className="text-primary">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Acme Corporation"
                                    className="w-full px-4 py-3.5 bg-background/50 border border-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-muted ml-1 uppercase tracking-wider">Industry</label>
                                <input
                                    type="text"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                    placeholder="e.g. Technology"
                                    className="w-full px-4 py-3.5 bg-background/50 border border-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-muted ml-1 uppercase tracking-wider">Company Size</label>
                                <select
                                    name="size"
                                    value={formData.size}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 bg-background/50 border border-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text font-medium appearance-none cursor-pointer"
                                >
                                    <option value="1-10">1-10 employees</option>
                                    <option value="11-50">11-50 employees</option>
                                    <option value="51-200">51-200 employees</option>
                                    <option value="201-500">201-500 employees</option>
                                    <option value="501+">501+ employees</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-muted ml-1 uppercase tracking-wider">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. San Francisco, CA"
                                    className="w-full px-4 py-3.5 bg-background/50 border border-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-muted ml-1 uppercase tracking-wider">Website</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="https://acme.com"
                                    className="w-full px-4 py-3.5 bg-background/50 border border-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-muted ml-1 uppercase tracking-wider">About the Company</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                placeholder="Tell us about your mission, culture, and what makes your company a great place to work..."
                                className="w-full px-4 py-4 bg-background/50 border border-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text font-medium resize-none shadow-inner"
                            />
                        </div>

                        <div className="pt-8 border-t border-muted/20 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-3 px-10 py-4 bg-primary text-white font-bold rounded-xl hover:bg-accent transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-primary/30 group"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Complete Setup
                                        <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
