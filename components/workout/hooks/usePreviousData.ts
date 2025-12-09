// usePreviousData - Hook to fetch and provide ghost values from previous workouts
import { useState, useEffect } from 'react';
import { WorkoutSet } from '../../../types';
import { getWorkoutSessions } from '../../../services/dataService';

interface UsePreviousDataReturn {
    previousSets: WorkoutSet[] | null;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Fetches previous workout data for ghost value display
 * Shows what weight/reps were used last time for this exercise
 */
export function usePreviousData(exerciseName: string | undefined): UsePreviousDataReturn {
    const [previousSets, setPreviousSets] = useState<WorkoutSet[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!exerciseName) {
            setPreviousSets(null);
            return;
        }

        let isCancelled = false;
        setIsLoading(true);

        const fetchPreviousData = async () => {
            try {
                const sessions = await getWorkoutSessions();

                if (isCancelled) return;

                // Sort by most recent first
                sessions.sort((a, b) => {
                    const tb = new Date((b.endTime ?? b.startTime) || 0).getTime();
                    const ta = new Date((a.endTime ?? a.startTime) || 0).getTime();
                    return tb - ta;
                });

                // Find most recent session with this exercise
                const lastSession = sessions.find(s =>
                    s.exercises.some(e => e.name === exerciseName)
                );

                if (lastSession) {
                    const exData = lastSession.exercises.find(e => e.name === exerciseName);
                    if (exData && !isCancelled) {
                        setPreviousSets(exData.sets);
                        setError(null);
                        setIsLoading(false);
                        return;
                    }
                }

                if (!isCancelled) {
                    setPreviousSets(null);
                    setError(null);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Failed to fetch previous workout data:', err);
                if (!isCancelled) {
                    setPreviousSets(null);
                    setError(err as Error);
                    setIsLoading(false);
                }
            }
        };

        fetchPreviousData();

        return () => {
            isCancelled = true;
        };
    }, [exerciseName]);

    return { previousSets, isLoading, error };
}

export default usePreviousData;
