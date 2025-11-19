import React, { useState, useContext } from 'react';
import { AppContext } from '../state/AppContext';
import { useModal } from '../state/ModalContext';
import { CloseIcon, LayoutDashboardIcon, FeedIcon, BrainCircuitIcon } from './icons';
import type { SplitScreenComponentId } from '../types';

const OPTIONS: { id: SplitScreenComponentId, label: string, icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'דשבורד', icon: <LayoutDashboardIcon className="w-6 h-6"/> },
    { id: 'feed', label: 'פיד', icon: <FeedIcon className="w-6 h-6"/> },
    { id: 'assistant', label: 'יועץ AI', icon: <BrainCircuitIcon className="w-6 h-6"/> },
];

const SplitViewConfigurationModal: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { closeModal } = useModal();
    const [left, setLeft] = useState<SplitScreenComponentId>(state.splitViewConfig.left);
    const [right, setRight] = useState<SplitScreenComponentId>(state.splitViewConfig.right);
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => closeModal('splitViewConfig'), 300);
    };

    const handleStart = () => {
        dispatch({ type: 'SET_SPLIT_VIEW_CONFIG', payload: { isActive: true, left, right }});
        handleClose();
    };

    const Selector: React.FC<{
        title: string;
        options: typeof OPTIONS;
        selectedValue: SplitScreenComponentId;
        onSelect: (value: SplitScreenComponentId) => void;
    }> = ({ title, options, selectedValue, onSelect }) => (
        <div className="space-y-3">
            <h3 className="font-bold text-lg text-white">{title}</h3>
            <div className="grid grid-cols-3 gap-3">
                {options.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => onSelect(opt.id)}
                        className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${selectedValue === opt.id ? 'bg-[var(--accent-start)]/20 border-[var(--accent-start)]' : 'bg-[var(--bg-secondary)] border-transparent hover:border-white/50'}`}
                    >
                        <div className={`transition-colors ${selectedValue === opt.id ? 'text-[var(--accent-start)]' : 'text-gray-400'}`}>{opt.icon}</div>
                        <span className={`text-sm font-medium ${selectedValue === opt.id ? 'text-white' : 'text-gray-300'}`}>{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50" onClick={handleClose}>
            <div
                onClick={e => e.stopPropagation()}
                className={`bg-[var(--bg-card)] w-full max-w-2xl max-h-[90vh] responsive-modal rounded-t-3xl shadow-lg flex flex-col border-t border-[var(--border-primary)] ${isClosing ? 'animate-modal-exit' : 'animate-modal-enter'}`}
            >
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                    <h2 className="text-xl font-bold">הגדרת מסך מפוצל</h2>
                    <button onClick={handleClose}><CloseIcon className="w-6 h-6"/></button>
                </header>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <Selector title="חלונית ימין" options={OPTIONS} selectedValue={left} onSelect={setLeft} />
                    <Selector title="חלונית שמאל" options={OPTIONS} selectedValue={right} onSelect={setRight} />
                </div>
                <footer className="p-4 border-t border-[var(--border-primary)]">
                    <button 
                        onClick={handleStart} 
                        className="w-full bg-[var(--accent-gradient)] hover:brightness-110 text-white font-bold py-3 px-4 rounded-xl transition-all transform active:scale-95"
                        disabled={left === right}
                    >
                        התחל
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SplitViewConfigurationModal;
