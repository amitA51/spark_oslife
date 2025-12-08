import React from 'react';
import { Screen } from '../types';
import FullCalendarView from '../components/FullCalendarView';
import { ChevronRightIcon } from '../components/icons';

interface CalendarScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ setActiveScreen }) => {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      <header className="p-4 border-b border-[var(--border-primary)] flex items-center gap-3 bg-[var(--bg-secondary)]/80 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={() => setActiveScreen('dashboard')}
          className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">לוח שנה מלא</h1>
      </header>

      <div className="flex-1 overflow-hidden p-4">
        <FullCalendarView />
      </div>
    </div>
  );
};

export default CalendarScreen;
