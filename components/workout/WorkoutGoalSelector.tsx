import React from 'react';
import { motion } from 'framer-motion';
import { WorkoutGoal } from '../../types';

interface WorkoutGoalSelectorProps {
  onSelect: (goal: WorkoutGoal) => void;
  onClose: () => void;
  currentGoal?: WorkoutGoal;
}

const goals: {
  id: WorkoutGoal;
  label: string;
  icon: string;
  description: string;
  color: string;
}[] = [
  {
    id: 'strength',
    label: 'Strength',
    icon: '💪',
    description: 'Low reps, high weight, long rest. Focus on raw power.',
    color: '#ef4444', // Red
  },
  {
    id: 'hypertrophy',
    label: 'Hypertrophy',
    icon: '🦍',
    description: 'Moderate reps, moderate weight. Focus on muscle growth.',
    color: '#3b82f6', // Blue
  },
  {
    id: 'endurance',
    label: 'Endurance',
    icon: '🏃',
    description: 'High reps, lower weight, short rest. Focus on stamina.',
    color: '#10b981', // Green
  },
  {
    id: 'general',
    label: 'General Fitness',
    icon: '✨',
    description: 'Balanced approach for overall health and well-being.',
    color: '#8b5cf6', // Purple
  },
];

const WorkoutGoalSelector: React.FC<WorkoutGoalSelectorProps> = ({
  onSelect,
  onClose,
  currentGoal,
}) => {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-[90%] max-w-[400px] p-8 flex flex-col gap-6 bg-[#0f0f13] rounded-3xl border border-white/10 shadow-2xl"
      >
        <h2 className="text-2xl font-extrabold text-white text-center">Choose Your Goal</h2>

        <div className="flex flex-col gap-4 w-full">
          {goals.map(goal => (
            <motion.button
              key={goal.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(goal.id)}
              className={`
                                flex items-center gap-4 p-4 rounded-2xl border transition-all w-full text-left
                                ${
                                  currentGoal === goal.id
                                    ? 'bg-opacity-15'
                                    : 'bg-transparent border-white/10 hover:bg-white/5'
                                }
                            `}
              style={{
                borderColor: currentGoal === goal.id ? goal.color : undefined,
                backgroundColor: currentGoal === goal.id ? `${goal.color}26` : undefined, // 26 is hex for ~15% opacity
              }}
            >
              <span className="text-4xl">{goal.icon}</span>
              <div>
                <div className="font-bold text-white text-lg">{goal.label}</div>
                <div className="text-sm text-white/60 mt-1">{goal.description}</div>
              </div>
            </motion.button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-2 bg-transparent border-none text-white/40 text-sm cursor-pointer hover:text-white transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
};

export default WorkoutGoalSelector;
