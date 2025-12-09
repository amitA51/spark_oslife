/**
 * ItemCreationForm Reducer - State management for complex form
 * 
 * Extracted from ItemCreationForm.tsx for:
 * - Better testability
 * - Clearer separation of concerns
 * - Reduced main component size
 */
import type { Exercise, RoadmapPhase, WorkoutSet, Attachment, SubTask, Template, PersonalItem } from '../types';
import { todayKey } from '../utils/dateUtils';

// --- Types ---
export type SubmissionStatus = 'idle' | 'submitting';

export interface FormState {
    title: string;
    content: string;
    url: string;
    dueDate: string;
    dueTime: string;
    priority: 'low' | 'medium' | 'high';
    author: string;
    totalPages: string;
    exercises: Exercise[];
    phases: RoadmapPhase[];
    attachments: Attachment[];
    icon: string;
    projectId: string;
    spaceId: string;
    isFetchingMetadata: boolean;
    submissionStatus: SubmissionStatus;
    status?: 'todo' | 'doing' | 'done';
    isGeneratingRoadmap: boolean;
    // Habit specific
    habitType: 'good' | 'bad';
    reminderEnabled: boolean;
    reminderTime: string;
    // Compatibility fields for HabitEdit
    subTasks: SubTask[];
    quotes: string[];
    autoDeleteAfter: number;
}

/** Type for form field values - covers all possible field types in FormState */
export type FormFieldValue =
    | string
    | boolean
    | number
    | Exercise[]
    | RoadmapPhase[]
    | Attachment[]
    | SubTask[]
    | string[]
    | 'low' | 'medium' | 'high'
    | 'todo' | 'doing' | 'done'
    | 'good' | 'bad';

export type FormAction =
    | { type: 'SET_FIELD'; payload: { field: keyof FormState; value: FormFieldValue } }
    | { type: 'ADD_EXERCISE' }
    | { type: 'UPDATE_EXERCISE'; payload: { index: number; name: string } }
    | { type: 'REMOVE_EXERCISE'; payload: { index: number } }
    | { type: 'ADD_SET'; payload: { exerciseIndex: number } }
    | {
        type: 'UPDATE_SET';
        payload: { exerciseIndex: number; setIndex: number; field: keyof WorkoutSet; value: string | number };
    }
    | { type: 'REMOVE_SET'; payload: { exerciseIndex: number; setIndex: number } }
    | { type: 'ADD_PHASE' }
    | {
        type: 'UPDATE_PHASE';
        payload: {
            index: number;
            field: keyof Omit<RoadmapPhase, 'isCompleted' | 'id' | 'notes' | 'tasks' | 'order'>;
            value: string;
        };
    }
    | { type: 'REMOVE_PHASE'; payload: { index: number } }
    | { type: 'APPLY_TEMPLATE'; payload: Template }
    | { type: 'SET_METADATA_RESULT'; payload: Partial<PersonalItem> }
    | { type: 'RESET_FORM' }
    | { type: 'SUBMIT_START' }
    | { type: 'SUBMIT_DONE' }
    | { type: 'SET_GENERATED_PHASES'; payload: Omit<RoadmapPhase, 'id' | 'order' | 'notes'>[] };

// --- Initial State ---
export const createInitialState = (): FormState => ({
    title: '',
    content: '',
    url: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    author: '',
    totalPages: '',
    exercises: [{ id: `ex-${Date.now()}`, name: '', sets: [{ reps: 0, weight: 0, notes: '' }] }],
    phases: [
        {
            id: `phase-${Date.now()}`,
            title: '',
            description: '',
            duration: '',
            tasks: [],
            order: 0,
            startDate: todayKey(),
            endDate: todayKey(),
            attachments: [],
            status: 'pending',
            dependencies: [],
            estimatedHours: 0,
        },
    ],
    attachments: [],
    icon: '',
    projectId: '',
    spaceId: '',
    isFetchingMetadata: false,
    submissionStatus: 'idle',
    status: 'todo',
    isGeneratingRoadmap: false,
    habitType: 'good',
    reminderEnabled: false,
    reminderTime: '09:00',
    subTasks: [],
    quotes: [],
    autoDeleteAfter: 0,
});

