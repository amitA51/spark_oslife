import React, { useRef, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon } from '../icons';

interface SettingsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Premium iOS-style Bottom Sheet with bulletproof scrolling
 * Uses flexbox layout for proper scroll behavior on mobile
 * Optimized for Android touch handling
 */
const SettingsSheet: React.FC<SettingsSheetProps> = ({
    isOpen,
    onClose,
    title,
    icon,
    children,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const savedScrollY = useRef(0);
    const scrollAtTop = useRef(true);

    // Reset scroll on open
    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = 0;
            scrollAtTop.current = true;
        }
    }, [isOpen]);

    // Track scroll position to allow drag-to-close only when at top
    const handleScroll = useCallback(() => {
        if (scrollRef.current) {
            scrollAtTop.current = scrollRef.current.scrollTop <= 0;
        }
    }, []);

    // Lock body scroll
    useEffect(() => {
        if (!isOpen) return;

        savedScrollY.current = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${savedScrollY.current}px`;
        navigator.vibrate?.(10);

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            window.scrollTo(0, savedScrollY.current);
        };
    }, [isOpen]);

    // Drag to close - only from handle
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (!touch) return;
        setIsDragging(true);
        dragStartY.current = touch.clientY;
        setDragY(0);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        if (!touch) return;
        const delta = touch.clientY - dragStartY.current;
        if (delta > 0) {
            setDragY(delta);
            e.preventDefault();
        }
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        if (dragY > 100) {
            onClose();
            navigator.vibrate?.(15);
        }
        setDragY(0);
        setIsDragging(false);
    }, [dragY, onClose]);

    // Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const sheetContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black"
                    />

                    {/* Sheet Container - flexbox layout for proper content sizing */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: dragY }}
                        exit={{ y: '100%' }}
                        transition={isDragging ? { duration: 0 } : {
                            type: 'spring',
                            damping: 30,
                            stiffness: 300,
                        }}
                        className="absolute left-0 right-0 bottom-0 flex flex-col
                                   bg-[var(--bg-primary)]
                                   rounded-t-3xl
                                   shadow-[0_-10px_50px_rgba(0,0,0,0.6)]
                                   border-t border-white/10"
                        style={{
                            top: '20px', // Almost full screen - just 20px at top
                            maxHeight: 'calc(100vh - 20px)',
                            height: 'calc(100vh - 20px)',
                        }}
                    >
                        {/* Drag Handle - touchAction: none to prevent scroll interference */}
                        <div
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            className="flex-shrink-0 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing"
                            style={{ touchAction: 'none' }}
                        >
                            <div className="w-12 h-1.5 rounded-full bg-white/40" />
                        </div>

                        {/* Header - flex-shrink-0 to maintain size */}
                        <div className="flex-shrink-0 h-14 px-5 flex items-center justify-between border-b border-white/10">
                            <button
                                onClick={onClose}
                                className="p-2 -ml-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                            >
                                <ChevronRightIcon className="w-6 h-6 text-[var(--dynamic-accent-start)]" />
                            </button>
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-white">{title}</h2>
                                {icon && (
                                    <div className="p-2 rounded-xl bg-[var(--dynamic-accent-start)]/15 border border-[var(--dynamic-accent-start)]/30">
                                        {icon}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scrollable Content - flex-1 to fill remaining space */}
                        <div
                            ref={scrollRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                touchAction: 'pan-y',
                                minHeight: 0, // Important for flexbox scroll containers
                            }}
                        >
                            <div className="p-5 pb-safe-bottom" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    // Use portal to render outside of any overflow:hidden containers
    if (typeof document !== 'undefined') {
        return createPortal(sheetContent, document.body);
    }

    return sheetContent;
};

export default SettingsSheet;
