import React from 'react';
import { AddIcon } from './icons';

interface CenterButtonProps {
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

const CenterButton: React.FC<CenterButtonProps> = ({ onClick, onContextMenu }) => (
    <div className="absolute left-1/2 -top-6 -translate-x-1/2 z-20">
        <button
            onClick={onClick}
            onContextMenu={onContextMenu}
            className="w-16 h-16 rounded-[22px] flex items-center justify-center bg-[var(--accent-gradient)] text-white shadow-[0_8px_30px_var(--dynamic-accent-glow)] transition-all duration-300 ease-[var(--fi-cubic-bezier)] transform hover:scale-110 hover:-translate-y-1 active:scale-95 ring-4 ring-[var(--bg-primary)] animate-float"
            aria-label="הוספה"
        >
            <AddIcon className="w-8 h-8 drop-shadow-md" />
        </button>
    </div>
);

export default CenterButton;