// --- Reducer ---
export const formReducer = (state: FormState, action: FormAction): FormState => {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.payload.field]: action.payload.value };

        case 'ADD_EXERCISE':
            return {
                ...state,
                exercises: [
                    ...state.exercises,
                    { id: `ex-${Date.now()}`, name: '', sets: [{ reps: 0, weight: 0, notes: '' }] },
                ],
            };

        case 'UPDATE_EXERCISE':
            return {
                ...state,
                exercises: state.exercises.map((ex, i) =>
                    i === action.payload.index ? { ...ex, name: action.payload.name } : ex
                ),
            };

        case 'REMOVE_EXERCISE':
            return { ...state, exercises: state.exercises.filter((_, i) => i !== action.payload.index) };

        case 'ADD_SET':
            return {
                ...state,
                exercises: state.exercises.map((ex, i) =>
                    i === action.payload.exerciseIndex
                        ? { ...ex, sets: [...ex.sets, { reps: 0, weight: 0, notes: '' }] }
                        : ex
                ),
            };

        case 'UPDATE_SET':
            return {
                ...state,
                exercises: state.exercises.map((ex, i) =>
                    i === action.payload.exerciseIndex
                        ? {
                            ...ex,
                            sets: ex.sets.map((set, si) =>
                                si === action.payload.setIndex
                                    ? { ...set, [action.payload.field]: action.payload.value }
                                    : set
                            ),
                        }
                        : ex
                ),
            };

        case 'REMOVE_SET':
            return {
                ...state,
                exercises: state.exercises.map((ex, i) =>
                    i === action.payload.exerciseIndex
                        ? { ...ex, sets: ex.sets.filter((_, si) => si !== action.payload.setIndex) }
                        : ex
                ),
            };

        case 'ADD_PHASE':
            return {
                ...state,
                phases: [
                    ...state.phases,
                    {
                        id: `phase-${Date.now()}`,
                        title: '',
                        description: '',
                        duration: '',
                        tasks: [],
                        order: state.phases.length,
                        startDate: todayKey(),
                        endDate: todayKey(),
                        attachments: [],
                        status: 'pending',
                        dependencies: [],
                        estimatedHours: 0,
                    },
                ],
            };

        case 'UPDATE_PHASE':
            return {
                ...state,
                phases: state.phases.map((phase, i) =>
                    i === action.payload.index
                        ? { ...phase, [action.payload.field]: action.payload.value }
                        : phase
                ),
            };

        case 'REMOVE_PHASE':
            return { ...state, phases: state.phases.filter((_, i) => i !== action.payload.index) };

        case 'APPLY_TEMPLATE': {
            const { title, content, exercises, icon } = action.payload.content;
            return {
                ...state,
                title: title ? title.replace('{DATE}', new Date().toLocaleDateString('he-IL')) : '',
                content: content || '',
                exercises: exercises ? JSON.parse(JSON.stringify(exercises)) : state.exercises,
                icon: icon || '',
            };
        }

        case 'SET_METADATA_RESULT':
            return {
                ...state,
                title: action.payload.title || '',
                content: action.payload.content || '',
                isFetchingMetadata: false,
            };

        case 'SET_GENERATED_PHASES':
            return {
                ...state,
                phases: action.payload.map((p, i) => ({
                    ...p,
                    id: `phase-${Date.now()}-${i}`,
                    order: i,
                    notes: '',
                })),
                isGeneratingRoadmap: false,
            };

        case 'RESET_FORM':
            return createInitialState();

        case 'SUBMIT_START':
            return { ...state, submissionStatus: 'submitting' };

        case 'SUBMIT_DONE':
            return { ...createInitialState(), submissionStatus: 'idle' };

        default:
            return state;
    }
};
