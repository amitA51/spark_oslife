
import React, { useEffect, useRef, useContext } from 'react';
import { AppContext } from '../state/AppContext';

interface Particle {
    x: number;
    y: number;
    size: number;
    baseX: number;
    baseY: number;
    density: number;
    color: string;
    velocity: { x: number; y: number };
    alpha: number;
    targetAlpha: number;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const DynamicBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { state } = useContext(AppContext);
    const accentColor = state.settings.themeSettings.accentColor;
    
    // Mouse position tracking
    const mouseRef = useRef({ x: 0, y: 0, radius: 150 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };
        
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouseRef.current.x = e.touches[0].clientX;
                mouseRef.current.y = e.touches[0].clientY;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const rgbColor = hexToRgb(accentColor);
        if (!rgbColor) return;

        let particles: Particle[] = [];
        let animationFrameId: number;

        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];

            // Adjust particle count based on screen size
            const numberOfParticles = window.innerWidth < 768 ? 60 : 130; 

            for (let i = 0; i < numberOfParticles; i++) {
                const size = Math.random() * 2 + 0.5;
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                
                // Random velocity for natural drift
                const vx = (Math.random() - 0.5) * 0.3;
                const vy = (Math.random() - 0.5) * 0.3;

                particles.push({
                    x, y, 
                    baseX: x, baseY: y,
                    size,
                    density: (Math.random() * 30) + 1,
                    // Mix of theme color and white
                    color: Math.random() > 0.6 
                        ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b},` 
                        : `rgba(255, 255, 255,`,
                    velocity: { x: vx, y: vy },
                    alpha: Math.random() * 0.5, 
                    targetAlpha: Math.random() * 0.5 + 0.1
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update and draw particles
            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];

                // Mouse Interaction (Repulsion)
                const dx = mouseRef.current.x - p.x;
                const dy = mouseRef.current.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouseRef.current.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouseRef.current.radius - distance) / mouseRef.current.radius;
                    const directionX = forceDirectionX * force * p.density;
                    const directionY = forceDirectionY * force * p.density;
                    
                    p.x -= directionX;
                    p.y -= directionY;
                    
                    // Glow when near interaction
                    p.alpha = Math.min(p.alpha + 0.05, 1); 
                } else {
                    // Return to base drift
                    if (p.x !== p.baseX) {
                        const dx = p.x - p.baseX;
                        p.x -= dx / 50; 
                    }
                    if (p.y !== p.baseY) {
                        const dy = p.y - p.baseY;
                        p.y -= dy / 50;
                    }
                    
                    // Twinkle effect
                    if (Math.random() > 0.98) {
                         p.targetAlpha = Math.random() * 0.6 + 0.1;
                    }
                    p.alpha += (p.targetAlpha - p.alpha) * 0.05;
                }

                // Base movement
                p.baseX += p.velocity.x;
                p.baseY += p.velocity.y;

                // Wrap around screen
                if (p.baseX > canvas.width) { p.baseX = 0; p.x = 0; }
                else if (p.baseX < 0) { p.baseX = canvas.width; p.x = canvas.width; }
                if (p.baseY > canvas.height) { p.baseY = 0; p.y = 0; }
                else if (p.baseY < 0) { p.baseY = canvas.height; p.y = canvas.height; }

                // Draw Particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `${p.color} ${p.alpha})`;
                ctx.fill();
                
                // Draw connections (Constellations)
                for (let j = i; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                    // Draw line if close enough
                    if (dist < 100) {
                        ctx.beginPath();
                        // Line opacity based on distance
                        ctx.strokeStyle = `${p.color} ${0.15 - (dist/1000)})`; 
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        window.addEventListener('resize', init);
        animate();

        return () => {
            window.removeEventListener('resize', init);
            cancelAnimationFrame(animationFrameId);
        };
    }, [accentColor]);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(20,20,30,0.3) 0%, rgba(0,0,0,0) 100%)' }} 
        />
    );
};

export default React.memo(DynamicBackground);
