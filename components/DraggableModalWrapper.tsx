import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

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
  className = '',
  initialX,
  initialY,
}) => {
  // Detect if we're on mobile
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || 'ontouchstart' in window;
  }, []);

  // Position state - only used on desktop
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Center the modal on desktop only
  useEffect(() => {
    if (!isMobile && modalRef.current && !isPositioned) {
      const rect = modalRef.current.getBoundingClientRect();
      if (initialX !== undefined && initialY !== undefined) {
        setPosition({ x: initialX, y: initialY });
      } else {
        setPosition({
          x: Math.max(0, (window.innerWidth - rect.width) / 2),
          y: Math.max(0, (window.innerHeight - rect.height) / 2),
        });
      }
      setIsPositioned(true);
    }
  }, [isMobile, initialX, initialY, isPositioned]);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Skip dragging on mobile - use native scroll instead
    if (isMobile) return;

    // Allow interaction with form elements inside
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'SELECT' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return;
    }

    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

    setIsDragging(true);
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  }, [isMobile, position.x, position.y]);

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || isMobile) return;

      e.preventDefault();
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

      // Constrain to viewport bounds
      const newX = Math.max(0, Math.min(window.innerWidth - 100, clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, clientY - dragOffset.y));

      setPosition({ x: newX, y: newY });
    },
    [isDragging, isMobile, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging && !isMobile) {
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
  }, [isDragging, isMobile, handleMouseMove, handleMouseUp]);

  // Track visual viewport height for keyboard handling on mobile
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!isMobile) return;

    const updateViewportHeight = () => {
      // Use visualViewport for accurate height when keyboard is open
      const height = window.visualViewport?.height ?? window.innerHeight;
      setViewportHeight(height);
    };

    // Initial set
    updateViewportHeight();

    // Listen to visualViewport changes (keyboard open/close)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    }
    window.addEventListener('resize', updateViewportHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      }
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, [isMobile]);

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    if (isMobile) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
    return undefined;
  }, [isMobile]);

  // Compute modal styles based on device
  const modalStyle = useMemo(() => {
    if (isMobile) {
      // Mobile: Use dynamic viewport height for keyboard handling
      return {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        height: viewportHeight ? `${viewportHeight}px` : '100dvh',
        willChange: 'height' as const,
        transition: 'height 0.15s ease-out',
      };
    }
    // Desktop: Positioned with transform
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      willChange: isDragging ? 'transform' as const : 'auto' as const,
    };
  }, [isMobile, position.x, position.y, isDragging, viewportHeight]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        // Use dynamic viewport height on mobile for keyboard handling
        height: isMobile && viewportHeight ? `${viewportHeight}px` : (isMobile ? '100dvh' : '100vh'),
      }}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop - clickable to close */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-lg pointer-events-auto animate-in fade-in-0 duration-300"
        onClick={onClose}
      />

      <div
        ref={modalRef}
        style={modalStyle}
        className={`
          pointer-events-auto
          ${className}
          ${isDragging ? 'cursor-grabbing scale-[1.01]' : ''}
          ${isMobile ? 'w-full' : ''}
          transition-[transform,opacity,height]
          duration-150
          ease-out
        `}
      >
        {/* Drag Handle Bar - Only show on desktop */}
        {!isMobile && (
          <div
            className={`
              w-full h-7 
              bg-gradient-to-b from-white/[0.03] to-transparent 
              rounded-t-2xl cursor-grab 
              flex items-center justify-center 
              absolute top-0 left-0 right-0 z-50 
              ${isDragging ? 'cursor-grabbing' : ''}
              hover:from-white/[0.06]
              transition-colors duration-300
            `}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors duration-300" />
          </div>
        )}

        {/* Mobile Drag Handle / Visual Indicator */}
        {isMobile && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
        )}

        {/* Content */}
        <div className={`h-full flex flex-col ${!isMobile ? 'pt-3' : 'pt-5'} relative z-10`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DraggableModalWrapper;
