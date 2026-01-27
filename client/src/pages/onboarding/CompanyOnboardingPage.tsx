import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import { Building2, Info, Loader2, ArrowRight } from 'lucide-react';
import { AxiosError } from 'axios';

export default function CompanyOnboardingPage() {
    const navigate = useNavigate();
    const location = useLocation();
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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-4">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-text">Setup Your Company Profile</h1>
                    <p className="text-muted mt-2">Finish setting up your account to start posting jobs.</p>
                </div>

                <div className="bg-secondary rounded-xl border border-muted/30 shadow-xl overflow-hidden">
                    {error && (
                        <div className="p-4 bg-red-500/10 border-b border-red-500/30 text-red-400 flex items-center gap-3">
                            <Info size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-muted mb-2">Company Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full px-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">Industry</label>
                                <input
                                    type="text"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                    placeholder="e.g. Technology"
                                    className="w-full px-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">Company Size</label>
                                <select
                                    name="size"
                                    value={formData.size}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                >
                                    <option value="1-10">1-10 employees</option>
                                    <option value="11-50">11-50 employees</option>
                                    <option value="51-200">51-200 employees</option>
                                    <option value="201-500">201-500 employees</option>
                                    <option value="501+">501+ employees</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. San Francisco, CA"
                                    className="w-full px-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">Website</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="https://acme.com"
                                    className="w-full px-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">About the Company</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Tell job seekers about your mission and culture..."
                                className="w-full px-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text resize-none"
                            />
                        </div>

                        <div className="pt-4 border-t border-muted/30 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-accent transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Complete Profile
                                        <ArrowRight size={20} />
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
