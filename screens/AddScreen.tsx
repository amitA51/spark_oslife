import React, { useState, useEffect, useContext, useRef, lazy, Suspense } from 'react';
import type { Screen } from '../types';
import {
    CheckCircleIcon, LinkIcon, ClipboardListIcon, BookOpenIcon,
    DumbbellIcon, TargetIcon, ChartBarIcon, SparklesIcon,
    SummarizeIcon, UserIcon, LightbulbIcon, RoadmapIcon, EditIcon, CloseIcon,
    MicrophoneIcon
} from '../components/icons';
// FIX: Changed import to a named import to resolve a module resolution issue caused by a circular dependency.
import { ItemCreationForm } from '../components/ItemCreationForm';
import { PersonalItemType, AddableType } from '../types';
import { AppContext } from '../state/AppContext';
import { saveSettings } from '../services/settingsService';
import { useHaptics } from '../hooks/useHaptics';

const VoiceInputModal = lazy(() => import('../components/VoiceInputModal'));

interface AddScreenProps {
    setActiveScreen: (screen: Screen) => void;
}

const allItemTypes: { type: AddableType; label: string; icon: React.ReactNode; color: string; }[] = [
    { type: 'spark', label: 'ספארק', icon: <SparklesIcon />, color: 'var(--accent-start)' },
    { type: 'idea', label: 'רעיון', icon: <LightbulbIcon />, color: 'var(--warning)' },
    { type: 'note', label: 'פתק', icon: <ClipboardListIcon />, color: '#FBBF24' },
    { type: 'task', label: 'משימה', icon: <CheckCircleIcon />, color: 'var(--success)' },
    { type: 'link', label: 'קישור', icon: <LinkIcon />, color: '#60A5FA' },
    { type: 'learning', label: 'למידה', icon: <SummarizeIcon />, color: '#38BDF8' },
    { type: 'journal', label: 'יומן', icon: <UserIcon />, color: '#F0ABFC' },
    { type: 'book', label: 'ספר', icon: <BookOpenIcon />, color: '#A78BFA' },
    { type: 'goal', label: 'פרויקט', icon: <TargetIcon />, color: '#2DD4BF' },
    { type: 'workout', label: 'אימון', icon: <DumbbellIcon />, color: '#F472B6' },
    { type: 'roadmap', label: 'מפת דרכים', icon: <RoadmapIcon />, color: '#3B82F6' },
    { type: 'ticker', label: 'מניה / מטבע', icon: <ChartBarIcon />, color: 'var(--text-secondary)' },
];

const AddItemButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    color: string;
    style?: React.CSSProperties;
    isEditing?: boolean;
}> = ({ icon, label, onClick, color, style, isEditing }) => (
    <button
        onClick={onClick}
        className={`themed-card p-4 flex flex-col items-center justify-center text-center gap-3 aspect-square transition-all duration-300 ${isEditing ? 'cursor-grab active:cursor-grabbing opacity-75' : 'hover:scale-105 hover:shadow-xl active:scale-95'} animate-item-enter-fi`}
        aria-label={`הוסף ${label}`}
        style={style}
        disabled={isEditing}
    >
        <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ backgroundColor: color + '20', color: color }}
        >
            {React.isValidElement<{ className?: string }>(icon)
                ? React.cloneElement(icon, { ...icon.props, className: 'w-7 h-7' })
                : icon
            }
        </div>
        <span className="font-semibold text-white text-xs leading-tight">{label}</span>
    </button>
);


