// ProgressBar - Top progress indicator for workout completion
import { memo } from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number; // 0-100
}

const ProgressBar = memo<ProgressBarProps>(({ progress }) => {
    return (
        <motion.div
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[var(--cosmos-accent-cyan)] to-[var(--cosmos-accent-primary)] shadow-[0_0_10px_var(--cosmos-accent-cyan)] z-[100]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        />
    );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
