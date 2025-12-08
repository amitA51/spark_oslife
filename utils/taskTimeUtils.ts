import { PersonalItem } from '../types';

export interface TimeCategorizedTasks {
  overdue: PersonalItem[];
  morning: PersonalItem[];
  afternoon: PersonalItem[];
  evening: PersonalItem[];
  noTime: PersonalItem[];
}

export function categorizeTasksByTime(tasks: PersonalItem[]): TimeCategorizedTasks {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const categorized: TimeCategorizedTasks = {
    overdue: [],
    morning: [],
    afternoon: [],
    evening: [],
    noTime: [],
  };

  const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year || new Date().getFullYear(), (month || 1) - 1, day || 1);
  };

  const parseTime = (timeStr?: string): number => {
    if (!timeStr) return -1;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0); // Convert to minutes since midnight
  };

  tasks.forEach(task => {
    if (task.type !== 'task' || task.isCompleted) return;

    // Check if task is overdue
    if (task.dueDate) {
      const dueDate = parseDate(task.dueDate);
      dueDate.setHours(23, 59, 59, 999);

      if (dueDate < today) {
        categorized.overdue.push(task);
        return;
      }
    }

    // Categorize by time if it's today or no date
    const timeInMinutes = parseTime(task.dueTime);

    if (timeInMinutes === -1) {
      categorized.noTime.push(task);
    } else if (timeInMinutes < 12 * 60) {
      // Before 12:00
      categorized.morning.push(task);
    } else if (timeInMinutes < 17 * 60) {
      // 12:00 - 17:00
      categorized.afternoon.push(task);
    } else {
      // After 17:00
      categorized.evening.push(task);
    }
  });

  // Sort each category by time
  const sortByTime = (a: PersonalItem, b: PersonalItem) => {
    const timeA = parseTime(a.dueTime);
    const timeB = parseTime(b.dueTime);
    if (timeA === timeB) return 0;
    if (timeA === -1) return 1; // No time goes to end
    if (timeB === -1) return -1;
    return timeA - timeB;
  };

  categorized.overdue.sort(sortByTime);
  categorized.morning.sort(sortByTime);
  categorized.afternoon.sort(sortByTime);
  categorized.evening.sort(sortByTime);
  categorized.noTime.sort((a, b) => {
    // Sort by priority if no time
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
  });

  return categorized;
}
