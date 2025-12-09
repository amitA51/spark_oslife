import React from 'react';
// Using new modular architecture - see ./core, ./hooks, ./components, ./overlays
import { ActiveWorkout } from '.';
import { useData } from '../../src/contexts/DataContext';
import { PersonalItem } from '../../types';

const ActiveWorkoutOverlay: React.FC = () => {
  const { personalItems, updatePersonalItem } = useData();

  // Find the active workout
  const activeWorkout = personalItems.find(
    item => item.type === 'workout' && item.isActiveWorkout && !item.workoutEndTime
  );

  if (!activeWorkout) return null;

  const handleUpdate = (id: string, updates: Partial<PersonalItem>) => {
    void updatePersonalItem(id, updates);
  };

  const handleExit = () => {
    const updates = {
      isActiveWorkout: false,
      workoutEndTime: new Date().toISOString(),
    };
    void updatePersonalItem(activeWorkout.id, updates);
  };

  return <ActiveWorkout item={activeWorkout} onUpdate={handleUpdate} onExit={handleExit} />;
};

export default React.memo(ActiveWorkoutOverlay);
