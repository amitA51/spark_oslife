import { useEffect, useRef } from 'react';
import { isHabitForToday } from './useTodayItems';
import { showNotification } from '../services/notificationsService';
import type { PersonalItem } from '../types';
import { useData } from '../src/contexts/DataContext';
import { useSettings } from '../src/contexts/SettingsContext';

export const useHabitReminders = () => {
  const { personalItems } = useData();
  const { settings } = useSettings();
  const scheduledTimeouts = useRef<number[]>([]);
  // Use ref to always have fresh personalItems in timeout callbacks
  const personalItemsRef = useRef<PersonalItem[]>(personalItems);

  // Keep ref updated with latest personalItems
  useEffect(() => {
    personalItemsRef.current = personalItems;
  }, [personalItems]);

  useEffect(() => {
    // Clear any previously scheduled timeouts
    scheduledTimeouts.current.forEach(clearTimeout);
    scheduledTimeouts.current = [];

    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted' ||
      !settings.notificationsEnabled ||
      !settings.enableHabitReminders
    ) {
      return;
    }

    const habitsWithReminders = personalItems.filter(
      item =>
        item.type === 'habit' && item.reminderEnabled && item.reminderTime && isHabitForToday(item)
    );

    if (habitsWithReminders.length === 0) {
      return;
    }

    const now = new Date();

    habitsWithReminders.forEach(habit => {
      const [hours = 0, minutes = 0] = habit.reminderTime!.split(':').map(Number);
      const reminderDate = new Date();
      reminderDate.setHours(hours, minutes, 0, 0);

      const delay = reminderDate.getTime() - now.getTime();

      if (delay > 0) {
        const timeoutId = window.setTimeout(() => {
          // Use ref to get fresh state
          const currentHabitState = personalItemsRef.current.find(h => h.id === habit.id);
          if (currentHabitState && isHabitForToday(currentHabitState)) {
            showNotification(`תזכורת: ${habit.title}`, {
              body: 'אל תשכח להשלים את ההרגל שלך להיום!',
              tag: `habit-reminder-${habit.id}`,
              data: { action: 'go_today' },
            });
          }
        }, delay);
        scheduledTimeouts.current.push(timeoutId);
      }
    });

    // Cleanup function
    return () => {
      scheduledTimeouts.current.forEach(clearTimeout);
      scheduledTimeouts.current = [];
    };
  }, [personalItems, settings.enableHabitReminders, settings.notificationsEnabled]);
};
