
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DragHandleIcon } from './icons';

interface DraggableModalWrapperProps {
    children: React.ReactNode;
    onClose: () => void;
    className?: string;
    initialX?: number;
    initialY?: number;
}

const DraggableModalWrapper: React.FC<DraggableModalWrapperProps> = ({ 
    children, 
    onClose, 
    className = "", 
    initialX, 
    initialY 
}) => {
    // Center initially if no coordinates provided
    const [position, setPosition] = useState({ 
        x: initialX ?? (window.innerWidth / 2), 
        y: initialY ?? (window.innerHeight / 2) 
    });
    
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const modalRef = useRef<HTMLDivElement>(null);
    const hasCentered = useRef(false);

    // Improved centering logic
    useEffect(() => {
        if (!hasCentered.current && modalRef.current) {
            const rect = modalRef.current.getBoundingClientRect();
            // If specific coordinates weren't provided, center it.
            if (initialX === undefined && initialY === undefined) {
                 setPosition({
                    x: (window.innerWidth - rect.width) / 2,
                    y: (window.innerHeight - rect.height) / 2
                });
            }
            hasCentered.current = true;
        }
    }, [initialX, initialY]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        // Allow interaction with form elements inside
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
            return;
        }

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setIsDragging(true);
        setDragOffset({
            x: clientX - position.x,
            y: clientY - position.y
        });
    };

    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (isDragging) {
            e.preventDefault(); // Prevent scrolling on mobile while dragging
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

            setPosition({
                x: clientX - dragOffset.x,
                y: clientY - dragOffset.y
            });
        }
    }, [isDragging, dragOffset]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove, { passive: false });
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, handleMouseMove]);

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center" aria-modal="true" role="dialog">
            {/* Backdrop - clickable to close */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300" 
                onClick={onClose}
            />

            <div
                ref={modalRef}
                style={{ 
                    // On mobile (implicitly via class logic in parent), we might want to ignore transform or reset it, 
                    // but for now we trust the centering logic.
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    touchAction: 'none', // Important for touch devices
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}
                className={`pointer-events-auto shadow-2xl ${className} ${isDragging ? 'cursor-grabbing scale-[1.02] opacity-90' : ''} transition-transform duration-75`}
            >
                {/* Drag Handle Bar */}
                <div 
                    className={`w-full h-8 bg-gradient-to-b from-white/10 to-transparent rounded-t-2xl cursor-grab flex items-center justify-center absolute top-0 left-0 right-0 z-50 ${isDragging ? 'cursor-grabbing' : ''}`}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                >
                    <div className="w-12 h-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors" />
                </div>
                
                {/* Content Content */}
                <div className="h-full flex flex-col pt-4 relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DraggableModalWrapper;
