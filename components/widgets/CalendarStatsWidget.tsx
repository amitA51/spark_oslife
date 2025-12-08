
import React from 'react';
import { useCalendarStats } from '../../src/contexts/CalendarContext';
import { CalendarIcon, TrendingUpIcon, TrendingDownIcon } from '../icons';

const CalendarStatsWidget: React.FC = () => {
    const { totalEvents, todayEvents, thisWeekEvents, upcomingEvents } = useCalendarStats();

    return (
        <div className="spark-card p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-lg font-bold text-white">סיכום יומן</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Today */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <span className="text-xs text-gray-400 block mb-1">היום</span>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{todayEvents}</span>
                        <span className="text-xs text-gray-500 mb-1">אירועים</span>
                    </div>
                </div>

                {/* This Week */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <span className="text-xs text-gray-400 block mb-1">השבוע</span>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{thisWeekEvents}</span>
                        <span className="text-xs text-gray-500 mb-1">אירועים</span>
                    </div>
                </div>

                {/* Upcoming */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 col-span-2 flex items-center justify-between">
                    <div>
                        <span className="text-xs text-gray-400 block">עתידיים</span>
                        <span className="text-xl font-bold text-white">{upcomingEvents}</span>
                    </div>
                    {upcomingEvents > 0 ? (
                        <TrendingUpIcon className="w-8 h-8 text-emerald-400 opacity-50" />
                    ) : (
                        <TrendingDownIcon className="w-8 h-8 text-gray-600 opacity-50" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarStatsWidget;
