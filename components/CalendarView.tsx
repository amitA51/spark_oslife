
import React, { useState, useMemo, DragEvent, useCallback, useContext } from 'react';
import type { PersonalItem, PersonalItemType, AddableType, GoogleCalendarEvent } from '../types';
import { PERSONAL_ITEM_TYPE_COLORS } from '../constants';
import { getIconForName } from './IconMap';
import { AppContext } from '../state/AppContext';
import { ChevronLeftIcon, GoogleCalendarIcon, AddIcon } from './icons';

// Types and Props
type CalendarViewMode = 'month' | 'week';

interface CalendarViewProps {
  items: PersonalItem[];
  onSelectItem: (item: PersonalItem, event: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
  onQuickAdd: (type: AddableType, date: string) => void;
}

// Utility to get a YYYY-MM-DD string from a Date object, timezone-agnostic.
const getDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- Sub-Components ---

// Header for navigation and view switching
const CalendarHeader: React.FC<{
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    viewMode: CalendarViewMode;
    setViewMode: (mode: CalendarViewMode) => void;
}> = ({ currentDate, setCurrentDate, viewMode, setViewMode }) => {
    const changeDate = (delta: number) => {
        const newDate = new Date(currentDate);
        if(viewMode === 'month') newDate.setMonth(currentDate.getMonth() + delta);
        else newDate.setDate(currentDate.getDate() + (delta * 7));
        setCurrentDate(newDate);
    };

    return (
        <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentDate(new Date())} className="text-sm font-semibold bg-[var(--bg-secondary)] px-4 py-2 rounded-full hover:bg-white/10 transition-colors">היום</button>
                <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-white/10"><ChevronLeftIcon className="w-6 h-6 transform rotate-180" /></button>
                <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-white/10"><ChevronLeftIcon className="w-6 h-6" /></button>
            </div>
            <h2 className="text-xl font-bold text-white text-center">{currentDate.toLocaleString('he-IL', { month: 'long', year: 'numeric' })}</h2>
            <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-full text-sm">
                <button onClick={() => setViewMode('month')} className={`px-4 py-1.5 rounded-full ${viewMode === 'month' ? 'bg-white/20 text-white' : 'text-[var(--text-secondary)]'}`}>חודש</button>
                <button onClick={() => setViewMode('week')} className={`px-4 py-1.5 rounded-full ${viewMode === 'week' ? 'bg-white/20 text-white' : 'text-[var(--text-secondary)]'}`}>שבוע</button>
            </div>
        </div>
    );
};


// Component for a PersonalItem in the calendar
const CalendarItem: React.FC<{ item: PersonalItem, onSelect: (e: React.MouseEvent) => void }> = ({ item, onSelect }) => {
    const { state } = useContext(AppContext);
    const space = item.spaceId ? state.spaces.find(s => s.id === item.spaceId) : null;
    const color = space?.color || PERSONAL_ITEM_TYPE_COLORS[item.type];
    const Icon = item.icon ? getIconForName(item.icon) : null;

    return (
        <button
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(item));
                e.dataTransfer.effectAllowed = 'move';
                e.currentTarget.style.opacity = '0.5';
            }}
            onDragEnd={(e) => e.currentTarget.style.opacity = '1'}
            onClick={onSelect}
            className="w-full text-right text-xs p-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: `${color}26` }}
        >
            {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />}
            <p className="truncate font-medium" style={{ color }}>{item.title}</p>
        </button>
    );
};

