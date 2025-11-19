import React, { useState } from 'react';
import { CalendarIcon, ClockIcon } from './icons';
import { blockTimeForTask } from '../services/googleCalendarService';

interface TimeBlockerProps {
    taskId: string;
    taskTitle: string;
    onSuccess?: () => void;
}

const TimeBlocker: React.FC<TimeBlockerProps> = ({ taskId, taskTitle, onSuccess }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(60); // minutes
    const [isBlocking, setIsBlocking] = useState(false);

    const handleBlockTime = async () => {
        if (!date || !time) {
            alert('נא לבחור תאריך ושעה');
            return;
        }

        setIsBlocking(true);
        try {
            const startTime = new Date(`${date}T${time}`);
            await blockTimeForTask(taskId, taskTitle, startTime, duration);
            alert('הזמן נחסם בלוח השנה! ✅');
            setIsOpen(false);
            onSuccess?.();
        } catch (error) {
            console.error('Error blocking time:', error);
            alert('שגיאה בחסימת הזמן. ודא שאתה מחובר ל-Google Calendar.');
        } finally {
            setIsBlocking(false);
        }
    };

    // Set default to tomorrow at 9 AM
    React.useEffect(() => {
        if (isOpen && !date) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDate(tomorrow.toISOString().split('T')[0]);
            setTime('09:00');
        }
    }, [isOpen, date]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] text-[var(--text-primary)] rounded-lg transition-all text-sm"
            >
                <CalendarIcon className="w-4 h-4" />
                חסום זמן בלוח שנה
            </button>
        );
    }

    return (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm text-[var(--text-primary)]">חסימת זמן</h4>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    ביטול
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">תאריך</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]"
                    />
                </div>
                <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">שעה</label>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    משך זמן (דקות)
                </label>
                <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]"
                >
                    <option value={15}>15 דקות</option>
                    <option value={30}>30 דקות</option>
                    <option value={45}>45 דקות</option>
                    <option value={60}>שעה</option>
                    <option value={90}>שעה וחצי</option>
                    <option value={120}>שעתיים</option>
                    <option value={180}>3 שעות</option>
                </select>
            </div>

            <button
                onClick={handleBlockTime}
                disabled={isBlocking}
                className="w-full bg-[var(--dynamic-accent-start)] text-white rounded-lg py-2 text-sm font-medium hover:brightness-110 disabled:opacity-50 transition-all"
            >
                {isBlocking ? 'חוסם...' : 'חסום זמן'}
            </button>
        </div>
    );
};

export default TimeBlocker;
