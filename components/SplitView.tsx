import React, { useState, useRef, useEffect, useContext, Suspense, lazy, useCallback } from 'react';
import { AppContext } from '../state/AppContext';
import { CloseIcon } from './icons';
import type { SplitScreenComponentId } from '../types';

const AppLoading: React.FC = () => (
    <div className="h-full flex items-center justify-center">
        <svg width="64" height="64" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="spinner-gradient-split" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--dynamic-accent-start)" />
                    <stop offset="100%" stopColor="var(--dynamic-accent-end)" />
                </linearGradient>
            </defs>
            <g>
                <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25" fill="currentColor"/>
                <path d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z" fill="url(#spinner-gradient-split)">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.75s" repeatCount="indefinite"/>
                </path>
            </g>
        </svg>
    </div>
);

// Lazy load screens to avoid circular dependencies and improve performance
const Dashboard = lazy(() => import('./Dashboard'));
const FeedScreen = lazy(() => import('../screens/FeedScreen'));
const AssistantScreen = lazy(() => import('../screens/AssistantScreen'));

const DashboardPanel: React.FC = () => {
    const { state } = useContext(AppContext);
    const { personalItems } = state;
    return (
        <Dashboard
            tasks={personalItems.filter(i => i.type === 'task')}
            habits={personalItems.filter(i => i.type === 'habit')}
            personalItems={personalItems}
            forecast={null} 
            isLoadingForecast={true} // Simplified for now
        />
    );
}

const Panel: React.FC<{
    componentId: SplitScreenComponentId;
    onClose: () => void;
}> = ({ componentId, onClose }) => {
    const renderContent = () => {
        switch (componentId) {
            case 'dashboard':
                return <DashboardPanel />;
            case 'feed':
                return <FeedScreen setActiveScreen={() => {}} />;
            case 'assistant':
                return <AssistantScreen setActiveScreen={() => {}} />;
            default:
                return <div>רכיב לא ידוע</div>;
        }
    };
    
    return (
        <div className="relative h-full w-full flex flex-col bg-black/20 overflow-hidden rounded-2xl border border-[var(--border-primary)]">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/30 text-gray-300 hover:bg-red-500/50 hover:text-white transition-all"
                aria-label="Close panel"
            >
                <CloseIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-y-auto">
                 <Suspense fallback={<AppLoading />}>
                    {renderContent()}
                </Suspense>
            </div>
        </div>
    );
};

const SplitView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { left, right } = state.splitViewConfig;
    const [leftPanelWidth, setLeftPanelWidth] = useState(50);
    const isDragging = useRef(false);

    const handleExit = () => {
        dispatch({ type: 'SET_SPLIT_VIEW_CONFIG', payload: { isActive: false } });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        e.preventDefault();
    };
    
    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || window.innerWidth < 768) return;
        const newLeftWidth = (e.clientX / window.innerWidth) * 100;
        if (newLeftWidth > 20 && newLeftWidth < 80) {
            setLeftPanelWidth(newLeftWidth);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return (
        <div className="fixed inset-0 bg-[var(--bg-primary)] flex flex-col md:flex-row p-2 gap-2 animate-screen-enter" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="h-1/2 md:h-full flex-shrink-0" style={{ width: window.innerWidth >= 768 ? `${leftPanelWidth}%` : '100%' }}>
                 <Panel componentId={left} onClose={handleExit} />
            </div>
            <div 
                onMouseDown={handleMouseDown}
                className="w-full h-2 md:w-2 md:h-full cursor-row-resize md:cursor-col-resize bg-transparent hover:bg-[var(--accent-start)] transition-colors duration-300 rounded-full flex-shrink-0"
            />
            <div className="flex-1 h-1/2 md:h-full w-full">
                <Panel componentId={right} onClose={handleExit} />
            </div>
        </div>
    );
};

export default SplitView;
