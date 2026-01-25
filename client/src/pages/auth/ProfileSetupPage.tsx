import { useState, useEffect, type KeyboardEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { AxiosError } from 'axios';
import { Sparkles, GraduationCap, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';
import StepWizard from '../../components/ui/StepWizard';
import MonthYearPicker from '../../components/ui/MonthYearPicker';

type EducationForm = {
  id?: number;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
};

type ExperienceForm = {
  id?: number;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
};

type ProfileData = {
  skills: string[];
  educations: Array<{
    id: number;
    school: string;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }>;
  experiences: Array<{
    id: number;
    company: string;
    position: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    currentlyWorking: boolean;
    description: string | null;
  }>;
};

const emptyEducation: EducationForm = {
  school: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  description: '',
};

const emptyExperience: ExperienceForm = {
  company: '',
  position: '',
  location: '',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
  description: '',
};

export default function ProfileSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [educations, setEducations] = useState<EducationForm[]>([]);
  const [experiences, setExperiences] = useState<ExperienceForm[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [validationErrors, setValidationErrors] = useState<{
    educations?: { [key: number]: { [field: string]: string } };
    experiences?: { [key: number]: { [field: string]: string } };
  }>({});

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (user.role === 'company') {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await api.get<{ profile: ProfileData }>('/profile');
        const profile = res.data.profile;

        setSkills(profile.skills || []);

        if (profile.educations?.length) {
          setEducations(
            profile.educations.map((edu) => ({
              id: edu.id,
              school: edu.school || '',
              degree: edu.degree || '',
              fieldOfStudy: edu.fieldOfStudy || '',
              startDate: edu.startDate ? edu.startDate.slice(0, 7) : '',
              endDate: edu.endDate ? edu.endDate.slice(0, 7) : '',
              description: edu.description || '',
            }))
          );
        }

        if (profile.experiences?.length) {
          setExperiences(
            profile.experiences.map((exp) => ({
              id: exp.id,
              company: exp.company || '',
              position: exp.position || '',
              location: exp.location || '',
              startDate: exp.startDate ? exp.startDate.slice(0, 7) : '',
              endDate: exp.endDate ? exp.endDate.slice(0, 7) : '',
              currentlyWorking: !!exp.currentlyWorking,
              description: exp.description || '',
            }))
          );
        }
      } catch (err) {
        if (err instanceof AxiosError && err.response?.status === 401) {
          navigate('/login');
          return;
        }
        setError('Failed to load profile. You can still create a new one.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate]);

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const addSkill = () => {
    const trimmed = currentSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const addEducation = () => {
    setEducations((prev) => [...prev, { ...emptyEducation }]);
  };

  const removeEducation = (index: number) => {
    setEducations((prev) => prev.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    setExperiences((prev) => [...prev, { ...emptyExperience }]);
  };

  const removeExperience = (index: number) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEducation = <K extends keyof EducationForm>(
    index: number,
    field: K,
    value: EducationForm[K]
  ) => {
    setEducations((prev) =>
      prev.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu))
    );
    if (validationErrors.educations?.[index]?.[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        educations: {
          ...prev.educations,
          [index]: { ...prev.educations?.[index], [field]: '' },
        },
      }));
    }
  };

  const updateExperience = <K extends keyof ExperienceForm>(
    index: number,
    field: K,
    value: ExperienceForm[K]
  ) => {
    setExperiences((prev) =>
      prev.map((exp, i) => {
        if (i !== index) return exp;
        const updated: ExperienceForm = { ...exp, [field]: value };
        if (field === 'currentlyWorking' && value === true) {
          updated.endDate = '';
        }
        return updated;
      })
    );
    if (validationErrors.experiences?.[index]?.[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        experiences: {
          ...prev.experiences,
          [index]: { ...prev.experiences?.[index], [field]: '' },
        },
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    let isValid = true;

    educations.forEach((edu, index) => {
      const eduErrors: { [field: string]: string } = {};
      if (!edu.school.trim()) {
        eduErrors.school = 'School name is required';
        isValid = false;
      }
      if (!edu.degree.trim()) {
        eduErrors.degree = 'Degree is required';
        isValid = false;
      }
      if (Object.keys(eduErrors).length > 0) {
        if (!errors.educations) errors.educations = {};
        errors.educations[index] = eduErrors;
      }
    });

    experiences.forEach((exp, index) => {
      const expErrors: { [field: string]: string } = {};
      if (!exp.company.trim()) {
        expErrors.company = 'Company name is required';
        isValid = false;
      }
      if (!exp.position.trim()) {
        expErrors.position = 'Position is required';
        isValid = false;
      }
      if (Object.keys(expErrors).length > 0) {
        if (!errors.experiences) errors.experiences = {};
        errors.experiences[index] = expErrors;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      setError('Please fix the validation errors before saving.');
      return;
    }

    setSaving(true);

    try {
      await api.put('/profile', {
        skills,
        educations: educations.map((edu) => ({
          id: edu.id,
          school: edu.school,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy || null,
          startDate: edu.startDate ? `${edu.startDate}-01` : null,
          endDate: edu.endDate ? `${edu.endDate}-01` : null,
          description: edu.description || null,
        })),
        experiences: experiences.map((exp) => ({
          id: exp.id,
          company: exp.company,
          position: exp.position,
          location: exp.location || null,
          startDate: exp.startDate ? `${exp.startDate}-01` : null,
          endDate: exp.currentlyWorking ? null : (exp.endDate ? `${exp.endDate}-01` : null),
          currentlyWorking: exp.currentlyWorking,
          description: exp.description || null,
        })),
      });

      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-text">
          <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const steps = [
    { title: 'Skills', icon: <Sparkles className="w-5 h-5" />, description: 'Your core competencies' },
    { title: 'Education', icon: <GraduationCap className="w-5 h-5" />, description: 'Your academic background' },
    { title: 'Experience', icon: <Briefcase className="w-5 h-5" />, description: 'Your work history' },
    { title: 'Review', icon: <CheckCircle2 className="w-5 h-5" />, description: 'Verify and submit' },
  ];

  return (
    <StepWizard
      steps={steps}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      title="Create Your Profile"
      subtitle="Let's build a profile that stands out to potential employers"
    >
      <div className="p-8">
        {(error || success) && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${success
            ? 'bg-green-500/10 border-green-500/30 text-green-500'
            : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
            {success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{success ? 'Profile saved successfully!' : error}</span>
          </div>
        )}

        {/* Step 1: Skills */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-text mb-1">Top Skills</h2>
                <p className="text-muted text-sm">Add at least 3 skills that best describe your expertise.</p>
              </div>
            </div>

            <div className="bg-background border border-muted/50 rounded-xl p-6 shadow-sm">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  className="flex-1 px-4 py-3 bg-secondary border border-muted/50 rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                  placeholder="Type a skill and press Enter (e.g. React, UX Design, Python)"
                />
                <button
                  onClick={addSkill}
                  disabled={!currentSkill.trim()}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-primary transition-colors font-medium shadow-lg shadow-primary/20"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-secondary/30 rounded-lg border border-dashed border-muted/50">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-md text-sm font-medium border border-primary/20 group hover:border-primary/40 transition-colors"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-primary/60 hover:text-primary transition-colors ml-1"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                ) : (
                  <div className="w-full flex flex-col items-center justify-center text-muted py-4">
                    <Sparkles className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No skills added yet. Start typing above!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Education */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-text mb-1">Education</h2>
                <p className="text-muted text-sm">Where did you study?</p>
              </div>
              <button
                onClick={addEducation}
                className="flex items-center gap-2 text-primary hover:text-accent font-medium text-sm bg-primary/10 px-4 py-2 rounded-lg transition-colors border border-primary/20"
              >
                <span>+</span> Add Education
              </button>
            </div>

            <div className="space-y-4">
              {educations.map((edu, idx) => (
                <div key={idx} className="relative bg-background p-6 rounded-xl border border-muted/50 shadow-sm transition-all hover:border-primary/30 group">
                  <button
                    onClick={() => removeEducation(idx)}
                    className="absolute top-4 right-4 p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>

                  <div className="grid gap-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">School <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => updateEducation(idx, 'school', e.target.value)}
                          className={`w-full px-4 py-2.5 bg-secondary border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${validationErrors.educations?.[idx]?.school ? 'border-red-500' : 'border-muted/50 focus:border-primary'
                            }`}
                          placeholder="e.g. Harvard University"
                        />
                        {validationErrors.educations?.[idx]?.school && (
                          <p className="text-red-400 text-xs">{validationErrors.educations[idx].school}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">Degree <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                          className={`w-full px-4 py-2.5 bg-secondary border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${validationErrors.educations?.[idx]?.degree ? 'border-red-500' : 'border-muted/50 focus:border-primary'
                            }`}
                          placeholder="e.g. Bachelor's"
                        />
                        {validationErrors.educations?.[idx]?.degree && (
                          <p className="text-red-400 text-xs">{validationErrors.educations[idx].degree}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text">Field of Study</label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducation(idx, 'fieldOfStudy', e.target.value)}
                        className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        placeholder="e.g. Computer Science"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <div className="relative">
                          <MonthYearPicker
                            label="Start Date"
                            value={edu.startDate}
                            onChange={(val) => updateEducation(idx, 'startDate', val)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <MonthYearPicker
                          label="End Date (or Expected)"
                          value={edu.endDate}
                          onChange={(val) => updateEducation(idx, 'endDate', val)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {educations.length === 0 && (
                <div className="text-center py-10 bg-background/50 rounded-xl border-2 border-dashed border-muted/30">
                  <GraduationCap className="w-10 h-10 text-muted mx-auto mb-3" />
                  <p className="text-text font-medium">No education added</p>
                  <p className="text-muted text-sm">Add your academic background to build trust.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Experience */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-text mb-1">Work Experience</h2>
                <p className="text-muted text-sm">Your professional journey?</p>
              </div>
              <button
                onClick={addExperience}
                className="flex items-center gap-2 text-primary hover:text-accent font-medium text-sm bg-primary/10 px-4 py-2 rounded-lg transition-colors border border-primary/20"
              >
                <span>+</span> Add Experience
              </button>
            </div>

            <div className="space-y-4">
              {experiences.map((exp, idx) => (
                <div key={idx} className="relative bg-background p-6 rounded-xl border border-muted/50 shadow-sm transition-all hover:border-primary/30 group">
                  <button
                    onClick={() => removeExperience(idx)}
                    className="absolute top-4 right-4 p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>

                  <div className="grid gap-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">Company <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                          className={`w-full px-4 py-2.5 bg-secondary border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${validationErrors.experiences?.[idx]?.company ? 'border-red-500' : 'border-muted/50 focus:border-primary'
                            }`}
                          placeholder="e.g. Google"
                        />
                        {validationErrors.experiences?.[idx]?.company && (
                          <p className="text-red-400 text-xs">{validationErrors.experiences[idx].company}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">Position <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => updateExperience(idx, 'position', e.target.value)}
                          className={`w-full px-4 py-2.5 bg-secondary border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${validationErrors.experiences?.[idx]?.position ? 'border-red-500' : 'border-muted/50 focus:border-primary'
                            }`}
                          placeholder="e.g. Senior Developer"
                        />
                        {validationErrors.experiences?.[idx]?.position && (
                          <p className="text-red-400 text-xs">{validationErrors.experiences[idx].position}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">Location</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => updateExperience(idx, 'location', e.target.value)}
                          className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                          placeholder="e.g. Remote"
                        />
                      </div>
                      <div className="space-y-1.5 pt-7">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exp.currentlyWorking}
                            onChange={(e) => updateExperience(idx, 'currentlyWorking', e.target.checked)}
                            className="w-4 h-4 text-primary bg-secondary border-muted rounded focus:ring-primary/50 focus:ring-2"
                          />
                          <span className="ml-2 text-sm text-text">I currently work here</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <MonthYearPicker
                          label="Start Date"
                          value={exp.startDate}
                          onChange={(val) => updateExperience(idx, 'startDate', val)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        {!exp.currentlyWorking && (
                          <MonthYearPicker
                            label="End Date"
                            value={exp.endDate}
                            onChange={(val) => updateExperience(idx, 'endDate', val)}
                          />
                        )}
                        {exp.currentlyWorking && (
                          <div className="opacity-50 pointer-events-none">
                            <label className="block text-sm font-medium text-text mb-1">End Date</label>
                            <div className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text">Present</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text">Description</label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                        placeholder="Describe your responsibilities..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {experiences.length === 0 && (
                <div className="text-center py-10 bg-background/50 rounded-xl border-2 border-dashed border-muted/30">
                  <Briefcase className="w-10 h-10 text-muted mx-auto mb-3" />
                  <p className="text-text font-medium">No experience added</p>
                  <p className="text-muted text-sm">Add your past roles to showcase your career growth.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center max-w-lg mx-auto mb-8">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-text mb-2">Review your Profile</h2>
              <p className="text-muted">Take a moment to review everything before saving. You can always edit this later.</p>
            </div>

            <div className="grid gap-6">
              {/* Skills Review */}
              <div className="bg-secondary/30 rounded-xl p-6 border border-muted/30">
                <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? skills.map(skill => (
                    <span key={skill} className="bg-background px-3 py-1 rounded-full text-sm border border-muted/50 text-text">
                      {skill}
                    </span>
                  )) : (
                    <p className="text-muted italic text-sm">No skills added</p>
                  )}
                </div>
              </div>

              {/* Education Review */}
              <div className="bg-secondary/30 rounded-xl p-6 border border-muted/30">
                <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" /> Education
                </h3>
                <div className="space-y-4">
                  {educations.length > 0 ? educations.map((edu, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between gap-2 pb-4 border-b border-muted/20 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-text">{edu.school}</p>
                        <p className="text-sm text-muted">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                      </div>
                      <p className="text-sm text-muted whitespace-nowrap">
                        {edu.startDate} - {edu.endDate}
                      </p>
                    </div>
                  )) : (
                    <p className="text-muted italic text-sm">No education added</p>
                  )}
                </div>
              </div>

              {/* Experience Review */}
              <div className="bg-secondary/30 rounded-xl p-6 border border-muted/30">
                <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Experience
                </h3>
                <div className="space-y-4">
                  {experiences.length > 0 ? experiences.map((exp, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between gap-2 pb-4 border-b border-muted/20 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-text">{exp.company}</p>
                        <p className="text-sm text-muted">{exp.position}</p>
                      </div>
                      <p className="text-sm text-muted whitespace-nowrap">
                        {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}
                      </p>
                    </div>
                  )) : (
                    <p className="text-muted italic text-sm">No experience added</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-muted/20">
          <button
            onClick={handleBack}
            className={`px-6 py-2.5 rounded-lg text-muted hover:text-text font-medium transition-colors ${currentStep === 0 ? 'invisible' : ''
              }`}
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={saving}
            className={`px-8 py-2.5 rounded-lg font-medium shadow-lg shadow-primary/25 transition-all w-full sm:w-auto ${saving
              ? 'bg-muted text-muted-foreground cursor-not-allowed hidden'
              : 'bg-primary text-white hover:bg-accent hover:scale-[1.02]'
              }`}
          >
            {saving ? 'Saving...' : currentStep === 3 ? 'Save Profile' : 'Continue'}
          </button>
        </div>
      </div>
    </StepWizard>
  );
}
