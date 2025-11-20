import React, { useContext } from 'react';
import { AppContext } from '../../state/AppContext';
import ActiveWorkout from './ActiveWorkout';
import * as dataService from '../../services/dataService';

const ActiveWorkoutOverlay: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { personalItems } = state;

    // Find the active workout
    const activeWorkout = personalItems.find(item =>
        item.type === 'workout' && item.isActiveWorkout && !item.workoutEndTime
    );

    if (!activeWorkout) return null;

    const handleUpdate = (id: string, updates: any) => {
        dispatch({ type: 'UPDATE_PERSONAL_ITEM', payload: { id, updates } });
        dataService.updatePersonalItem(id, updates);
    };

    const handleExit = () => {
        // The ActiveWorkout component handles the logic for finishing the workout
        // by setting isActiveWorkout to false, which will cause this component
        // to return null on the next render.
    };

    return (
        <ActiveWorkout
            item={activeWorkout}
            onUpdate={handleUpdate}
            onExit={handleExit}
        />
    );
};

export default ActiveWorkoutOverlay;
