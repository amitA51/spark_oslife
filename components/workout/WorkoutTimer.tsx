import React from 'react';

interface WorkoutTimerProps {
  seconds: number;
  formatTime: (seconds: number) => string;
  className?: string;
}

/**
 * Simple presentational timer that formats the provided seconds.
 * The parent controls the timing logic.
 */
const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ seconds, formatTime, className = '' }) => {
  return <span className={className}>{formatTime(seconds)}</span>;
};

export default React.memo(WorkoutTimer);
