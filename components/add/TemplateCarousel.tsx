import React, { useRef, useState } from 'react';
import { AddableType } from '../../types';
import { SparklesIcon } from '../icons';
import { useHaptics } from '../../hooks/useHaptics';
import { todayKey } from '../../utils/dateUtils';

interface TemplateCarouselProps {
  templates?: TemplatePreset[];
  onSelectTemplate: (template: TemplatePreset) => void;
  recentTemplates?: TemplatePreset[];
}

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  type: AddableType;
  icon: string;
  color: string;
  prefillData: Record<string, unknown>;
  isAISuggested?: boolean;
  isTrending?: boolean;
  isRecent?: boolean;
}

const defaultTemplates: TemplatePreset[] = [
  {
    id: 'morning-task',
    name: 'משימת בוקר',
    description: 'משימה עם תאריך יעד להיום',
    type: 'task',
    icon: '☀️',
    color: 'from-amber-500 to-orange-500',
    prefillData: {
      dueDate: todayKey(),
      priority: 'high',
    },
  },
  {
    id: 'quick-note',
    name: 'פתק מהיר',
    description: 'רשום מחשבה במהירות',
    type: 'note',
    icon: '📝',
    color: 'from-yellow-400 to-amber-500',
    prefillData: {},
  },
  {
    id: 'meeting-notes',
    name: 'סיכום פגישה',
    description: 'תבנית לרשימת החלטות ומשימות',
    type: 'note',
    icon: '🗒️',
    color: 'from-blue-400 to-cyan-500',
    prefillData: {
      title: 'סיכום פגישה - ',
      content: '## משתתפים\n\n## נושאים שנדונו\n\n## החלטות\n\n## משימות המשך\n',
    },
  },
  {
    id: 'weekly-review',
    name: 'סיכום שבועי',
    description: 'סקירת השבוע שחלף',
    type: 'journal',
    icon: '📊',
    color: 'from-purple-500 to-violet-500',
    prefillData: {
      title: 'סיכום שבוע',
    },
    isAISuggested: true,
  },
  {
    id: 'book-summary',
    name: 'סיכום ספר',
    description: 'תבנית לתיעוד תובנות מספר',
    type: 'book',
    icon: '📚',
    color: 'from-indigo-500 to-purple-500',
    prefillData: {},
  },
  {
    id: 'project-kickoff',
    name: 'פתיחת פרויקט',
    description: 'תבנית לפרויקט חדש עם שלבים',
    type: 'roadmap',
    icon: '🚀',
    color: 'from-cyan-500 to-blue-500',
    prefillData: {},
    isTrending: true,
  },
  {
    id: 'workout-strength',
    name: 'אימון כוח',
    description: 'תבנית לאימון חדר כושר',
    type: 'workout',
    icon: '💪',
    color: 'from-pink-500 to-rose-500',
    prefillData: {},
  },
  {
    id: 'spark-idea',
    name: 'ספארק רעיון',
    description: 'לכוד רעיון יצירתי',
    type: 'spark',
    icon: '✨',
    color: 'from-cyan-400 to-violet-500',
    prefillData: {},
    isAISuggested: true,
  },
];

const TemplateCarousel: React.FC<TemplateCarouselProps> = ({
  templates = defaultTemplates,
  onSelectTemplate,
  recentTemplates = [],
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHaptics();
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSelectTemplate = (template: TemplatePreset) => {
    triggerHaptic('medium');
    onSelectTemplate(template);
  };

  const allTemplates = [...recentTemplates, ...templates.filter(
    t => !recentTemplates.some(r => r.id === t.id)
  )];

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">תבניות מהירות</h3>
        </div>
        <span className="text-xs text-white/40 font-medium">
          גרור לסריקה →
        </span>
      </div>

      <div
        ref={scrollRef}
        className={`flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {allTemplates.map((template, index) => (
          <div
            key={template.id}
            className="snap-start flex-shrink-0 animate-in fade-in-0 slide-in-from-right-4"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'backwards',
            }}
          >
            <button
              onClick={() => handleSelectTemplate(template)}
              className={`group relative w-44 h-32 rounded-2xl overflow-hidden bg-gradient-to-br ${template.color} transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95 shadow-lg hover:shadow-2xl`}
            >
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_1px,transparent_1px)] bg-[length:20px_20px]" />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="relative z-10 h-full flex flex-col justify-between p-4">
                <div className="flex items-start justify-between">
                  <span className="text-3xl drop-shadow-lg">{template.icon}</span>
                  <div className="flex gap-1">
                    {template.isAISuggested && (
                      <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1">
                        <SparklesIcon className="w-3 h-3" />
                        AI
                      </span>
                    )}
                    {template.isTrending && (
                      <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white">
                        🔥
                      </span>
                    )}
                    {template.isRecent && (
                      <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white">
                        ⏱️
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <h4 className="text-sm font-bold text-white mb-0.5 drop-shadow-md">
                    {template.name}
                  </h4>
                  <p className="text-[10px] text-white/80 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>

              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="text-white text-sm font-bold px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  השתמש בתבנית
                </span>
              </div>

              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </div>
            </button>
          </div>
        ))}

        <div className="snap-start flex-shrink-0">
          <button
            onClick={() => {
              triggerHaptic('light');
            }}
            className="group w-44 h-32 rounded-2xl border-2 border-dashed border-white/20 hover:border-cyan-500/50 bg-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xl text-white/60 group-hover:text-cyan-400 transition-colors">+</span>
            </div>
            <span className="text-xs font-medium text-white/60 group-hover:text-white/80 transition-colors">
              צור תבנית חדשה
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCarousel;