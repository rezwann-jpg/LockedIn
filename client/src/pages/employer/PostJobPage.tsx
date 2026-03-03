import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { ArrowLeft, Loader2, Info, X, Briefcase, MapPin, DollarSign, ListChecks, Target, CheckCircle2 } from 'lucide-react';
import { AxiosError } from 'axios';

export default function PostJobPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        jobType: 'full_time',
        location: '',
        remote: false,
        salaryMin: '',
        salaryMax: '',
        description: '',
        requirements: '',
        responsibilities: '',
        categoryId: '',
        skills: [] as string[],
        isActive: true,
    });

    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [currentSkill, setCurrentSkill] = useState('');
    const [suggestedSkills, setSuggestedSkills] = useState<{ id: number; name: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

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

    useEffect(() => {
        if (!isEditMode) return;

        const fetchJob = async () => {
            try {
                const res = await api.get<{ job: any }>(`/jobs/${id}`);
                const job = res.data.job;
                setFormData({
                    title: job.title || '',
                    jobType: job.jobType || 'full_time',
                    location: job.location || '',
                    remote: !!job.remote,
                    salaryMin: job.salaryMin?.toString() || '',
                    salaryMax: job.salaryMax?.toString() || '',
                    description: job.description || '',
                    requirements: job.requirements || '',
                    responsibilities: job.responsibilities || '',
                    categoryId: job.categoryId?.toString() || '',
                    skills: job.skills || [],
                    isActive: job.isActive !== false,
                });
            } catch (err) {
                console.error('Failed to fetch job:', err);
                setError('Failed to load job details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchJob();
    }, [id, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const addSkill = () => {
        const trimmed = currentSkill.trim();
        if (trimmed && !formData.skills.includes(trimmed)) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, trimmed]
            }));
            setCurrentSkill('');
            setShowSuggestions(false);
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skillToRemove)
        }));
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            const trimmed = currentSkill.trim();
            if (trimmed.length < 2) {
                setSuggestedSkills([]);
                return;
            }
            try {
                const res = await api.get<{ skills: { id: number; name: string }[] }>(`/skills?search=${trimmed}`);
                setSuggestedSkills(res.data.skills);
            } catch (err) {
                console.error('Failed to fetch skill suggestions:', err);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [currentSkill]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!formData.title || !formData.description || !formData.categoryId) {
            setError('Please fill in all required fields marked with an asterisk.');
            setIsSubmitting(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
                salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
                salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
                remote: formData.remote,
                isActive: formData.isActive
            };

            if (isEditMode) {
                await api.put(`/company/jobs/${id}`, payload);
            } else {
                await api.post('/company/jobs', payload);
            }
            navigate('/employer/dashboard');
        } catch (err) {
            console.error(err);
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'post'} job. Please try again.`);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted hover:text-text transition-colors mb-6 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Dashboard</span>
                </button>

                <div className="bg-secondary/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-text tracking-tight">
                                    {isEditMode ? 'Edit Job Posting' : 'Post a New Job'}
                                </h1>
                                <p className="text-muted mt-1 text-lg">
                                    {isEditMode ? 'Update the details of your job offering to attract the right candidates.' : 'Reach thousands of job seekers by creating a detailed job listing.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mx-8 mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                            <Info size={20} className="text-red-400 shrink-0" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-8 space-y-10">
                        {/* Section: Basic Info */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted/20">
                                <Target size={20} className="text-primary" />
                                <h2 className="text-xl font-semibold text-text">Basic Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-text mb-2">Job Title <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g. Senior Frontend Engineer"
                                        className="w-full px-4 py-3 bg-background/50 border border-muted/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text transition-all placeholder:text-muted/50"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">Job Type</label>
                                    <select
                                        name="jobType"
                                        value={formData.jobType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-background/50 border border-muted/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                        <option value="contract">Contract</option>
                                        <option value="internship">Internship</option>
                                        <option value="freelance">Freelance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">Job Category <span className="text-red-400">*</span></label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-background/50 border border-muted/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text transition-all appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Section: Location & Compensation */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted/20">
                                <MapPin size={20} className="text-primary" />
                                <h2 className="text-xl font-semibold text-text">Location & Compensation</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g. San Francisco, CA"
                                        className="w-full px-4 py-3 bg-background/50 border border-muted/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text transition-all placeholder:text-muted/50"
                                    />
                                </div>

                                <div className="flex items-end pb-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                name="remote"
                                                checked={formData.remote}
                                                onChange={handleChange}
                                                className="peer sr-only"
                                            />
                                            <div className="w-12 h-6 bg-muted/30 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </div>
                                        <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">Fully Remote Role</span>
                                    </label>
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-medium text-text mb-2">Minimum Salary</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                                        <input
                                            type="number"
                                            name="salaryMin"
                                            value={formData.salaryMin}
                                            onChange={handleChange}
                                            placeholder="80000"
                                            className="w-full pl-10 pr-4 py-3 bg-background/50 border border-muted/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text transition-all placeholder:text-muted/50"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-text mb-2">Maximum Salary</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                                        <input
                                            type="number"
                                            name="salaryMax"
                                            value={formData.salaryMax}
                                            onChange={handleChange}
                                            placeholder="120000"
                                            className="w-full pl-10 pr-4 py-3 bg-background/50 border border-muted/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text transition-all placeholder:text-muted/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Job Details */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted/20">
                                <ListChecks size={20} className="text-primary" />
                                <h2 className="text-xl font-semibold text-text">Job Description & Requirements</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">Full Description <span className="text-red-400">*</span></label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={5}
                                        placeholder="Describe the role, the team, and what the candidate will be doing..."
                                        className="w-full px-4 py-3 bg-background/50 border border-muted/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text transition-all resize-y placeholder:text-muted/50 leading-relaxed"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">Requirements</label>
                                    <textarea
                                        name="requirements"
                                        value={formData.requirements}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="What skills, experience, and qualifications are required?"
                                        className="w-full px-4 py-3 bg-background/50 border border-muted/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text transition-all resize-y placeholder:text-muted/50 leading-relaxed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">Key Responsibilities</label>
                                    <textarea
                                        name="responsibilities"
                                        value={formData.responsibilities}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="What are the main day-to-day responsibilities?"
                                        className="w-full px-4 py-3 bg-background/50 border border-muted/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text transition-all resize-y placeholder:text-muted/50 leading-relaxed"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section: Skills */}
                        <section className="space-y-6 pb-2">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted/20">
                                <CheckCircle2 size={20} className="text-primary" />
                                <h2 className="text-xl font-semibold text-text">Required Skills</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={currentSkill}
                                            onChange={(e) => setCurrentSkill(e.target.value)}
                                            onKeyDown={handleSkillKeyDown}
                                            onFocus={() => setShowSuggestions(true)}
                                            placeholder="Type a skill and press enter (e.g. React, Python)"
                                            className="w-full px-4 py-3 bg-background/50 border border-muted/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text transition-all placeholder:text-muted/50"
                                        />

                                        {showSuggestions && suggestedSkills.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-secondary border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto backdrop-blur-xl">
                                                {suggestedSkills.filter(s => !formData.skills.includes(s.name)).map(skill => (
                                                    <button
                                                        key={skill.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, skills: [...prev.skills, skill.name] }));
                                                            setCurrentSkill('');
                                                            setShowSuggestions(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary text-text transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        {skill.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addSkill}
                                        className="px-6 py-3 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary hover:text-white transition-all font-medium shadow-sm active:scale-95"
                                    >
                                        Add Skill
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-background/30 rounded-xl border border-dashed border-muted/40">
                                    {formData.skills.length > 0 ? (
                                        formData.skills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="inline-flex items-center gap-2 bg-secondary text-text px-4 py-2 rounded-lg text-sm font-medium border border-white/10 shadow-sm animate-in zoom-in-95 duration-200"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(skill)}
                                                    className="text-muted hover:text-red-400 hover:bg-red-400/10 rounded-full p-0.5 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <div className="w-full flex items-center justify-center text-muted/60 text-sm italic py-2">
                                            No skills added yet. Adding skills helps candidates find your job.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {isEditMode && (
                            <section className="space-y-6 pb-2">
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleChange}
                                                className="peer sr-only"
                                            />
                                            <div className="w-12 h-6 bg-muted/30 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        </div>
                                        <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">
                                            Job is Active (Visible to Candidates)
                                        </span>
                                    </label>
                                </div>
                            </section>
                        )}

                        <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 text-muted hover:text-text font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-accent hover:-translate-y-0.5 transition-all font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        {isEditMode ? 'Saving...' : 'Publishing...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Save Changes' : 'Publish Job'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
