import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, CheckCircleIcon, XIcon } from '../icons';
import { createPortal } from 'react-dom';

interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
    {
        targetId: 'welcome-step', // Virtual step
        title: 'ברוכים הבאים ל-Spark OS! ✨',
        description: 'הפלטפורמה שלך לניהול חיים, מטרות והרגלים. בוא נעשה סיבוב קצר.',
        position: 'center',
    },
    {
        targetId: 'nav-feed',
        title: 'הפיד היומי שלך',
        description: 'כאן תראה את המשימות להיום, תזכורות ועדכונים חשובים.',
        position: 'top',
    },
    {
        targetId: 'nav-library',
        title: 'הספרייה שלך',
        description: 'המרכז לכל המידע שלך: פרויקטים, משאבים, הערות ועוד.',
        position: 'top',
    },
    {
        targetId: 'smart-capture-fab',
        title: 'הוספה מהירה',
        description: 'לחץ כאן כדי להוסיף משימה, רעיון או כל דבר אחר במהירות.',
        position: 'top',
    },
    {
        targetId: 'nav-settings',
        title: 'הגדרות והתאמה',
        description: 'התאם את האפליקציה בדיוק לצרכים שלך.',
        position: 'top',
    },
];

const OnboardingTour: React.FC = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isVisible, setIsVisible] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        // Check if user has seen tour
        const hasSeenTour = localStorage.getItem('spark_onboarding_completed');
        if (!hasSeenTour) {
            // Wait a bit for app to load
            const timer = setTimeout(() => {
                setIsVisible(true);
                setCurrentStepIndex(0);
            }, 1500);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, []);

    useEffect(() => {
        if (currentStepIndex >= 0 && currentStepIndex < TOUR_STEPS.length) {
            const step = TOUR_STEPS[currentStepIndex];
            if (!step) return;

            if (step.position === 'center') {
                setTargetRect(null);
                return;
            }

            // Find target element
            const el = document.getElementById(step.targetId);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
                // Scroll into view if needed
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // If element not found, skip step automatically
                console.warn(`Tour target ${step.targetId} not found, skipping.`);
                handleNext();
            }
        }
    }, [currentStepIndex]);

    const handleNext = () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('spark_onboarding_completed', 'true');
        // Confetti or celebration could go here
    };

    const handleSkip = () => {
        setIsVisible(false);
        localStorage.setItem('spark_onboarding_completed', 'true');
    };

    if (!isVisible || currentStepIndex < 0 || currentStepIndex >= TOUR_STEPS.length) return null;

    const currentStep = TOUR_STEPS[currentStepIndex];

    return createPortal(
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Backdrop / Spotlight Effect */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 pointer-events-auto transition-all duration-500"
                style={{
                    maskImage: targetRect
                        ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.5}px, black ${Math.max(targetRect.width, targetRect.height) / 1.5 + 20}px)`
                        : 'none',
                    WebkitMaskImage: targetRect
                        ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.5}px, black ${Math.max(targetRect.width, targetRect.height) / 1.5 + 20}px)`
                        : 'none'
                } as any}
            />

            {/* Tooltip Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStepIndex}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        // Postion logic
                        left: currentStep?.position === 'center' ? '50%' :
                            currentStep?.position === 'left' ? targetRect ? targetRect.left : '0%' :
                                targetRect ? targetRect.right : '100%',
                        top: currentStep?.position === 'center' ? '50%' :
                            currentStep?.position === 'top' && targetRect ? targetRect.top - 20 :
                                currentStep?.position === 'bottom' && targetRect ? targetRect.bottom + 20 : '50%',
                        x: currentStep?.position === 'center' ? '-50%' :
                            currentStep?.position === 'left' ? '-100%' : '0%',
                        y: currentStep?.position === 'center' ? '-50%' :
                            currentStep?.position === 'top' ? '-100%' : '0%'
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute pointer-events-auto w-[320px] bg-[var(--bg-secondary)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                >
                    {/* Gradient Border */}
                    <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-[var(--dynamic-accent-start)] to-transparent opacity-50 pointer-events-none" />

                    <div className="relative p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-[var(--dynamic-accent-start)]/20 rounded-xl text-[var(--dynamic-accent-start)]">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <button onClick={handleSkip} className="text-[var(--text-tertiary)] hover:text-white transition-colors">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{currentStep?.title}</h3>
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                            {currentStep?.description}
                        </p>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                                {TOUR_STEPS.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStepIndex
                                            ? 'w-6 bg-[var(--dynamic-accent-start)]'
                                            : 'w-1.5 bg-white/10'
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="px-5 py-2 bg-[var(--dynamic-accent-start)] hover:bg-[var(--dynamic-accent-end)] text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-[var(--dynamic-accent-glow)]/30 flex items-center gap-2"
                            >
                                {currentStepIndex === TOUR_STEPS.length - 1 ? 'התחל' : 'הבא'}
                                {currentStepIndex === TOUR_STEPS.length - 1 && <CheckCircleIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>,
        document.body
    );
};

export default OnboardingTour;
