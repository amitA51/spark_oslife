/**
 * FloatingParticles - Animated background particles for auth screens
 * Extracted from LoginScreen for reuse in SignupScreen
 */
import React from 'react';
import { motion } from 'framer-motion';

interface Particle {
    id: number;
    size: number;
    x: number;
    y: number;
    duration: number;
    delay: number;
}

const FloatingParticles: React.FC = () => {
    // Generate particles once (memoized by React since array is static)
    const particles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full"
                    style={{
                        width: particle.size,
                        height: particle.size,
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        background: `radial-gradient(circle, var(--dynamic-accent-start), transparent)`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, 10, -10, 0],
                        opacity: [0.3, 0.7, 0.3],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
};

export default FloatingParticles;