// Component for a Google Calendar event
const GoogleEventItem: React.FC<{ event: GoogleCalendarEvent }> = ({ event }) => {
    const startTime = event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'All-day';
    
    return (
        <a 
            href={event.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-right text-xs p-1.5 rounded-md transition-colors flex items-center gap-1.5 bg-blue-500/10 border-l-4 border-blue-500 hover:bg-blue-500/20"
        >
            <GoogleCalendarIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="truncate">
                <p className="truncate font-medium text-blue-300">{event.summary}</p>
                <p className="text-blue-400/70">{startTime}</p>
            </div>
        </a>
    );
};

// --- Main View Component ---

const CalendarView: React.FC<CalendarViewProps> = ({ items, onSelectItem, onUpdate, onQuickAdd }) => {
  const { state } = useContext(AppContext);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const combinedItemsByDate = useMemo(() => {
    const map = new Map<string, (PersonalItem | GoogleCalendarEvent)[]>();

    const addOrPush = (key: string, item: PersonalItem | GoogleCalendarEvent) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
    };

    // Add Personal Items
    items.forEach(item => {
      const dateStr = item.dueDate || item.metadata?.targetDate;
      // Use the 'YYYY-MM-DD' string directly as the key
      if (dateStr) {
        addOrPush(dateStr, item);
      }
    });

    // Add Google Calendar Events
    state.calendarEvents.forEach(event => {
        const dateStr = event.start?.dateTime || event.start?.date;
        if(dateStr) {
            // FIX: Directly slice the YYYY-MM-DD part from the string, making it timezone-agnostic.
            // This works for both 'YYYY-MM-DD' (all-day) and 'YYYY-MM-DDTHH:mm:ssZ' (timed) formats.
            const dateKey = dateStr.substring(0, 10);
            addOrPush(dateKey, event);
        }
    });

    // Sort items within each day
    map.forEach((dayItems) => {
        dayItems.sort((a, b) => {
            const timeA = 'start' in a ? (a.start?.dateTime ? new Date(a.start.dateTime).getTime() : -1) : 0;
            const timeB = 'start' in b ? (b.start?.dateTime ? new Date(b.start.dateTime).getTime() : -1) : 0;
            if (timeA !== timeB) return timeA - timeB;
            return 0; // Keep personal item order for now
        });
    });

    return map;
  }, [items, state.calendarEvents]);


  const handleDrop = (e: DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    try {
        const item = JSON.parse(e.dataTransfer.getData('application/json')) as PersonalItem;
        if (item && item.id) { // Check if it's a PersonalItem
            const newDate = getDateKey(targetDate);
            const updates: Partial<PersonalItem> = {};
            if ('dueDate' in item || item.type === 'task' || item.type === 'note') updates.dueDate = newDate;
            if (item.metadata && 'targetDate' in item.metadata) {
                updates.metadata = { ...item.metadata, targetDate: newDate };
            } else if (item.type === 'goal') {
                updates.metadata = { targetDate: newDate };
            }
            if (Object.keys(updates).length > 0) {
               onUpdate(item.id, updates);
            }
        }
    } catch(err) {
        console.error("Failed to handle drop:", err);
    }
  };
  
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    return (
        <div className="grid grid-cols-7 border-t border-r border-[var(--border-primary)]">
            {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => <div key={d} className="text-center font-semibold text-sm text-[var(--text-secondary)] py-2 border-b border-l border-[var(--border-primary)] bg-[var(--bg-secondary)]">{d}</div>)}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="border-b border-l border-[var(--border-primary)]" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(year, month, day);
                const dateKey = getDateKey(date);
                const itemsForDay = combinedItemsByDate.get(dateKey) || [];
                const isToday = getDateKey(new Date()) === dateKey;
                const dayOfWeek = date.getDay();
                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
                
                return (
                    <div
                        key={day}
                        onDragOver={(e) => { e.preventDefault(); setDragOverDate(dateKey); }}
                        onDragLeave={() => setDragOverDate(null)}
                        onDrop={(e) => handleDrop(e, date)}
                        className={`h-36 border-b border-l border-[var(--border-primary)] p-1.5 transition-colors duration-300 relative group flex flex-col ${dragOverDate === dateKey ? 'calendar-day-drag-over' : isToday ? 'bg-[var(--dynamic-accent-start)]/10' : isWeekend ? 'bg-white/5' : 'hover:bg-white/5'}`}
                    >
                        <span className={`text-sm mb-1.5 block ${isToday ? 'font-bold text-white bg-[var(--dynamic-accent-start)] rounded-full w-6 h-6 flex items-center justify-center' : 'text-[var(--text-secondary)]'}`}>{day}</span>
                        <div className="space-y-1 overflow-y-auto flex-1 pr-1 -mr-1">
                            {itemsForDay.map((item, index) => {
                                if ('summary' in item) { // It's a GoogleCalendarEvent
                                    return <GoogleEventItem key={`g-${(item as GoogleCalendarEvent).summary}-${index}`} event={item as GoogleCalendarEvent} />;
                                } else { // It's a PersonalItem
                                    return <CalendarItem key={item.id} item={item as PersonalItem} onSelect={(e) => onSelectItem(item as PersonalItem, e)} />;
                                }
                            })}
                        </div>
                        <button 
                            onClick={() => onQuickAdd('note', dateKey)} 
                            className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--dynamic-accent-highlight)] hover:border-[var(--dynamic-accent-highlight)] transition-all flex items-center justify-center shadow-sm"
                            title="הוסף פתק מהיר"
                        >
                            <AddIcon className="w-4 h-4"/>
                        </button>
                    </div>
                )
            })}
        </div>
    );
  };
  
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = Array.from({length: 7}).map((_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });

    return (
        <div className="flex md:grid md:grid-cols-7 border-t border-[var(--border-primary)] overflow-x-auto">
            {weekDays.map(day => {
                const dateKey = getDateKey(day);
                const itemsForDay = combinedItemsByDate.get(dateKey) || [];
                const isToday = getDateKey(new Date()) === dateKey;
                const dayOfWeek = day.getDay();
                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                return (
                    <div 
                        key={dateKey}
                        onDragOver={(e) => { e.preventDefault(); setDragOverDate(dateKey); }}
                        onDragLeave={() => setDragOverDate(null)}
                        onDrop={(e) => handleDrop(e, day)}
                        className={`min-h-[60vh] border-l border-b border-[var(--border-primary)] p-2 space-y-2 transition-colors group flex-shrink-0 w-[50vw] sm:w-[30vw] md:w-auto flex flex-col relative ${dragOverDate === dateKey ? 'calendar-day-drag-over' : isToday ? 'bg-[var(--dynamic-accent-start)]/10' : isWeekend ? 'bg-white/5' : 'hover:bg-white/5'}`}
                    >
                        <div className="text-center mb-2">
                           <p className={`text-xs ${isToday ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'][day.getDay()]}</p>
                           <p className={`font-bold text-lg ${isToday ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{day.getDate()}</p>
                        </div>
                        <div className="space-y-2 flex-1">
                            {itemsForDay.map((item, index) => {
                                if ('summary' in item) { // GoogleCalendarEvent
                                    return <GoogleEventItem key={`g-${(item as GoogleCalendarEvent).summary}-${index}`} event={item as GoogleCalendarEvent} />;
                                } else { // PersonalItem
                                    return <CalendarItem key={item.id} item={item as PersonalItem} onSelect={(e) => onSelectItem(item as PersonalItem, e)} />;
                                }
                            })}
                        </div>
                        <button 
                            onClick={() => onQuickAdd('note', dateKey)} 
                            className="w-full mt-2 p-2 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--dynamic-accent-highlight)] hover:border-[var(--dynamic-accent-highlight)] transition-all flex items-center justify-center gap-1"
                        >
                            <AddIcon className="w-3 h-3"/> פתק
                        </button>
                    </div>
                )
            })}
        </div>
    );
  };


  return (
    <div className="themed-card p-4">
        <CalendarHeader 
            currentDate={currentDate} 
            setCurrentDate={setCurrentDate} 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
        />
        
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}
    </div>
  );
};

export default CalendarView;