const AddScreen: React.FC<AddScreenProps> = ({ setActiveScreen }) => {
    const { state, dispatch } = useContext(AppContext);
    const { settings } = state;
    const { triggerHaptic } = useHaptics();

    const [addScreenLayout, setAddScreenLayout] = useState(settings.addScreenLayout);
    const [selectedType, setSelectedType] = useState<AddableType | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

    const dragItem = useRef<AddableType | null>(null);
    const dragOverItem = useRef<AddableType | null>(null);
    const [forceRender, setForceRender] = useState(0);

    useEffect(() => {
        setAddScreenLayout(settings.addScreenLayout);
    }, [settings.addScreenLayout]);

    useEffect(() => {
        const preselect = sessionStorage.getItem('preselect_add');
        if (preselect && allItemTypes.some(it => it.type === preselect)) {
            setSelectedType(preselect as AddableType);
            sessionStorage.removeItem('preselect_add');
        }

        const sharedData = sessionStorage.getItem('sharedData');
        if (sharedData) {
            const { url } = JSON.parse(sharedData);
            if (url) {
                setSelectedType('link');
            } else {
                setSelectedType('note');
            }
        }

    }, []);

    const handleLayoutChange = (newLayout: AddableType[]) => {
        setAddScreenLayout(newLayout);
        const newSettings = { ...settings, addScreenLayout: newLayout };
        dispatch({ type: 'SET_SETTINGS', payload: newSettings });
        saveSettings(newSettings);
    };

    const handleDrop = () => {
        if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
            const currentLayout = [...addScreenLayout];
            const dragItemIndex = currentLayout.indexOf(dragItem.current);
            const dragOverItemIndex = currentLayout.indexOf(dragOverItem.current);

            const [removed] = currentLayout.splice(dragItemIndex, 1);
            currentLayout.splice(dragOverItemIndex, 0, removed);

            handleLayoutChange(currentLayout);
        }
        dragItem.current = null;
        dragOverItem.current = null;
        setForceRender(c => c + 1);
    };

    const handleHideItem = (typeToHide: AddableType) => {
        triggerHaptic('medium');
        const newLayout = addScreenLayout.filter(type => type !== typeToHide);
        handleLayoutChange(newLayout);
    };

    const handleItemClick = (type: AddableType) => {
        triggerHaptic('light');
        setSelectedType(type);
    }

    const handleCloseForm = () => {
        setSelectedType(null);
    };

    return (
        <div className="pt-4 pb-8">
            {/* Header with Voice & Edit buttons */}
            <header className="mb-8 relative px-4">
                <div className="flex items-center justify-between mb-4">
                    {/* Edit Button (Left) */}
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-all"
                        aria-label={isEditing ? 'סיים עריכה' : 'ערוך פריסה'}
                    >
                        {isEditing ? <CloseIcon className="w-6 h-6" /> : <EditIcon className="w-6 h-6" />}
                    </button>

                    {/* Voice Button (Right) with Pulse Animation */}
                    {!selectedType && !isEditing && (
                        <button
                            onClick={() => setIsVoiceModalOpen(true)}
                            className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all active:scale-95 group"
                            aria-label="הוסף באמצעות קול"
                        >
                            <MicrophoneIcon className="w-6 h-6 relative z-10" />
                            {/* Pulse Ring */}
                            <span className="absolute inset-0 rounded-2xl bg-purple-500 opacity-75 animate-ping" />
                        </button>
                    )}
                </div>

                {/* Title */}
                <div className="text-center">
                    <h1 className="hero-title themed-title">מה להוסיף?</h1>
                    <p className="text-[var(--dynamic-accent-highlight)] opacity-90 mt-1 themed-glow-text text-sm">בחר סוג פריט כדי להתחיל.</p>
                </div>
            </header>

            {/* Icons Grid - Cleaner & More Organized */}
            <div className={`transition-all duration-500 var(--fi-cubic-bezier) ${selectedType ? 'receding-background' : ''} px-4`}>
                <div
                    className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4"
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                >
                    {addScreenLayout.map((type, index) => {
                        const item = allItemTypes.find(it => it.type === type);
                        if (!item) return null;
                        return (
                            <div
                                key={item.type}
                                draggable={isEditing}
                                onDragStart={() => dragItem.current = item.type}
                                onDragEnter={() => dragOverItem.current = item.type}
                                onDragEnd={handleDrop}
                                className={`relative transition-transform duration-300 ${dragItem.current === item.type ? 'dragging-item' : ''}`}
                            >
                                {isEditing && (
                                    <button
                                        onClick={() => handleHideItem(item.type)}
                                        className="absolute -top-2 -right-2 z-10 bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-transform hover:scale-110 active:scale-90"
                                        aria-label={`הסתר ${item.label}`}
                                    >
                                        <CloseIcon className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <AddItemButton
                                    label={item.label}
                                    icon={item.icon}
                                    color={item.color}
                                    onClick={() => handleItemClick(item.type)}
                                    style={{ animationDelay: `${index * 25}ms` }}
                                    isEditing={isEditing}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {isEditing && (
                <div className="mt-8 text-center animate-item-enter-fi px-4">
                    <button
                        onClick={() => {
                            sessionStorage.setItem('settings_deep_link', 'add-layout');
                            setActiveScreen('settings');
                        }}
                        className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-start)] text-white font-bold py-3 px-6 rounded-xl transition-colors"
                    >
                        ניהול פריטים מוסתרים בהגדרות
                    </button>
                </div>
            )}

            {selectedType && (
                <ItemCreationForm
                    key={selectedType}
                    itemType={selectedType}
                    onClose={handleCloseForm}
                    setActiveScreen={setActiveScreen}
                />
            )}

            <Suspense fallback={null}>
                {isVoiceModalOpen && (
                    <VoiceInputModal
                        isOpen={isVoiceModalOpen}
                        onClose={() => setIsVoiceModalOpen(false)}
                        setActiveScreen={setActiveScreen}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default AddScreen;