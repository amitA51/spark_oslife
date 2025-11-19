import { useEffect, useContext, useRef } from 'react';
import { AppContext } from '../state/AppContext';
import { showNotification } from '../services/notificationsService';

export const useTaskReminders = () => {
    const { state } = useContext(AppContext);
    const { personalItems, settings } = state;
    const notifiedTaskIds = useRef(new Set<string>());

    useEffect(() => {
        if (Notification.permission !== 'granted' || !settings.notificationsEnabled || !settings.taskRemindersEnabled) {
            return;
        }

        const checkTasks = () => {
            const now = new Date();
            const openTasks = personalItems.filter(
                item => item.type === 'task' && !item.isCompleted && item.dueDate
            );

            openTasks.forEach(task => {
                // This creates the date in the user's local timezone at midnight
                const [year, month, day] = task.dueDate!.split('-').map(Number);
                const dueDate = new Date(year, month - 1, day);
                
                if (task.dueTime) {
                    const [hours, minutes] = task.dueTime.split(':').map(Number);
                    dueDate.setHours(hours, minutes, 0, 0);
                } else {
                    // Default to 9 AM if no time is set
                    dueDate.setHours(9, 0, 0, 0);
                }
                
                const timeDiff = dueDate.getTime() - now.getTime();
                const minutesUntilDue = Math.ceil(timeDiff / (1000 * 60));

                if (minutesUntilDue > 0 && minutesUntilDue <= settings.taskReminderTime) {
                    if (!notifiedTaskIds.current.has(task.id)) {
                        notifiedTaskIds.current.add(task.id);
                        
                        const body = task.dueTime
                            ? `המשימה מתוכננת לשעה ${task.dueTime}.`
                            : `המשימה אמורה להתבצע היום.`;

                        showNotification(`תזכורת למשימה: ${task.title}`, {
                            body: body,
                            tag: `task-reminder-${task.id}`,
                            data: { action: 'go_today' }
                        });
                    }
                } else if (minutesUntilDue < -settings.taskReminderTime) {
                    // Reset notification status if the due date has passed significantly, 
                    // allowing for a new notification if the date is changed.
                    notifiedTaskIds.current.delete(task.id);
                }
            });
        };

        const intervalId = setInterval(checkTasks, 60000); // Check every minute

        return () => clearInterval(intervalId);

    }, [personalItems, settings.notificationsEnabled, settings.taskRemindersEnabled, settings.taskReminderTime]);
};