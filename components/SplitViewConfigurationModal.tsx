import React from 'react';
import { useModal } from '../state/ModalContext';
import { CloseIcon, SplitScreenIcon } from './icons';

const SplitViewConfigurationModal: React.FC = () => {
    const { closeModal } = useModal();

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => closeModal('splitViewConfig')}
        >
            <div
                className="bg-[#1e1e1e] w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <SplitScreenIcon className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
                        הגדרות מסך מפוצל
                    </h2>
                    <button
                        onClick={() => closeModal('splitViewConfig')}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                    >
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </header>

                <div className="p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2">
                        <SplitScreenIcon className="w-8 h-8 text-[var(--dynamic-accent-start)] opacity-50" />
                    </div>
                    <h3 className="text-xl font-medium text-white">בקרוב</h3>
                    <p className="text-sm text-gray-400">
                        אפשרויות תצוגה מפוצלת מתקדמות יהיו זמינות בעדכון הבא. תוכלו להתאים אישית את סביבת העבודה שלכם ולעבוד על מספר דברים במקביל.
                    </p>

                    <button
                        onClick={() => closeModal('splitViewConfig')}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                    >
                        אישור
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SplitViewConfigurationModal;
