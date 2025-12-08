import React from 'react';
import ActiveWorkout from './ActiveWorkout';
import { useData } from '../../src/contexts/DataContext';

const ActiveWorkoutOverlay: React.FC = () => {
  const { personalItems, updatePersonalItem } = useData();

  // Find the active workout
  const activeWorkout = personalItems.find(
    item => item.type === 'workout' && item.isActiveWorkout && !item.workoutEndTime
  );

  if (!activeWorkout) return null;

  const handleUpdate = (id: string, updates: any) => {
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

export default ActiveWorkoutOverlay;
