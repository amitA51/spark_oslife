import React, { useState } from 'react';
import { PersonalItem } from '../types';
import PremiumTaskCard from './PremiumTaskCard';
import { ChevronLeftIcon, EyeOffIcon, GripVerticalIcon } from './icons';
import { useDragControls, Reorder } from 'framer-motion';

interface TimeSectionProps {
  title: string;
  icon: React.ReactNode;
  tasks: PersonalItem[];
  gradient: string;
  borderColor: string;
  onUpdateTask: (id: string, updates: Partial<PersonalItem>) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (task: PersonalItem) => void;
  onRescheduleTask?: (task: PersonalItem) => void;
  isCollapsible?: boolean;
  isDraggable?: boolean;
  onReorder?: (items: PersonalItem[]) => void;
  onHide?: (id: string) => void;
  onHideSection?: () => void;
  children?: React.ReactNode;
  dragHandleProps?: React.DOMAttributes<HTMLDivElement>;
}

const TimeSection: React.FC<TimeSectionProps> = ({
  title,
  icon,
  tasks,
  gradient,
  borderColor,
  onUpdateTask,
  onDeleteTask,
  onSelectTask,
  onRescheduleTask,
  isCollapsible = true,
  isDraggable = false,
  onReorder,
  onHide,
  onHideSection,
  children,
  dragHandleProps,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="mb-2 group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Section Header - Marcelo Design X Style */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          {/* Section Drag Handle */}
          {isDraggable && (
            <div
              className={`
                                cursor-grab active:cursor-grabbing p-1.5 rounded-lg 
                                text-white/20 hover:text-white/60 hover:bg-white/5 
                                transition-all duration-200
                                ${showActions ? 'opacity-100' : 'opacity-0'}
                            `}
              {...dragHandleProps}
            >
              <GripVerticalIcon className="w-5 h-5" />
            </div>
          )}

          <div
            className={`flex items-center gap-3 ${isCollapsible ? 'cursor-pointer' : ''}`}
            onClick={() => isCollapsible && setIsCollapsed(!isCollapsed)}
          >
            <div
              className={`
                            w-10 h-10 flex items-center justify-center rounded-2xl
                            bg-white/5 border border-white/10 backdrop-blur-md
                            shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]
                            transition-all duration-300 group-hover:scale-105
                            group-hover:bg-white/10 group-hover:border-white/20
                            ${isCollapsed ? 'opacity-50' : 'opacity-100'}
                        `}
            >
              <div className="text-white/90">{icon}</div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white/90 font-heading tracking-wide">
                  {title}
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/5">
                  {tasks.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div
          className={`flex items-center gap-1 transition-all duration-300 ${showActions || isCollapsed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
        >
          {onHideSection && (
            <button
              onClick={e => {
                e.stopPropagation();
                onHideSection();
              }}
              className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors ml-2"
              title="הסתר קטגוריה זמנית"
            >
              <EyeOffIcon className="w-5 h-5" />
            </button>
          )}

          {isCollapsible && (
            <button
              onClick={e => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
              className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <ChevronLeftIcon
                className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-90'}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div
        className={`
                transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden
                ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}
            `}
      >
        <div className="space-y-3 pl-4 border-l-2 border-white/5 ml-6">
          {children}
          {onReorder ? (
            <Reorder.Group axis="y" values={tasks} onReorder={onReorder} className="space-y-3">
              {tasks.map(task => (
                <TaskItemWrapper
                  key={task.id}
                  task={task}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  onSelectTask={onSelectTask}
                  onRescheduleTask={onRescheduleTask}
                  onHide={onHide}
                />
              ))}
            </Reorder.Group>
          ) : (
            tasks.map(task => (
              <PremiumTaskCard
                key={task.id}
                item={task}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                onSelect={onSelectTask}
                onReschedule={onRescheduleTask}
                onHide={onHide}
              />
            ))
          )}

          {tasks.length === 0 && (
            <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
              <p className="text-sm text-white/30 font-medium">אין משימות בקטגוריה זו</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskItemWrapper: React.FC<{
  task: PersonalItem;
  onUpdateTask: (id: string, updates: Partial<PersonalItem>) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (task: PersonalItem) => void;
  onRescheduleTask?: (task: PersonalItem) => void;
  onHide?: (id: string) => void;
}> = ({ task, onUpdateTask, onDeleteTask, onSelectTask, onRescheduleTask, onHide }) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={dragControls}
      className="relative"
      whileDrag={{ scale: 1.02, zIndex: 50 }}
    >
      <PremiumTaskCard
        item={task}
        onUpdate={onUpdateTask}
        onDelete={onDeleteTask}
        onSelect={onSelectTask}
        onReschedule={onRescheduleTask}
        onHide={onHide}
        dragHandleProps={{ onPointerDown: (e: React.PointerEvent) => dragControls.start(e) }}
      />
    </Reorder.Item>
  );
};

export default TimeSection;
