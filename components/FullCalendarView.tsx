import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { he } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { GoogleCalendarEvent, PersonalItem } from '../types';
import { getEventsForDateRange, createEvent, updateEvent, deleteEvent } from '../services/googleCalendarService';
import CalendarEventModal from './CalendarEventModal';
import { PlusIcon, RefreshIcon } from './icons';

const locales = {
    'he': he,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface FullCalendarViewProps {
    tasks?: PersonalItem[];
    onEventClick?: (event: GoogleCalendarEvent) => void;
}

const FullCalendarView: React.FC<FullCalendarViewProps> = ({ tasks = [], onEventClick }) => {
    const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentView, setCurrentView] = useState<View>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<GoogleCalendarEvent | undefined>();
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

    const loadEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            // Calculate date range based on current view
            const start = new Date(currentDate);
            const end = new Date(currentDate);

            if (currentView === 'month') {
                start.setDate(1);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0);
            } else if (currentView === 'week') {
                const day = start.getDay();
                start.setDate(start.getDate() - day);
                end.setDate(start.getDate() + 6);
            } else {
                // day view
                end.setDate(end.getDate() + 1);
            }

            const calendarEvents = await getEventsForDateRange(start, end);
            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentDate, currentView]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        setSelectedSlot(slotInfo);
        setSelectedEvent(undefined);
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event: any) => {
        if (event.resource?.type === 'task') {
            // It's a task, not a calendar event
            return;
        }

        if (onEventClick) {
            onEventClick(event);
        } else {
            setSelectedEvent(event);
            setSelectedSlot(null);
            setIsModalOpen(true);
        }
    };

    const handleSaveEvent = async (eventData: {
        summary: string;
        description?: string;
        start: { dateTime: string };
        end: { dateTime: string };
    }) => {
        try {
            if (selectedEvent && selectedEvent.id) {
                // Update existing event
                await updateEvent(selectedEvent.id, eventData);
            } else {
                // Create new event
                await createEvent({
                    ...eventData,
                    reminders: { useDefault: true },
                });
            }
            await loadEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            throw error;
        }
    };

    const handleDeleteEvent = async () => {
        if (selectedEvent && selectedEvent.id) {
            if (confirm('האם למחוק את האירוע?')) {
                try {
                    await deleteEvent(selectedEvent.id);
                    setIsModalOpen(false);
                    await loadEvents();
                } catch (error) {
                    console.error('Error deleting event:', error);
                    alert('שגיאה במחיקת האירוע');
                }
            }
        }
    };

    // Convert events to calendar format
    const calendarEvents = events.map(event => ({
        ...event,
        title: event.summary,
        start: event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!),
        end: event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date!),
    }));

    // Add tasks as events (optional)
    const taskEvents = tasks
        .filter(task => task.dueDate && !task.isCompleted)
        .map(task => ({
            id: task.id,
            title: `📋 ${task.title}`,
            start: new Date(task.dueDate + (task.dueTime ? `T${task.dueTime}` : 'T09:00')),
            end: new Date(task.dueDate + (task.dueTime ? `T${task.dueTime}` : 'T09:00')),
            allDay: !task.dueTime,
            resource: { type: 'task', task },
        }));

    const allEvents = [...calendarEvents, ...taskEvents];

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">לוח שנה מלא</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadEvents}
                        disabled={isLoading}
                        className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                        title="רענן"
                    >
                        <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => {
                            setSelectedSlot({ start: new Date(), end: new Date(Date.now() + 3600000) });
                            setSelectedEvent(undefined);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-[var(--dynamic-accent-start)] text-white rounded-lg hover:brightness-110 transition-all"
                    >
                        <PlusIcon className="w-4 h-4" />
                        אירוע חדש
                    </button>
                </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 p-4 overflow-auto">
                <div className="h-full min-h-[500px] calendar-container">
                    <Calendar
                        localizer={localizer}
                        events={allEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        view={currentView}
                        onView={setCurrentView}
                        date={currentDate}
                        onNavigate={setCurrentDate}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        selectable
                        popup
                        culture="he"
                        rtl
                        messages={{
                            next: 'הבא',
                            previous: 'הקודם',
                            today: 'היום',
                            month: 'חודש',
                            week: 'שבוע',
                            day: 'יום',
                            agenda: 'סדר יום',
                            date: 'תאריך',
                            time: 'שעה',
                            event: 'אירוע',
                            noEventsInRange: 'אין אירועים בטווח זה',
                            showMore: (total) => `+${total} נוספים`,
                        }}
                        eventPropGetter={(event: any) => {
                            const isTask = event.resource?.type === 'task';
                            return {
                                style: {
                                    backgroundColor: isTask ? 'var(--dynamic-accent-end)' : 'var(--dynamic-accent-start)',
                                    borderRadius: '6px',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.875rem',
                                },
                            };
                        }}
                    />
                </div>
            </div>

            {/* Event Modal */}
            <CalendarEventModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedEvent(undefined);
                    setSelectedSlot(null);
                }}
                onSave={handleSaveEvent}
                initialEvent={selectedEvent}
            />

            {/* Delete button for existing events */}
            {isModalOpen && selectedEvent && (
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
                    <button
                        onClick={handleDeleteEvent}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                    >
                        מחק אירוע
                    </button>
                </div>
            )}

            <style>{`
                .calendar-container .rbc-calendar {
                    font-family: inherit;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }
                
                .calendar-container .rbc-header {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border-color: var(--border-primary);
                    padding: 0.75rem;
                    font-weight: 600;
                }
                
                .calendar-container .rbc-today {
                    background-color: var(--dynamic-accent-start) !important;
                    opacity: 0.1;
                }
                
                .calendar-container .rbc-off-range-bg {
                    background: var(--bg-tertiary);
                }
                
                .calendar-container .rbc-date-cell {
                    color: var(--text-primary);
                }
                
                .calendar-container .rbc-month-view,
                .calendar-container .rbc-time-view {
                    border-color: var(--border-primary);
                }
                
                .calendar-container .rbc-day-bg,
                .calendar-container .rbc-month-row {
                    border-color: var(--border-primary);
                }
                
                .calendar-container .rbc-event {
                    padding: 2px 5px;
                }
                
                .calendar-container .rbc-toolbar button {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-primary);
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                }
                
                .calendar-container .rbc-toolbar button:hover {
                    background: var(--bg-tertiary);
                }
                
                .calendar-container .rbc-toolbar button.rbc-active {
                    background: var(--dynamic-accent-start);
                    color: white;
                    border-color: var(--dynamic-accent-start);
                }
            `}</style>
        </div>
    );
};

export default FullCalendarView;
