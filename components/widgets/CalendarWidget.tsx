import React, { useEffect, useState } from 'react';
import BaseWidget from './BaseWidget';
import { GoogleCalendarIcon, CalendarIcon } from '../icons';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { GoogleCalendarEvent } from '../../types';

interface CalendarWidgetProps {
  onClick?: () => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onClick }) => {
  const { listEvents, isAuthenticated, isLoading } = useGoogleCalendar();
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);

      const fetchedEvents = await listEvents(now, nextWeek);
      setEvents(fetchedEvents.slice(0, 5)); // Show top 5
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [isAuthenticated]);

  const formatEventTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'היום';
    if (date.toDateString() === tomorrow.toDateString()) return 'מחר';

    return date.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });
  };

  return (
    <BaseWidget
      title="לוח שנה"
      icon={<GoogleCalendarIcon className="w-5 h-5" />}
      size="medium"
      onRefresh={fetchEvents}
      isLoading={loading || isLoading}
      onClick={onClick}
    >
      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <GoogleCalendarIcon className="w-12 h-12 text-[var(--text-secondary)] opacity-20 mb-3" />
          <p className="text-[var(--text-primary)] font-medium mb-1">היומן לא מחובר</p>
          <p className="text-xs text-[var(--text-secondary)]">
            התחבר לגוגל בהגדרות כדי לראות אירועים
          </p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-secondary)]">
          <CalendarIcon className="w-12 h-12 mb-2 opacity-20" />
          <p>אין אירועים בשבוע הקרוב</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => {
            const isAllDay = !event.start.dateTime;
            const startTime = isAllDay ? 'כל היום' : formatEventTime(event.start.dateTime);
            const dateLabel = formatEventDate(event.start.dateTime || event.start.date);

            return (
              <div
                key={event.id || index}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors border-r-2 border-[var(--dynamic-accent-start)]"
              >
                <div className="flex flex-col items-center min-w-[3rem] text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded p-1">
                  <span className="font-bold text-[var(--text-primary)]">{dateLabel}</span>
                  <span>{startTime}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {event.summary}
                  </p>
                  {event.location && (
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                      {event.location}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BaseWidget>
  );
};

export default CalendarWidget;
