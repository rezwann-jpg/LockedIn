import { useState, useEffect, useRef } from 'react';

interface MonthYearPickerProps {
    value: string; // Format: "YYYY-MM"
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthYearPicker({ value, onChange, label, className = '' }: MonthYearPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse current value
    const [year, monthStr] = (value || '').split('-');
    const monthIndex = monthStr ? parseInt(monthStr, 10) - 1 : -1;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 65 }, (_, i) => currentYear + 15 - i); // Future 15 years + Past 50 years

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMonthSelect = (mIndex: number) => {
        const y = year || currentYear.toString();
        const m = (mIndex + 1).toString().padStart(2, '0');
        onChange(`${y}-${m}`);
    };

    const handleYearSelect = (y: number) => {
        const m = monthIndex !== -1 ? (monthIndex + 1).toString().padStart(2, '0') : '01';
        onChange(`${y}-${m}`);
    };

    const displayValue = value
        ? `${months[monthIndex]} ${year}`
        : 'Select Date';

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="block text-sm font-medium text-text mb-1">{label}</label>}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text text-left focus:outline-none focus:ring-2 focus:ring-primary/50 flex justify-between items-center transition-colors hover:border-primary/50"
            >
                <span className={value ? 'text-text' : 'text-muted'}>{displayValue}</span>
                <span className="text-muted text-xs">▼</span>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-secondary border border-muted rounded-lg shadow-xl p-4 min-w-[300px]">
                    <div className="flex gap-4">
                        {/* Years Column */}
                        <div className="w-1/3 h-64 overflow-y-auto border-r border-muted/30 scrollbar-thin">
                            <div className="text-xs font-semibold text-muted mb-2 px-2">Year</div>
                            {years.map((y) => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => handleYearSelect(y)}
                                    className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${year === y.toString()
                                        ? 'bg-primary text-white'
                                        : 'text-text hover:bg-muted/20'
                                        }`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>

                        {/* Months Grid */}
                        <div className="w-2/3">
                            <div className="text-xs font-semibold text-muted mb-2 px-2">Month</div>
                            <div className="grid grid-cols-2 gap-1">
                                {months.map((m, idx) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => handleMonthSelect(idx)}
                                        className={`text-left px-2 py-1.5 text-sm rounded transition-colors ${monthIndex === idx
                                            ? 'bg-primary/20 text-primary font-medium'
                                            : 'text-text hover:bg-muted/20'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
