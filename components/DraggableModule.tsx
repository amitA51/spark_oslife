import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVerticalIcon, EyeOffIcon } from './icons';

interface DraggableModuleProps {
  id: string;
  children: React.ReactNode;
  onHide?: () => void;
  title?: string;
  className?: string;
  dragListener?: boolean;
}

const DraggableModule: React.FC<DraggableModuleProps> = ({
  id,
  children,
  onHide,
  title,
  className = '',
  dragListener = false,
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={id}
      id={id}
      dragListener={dragListener}
      dragControls={dragControls}
      className={`relative group ${className}`}
    >
      {/* Module Controls Overlay - Visible on Hover */}
      <div className="absolute -top-3 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Drag Handle */}
        <div
          className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-white/10 shadow-lg cursor-grab active:cursor-grabbing text-white/40 hover:text-white transition-colors"
          onPointerDown={e => dragControls.start(e)}
        >
          <GripVerticalIcon className="w-4 h-4" />
        </div>

        {/* Hide Button */}
        {onHide && (
          <button
            onClick={e => {
              e.stopPropagation();
              onHide();
            }}
            className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-white/10 shadow-lg text-white/40 hover:text-red-400 transition-colors"
            title="הסתר רכיב זה"
          >
            <EyeOffIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative">{children}</div>
    </Reorder.Item>
  );
};

export default React.memo(DraggableModule);
