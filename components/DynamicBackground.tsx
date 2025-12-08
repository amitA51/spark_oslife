import React, { useEffect, useRef } from 'react';
import { useSettings as useSettingsContext } from '../src/contexts/SettingsContext';

// הוצאת המחלקה החוצה - אין סיבה להגדיר אותה מחדש בכל רינדור
class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  canvasWidth: number;
  canvasHeight: number;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.random() * 2 + 0.5; // גודל בסיסי
    this.speedX = Math.random() * 0.5 - 0.25;
    this.speedY = Math.random() * 0.5 - 0.25;
    this.opacity = Math.random() * 0.5 + 0.1;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x > this.canvasWidth) this.x = 0;
    else if (this.x < 0) this.x = this.canvasWidth;
    if (this.y > this.canvasHeight) this.y = 0;
    else if (this.y < 0) this.y = this.canvasHeight;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

const DynamicBackground: React.FC = () => {
  const { settings } = useSettingsContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // אופטימיזציה: בדיקה מוקדמת כדי למנוע רינדור DOM מיותר אם האפקט כבוי
  const isEffectActive = settings.themeSettings.backgroundEffect === 'particles';

  useEffect(() => {
    if (!isEffectActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    // טיפול נכון ב-High DPI
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      // הגדרת הגודל הפיזי של הקנבס (פיקסלים אמיתיים)
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      // נרמול מערכת הקואורדינטות של הקנבס (CSS Pixels)
      ctx.scale(dpr, dpr);

      // אתחול מחדש של החלקיקים כדי שיתאימו לגודל החדש
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      // שימוש ברוחב הלוגי (window.innerWidth) ולא הפיזי
      const width = window.innerWidth;
      const height = window.innerHeight;

      // כמות חלקיקים דינמית לפי גודל מסך
      const particleCount = width < 768 ? 30 : 60;

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(width, height));
      }
    };

    const animate = () => {
      // ניקוי הקנבס בלבד - הגרדיאנט מגיע מה-CSS
      // אנחנו מנקים לפי הגודל הלוגי כי עשינו scale
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Debounce פרימיטיבי ל-Resize כדי למנוע קריסה בשינוי גודל מהיר
    let resizeTimeout: NodeJS.Timeout;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    handleResize(); // אתחול ראשוני
    animate(); // התחלת אנימציה
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimeout);
    };
  }, [isEffectActive]); // תלות בודדת - האם האפקט פעיל

  // אם האפקט כבוי או מוגדר למשהו אחר
  if (!isEffectActive) {
    // שימוש ב-Tailwind לגרדיאנט סטטי יעיל
    return <div className="fixed inset-0 -z-50 bg-gradient-to-b from-[#050505] to-[#0a0a12]" />;
  }

  return (
    <>
      {/* שכבה 1: גרדיאנט סטטי ב-CSS (GPU Accelerated) */}
      <div className="fixed inset-0 -z-50 bg-gradient-to-b from-[#050505] to-[#0a0a12]" />

      {/* שכבה 2: קנבס שקוף לחלקיקים */}
      <canvas ref={canvasRef} className="fixed inset-0 -z-40 pointer-events-none w-full h-full" />
    </>
  );
};

export default DynamicBackground;
