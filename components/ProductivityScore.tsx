import React, { useState, useEffect } from 'react';
import { SparklesIcon } from './icons';

interface ProductivityScoreProps {
    score: number;
    text: string;
    isLoading: boolean;
}

const ProductivityScore: React.FC<ProductivityScoreProps> = ({ score, text, isLoading }) => {
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        if (isLoading) {
            setDisplayScore(0);
            return;
        }
        
        let start = 0;
        const end = score;
        if (start === end) return;

        const duration = 1000;
        const increment = end / (duration / 15);
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                start = end;
                clearInterval(timer);
            }
            setDisplayScore(Math.round(start));
        }, 15);

        return () => clearInterval(timer);
    }, [score, isLoading]);

    const size = 120;
    const strokeWidth = 10;
    const radius = (size / 2) - (strokeWidth * 2);
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (displayScore / 100) * circumference;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
                <SparklesIcon className="w-8 h-8 text-[var(--dynamic-accent-start)] animate-pulse"/>
                <p className="text-sm text-[var(--text-secondary)]">AI מנתח את היום שלך...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
            <div className="relative" style={{ width: size, height: size }}>
                 <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
                    <circle stroke="var(--border-primary)" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size/2} cy={size/2} />
                    <circle
                        stroke="url(#progress-gradient)" fill="transparent" strokeWidth={strokeWidth}
                        strokeLinecap="round" r={radius} cx={size/2} cy={size/2}
                        style={{
                            strokeDasharray: circumference, strokeDashoffset: offset,
                            transform: 'rotate(-90deg)', transformOrigin: '50% 50%',
                            transition: 'stroke-dashoffset 0.3s ease-out'
                        }}
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                    {displayScore}
                </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-xs">{text}</p>
        </div>
    );
};

export default ProductivityScore;
