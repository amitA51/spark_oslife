
import React from 'react';
import type { PersonalItem, ProductivityForecast } from '../types';
import ProductivityScore from './ProductivityScore';
import WeeklyTasksChart from './WeeklyTasksChart';
import HabitHeatmap from './HabitHeatmap';

interface DashboardProps {
    tasks: PersonalItem[];
    habits: PersonalItem[];
    personalItems: PersonalItem[];
    forecast: ProductivityForecast | null;
    isLoadingForecast: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, habits, personalItems, forecast, isLoadingForecast }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1 themed-card">
                 <ProductivityScore 
                    score={forecast?.score || 0}
                    text={forecast?.forecastText || ''}
                    isLoading={isLoadingForecast}
                />
            </div>
            <div className="md:col-span-1 themed-card">
                <WeeklyTasksChart tasks={tasks} />
            </div>
            <div className="md:col-span-2 themed-card overflow-hidden">
                <HabitHeatmap habits={habits} personalItems={personalItems} />
            </div>
        </div>
    );
};

export default Dashboard;
