import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PersonalItem } from '../types';
import PersonalItemCard from './PersonalItemCard';
import {
  CheckCircleIcon,
  DocIcon,
  FlameIcon,
  LinkIcon,
  BookOpenIcon,
  ChevronRightIcon,
  TargetIcon,
  CalendarIcon,
  ListIcon,
} from './icons';

interface CategoryAccordionProps {
  items: PersonalItem[];
  onSelectItem: (item: PersonalItem, event?: React.MouseEvent | React.KeyboardEvent) => void;
  onUpdateItem: (id: string, updates: Partial<PersonalItem>) => void;
  onDeleteItem: (id: string) => void;
  onContextMenu?: (event: React.MouseEvent, item: PersonalItem) => void;
  groupBy?: 'type' | 'status' | 'priority';
}

type CategoryGroup = {
  name: string;
  key: string;
  items: PersonalItem[];
  count: number;
};

// מיפוי קטגוריות לאייקונים SVG וצבעים - עיצוב פרימיום
const categoryConfig: Record<string, {
  icon: React.ReactNode;
  color: string;
  bgOpacity: string;
}> = {
  task: {
    icon: <CheckCircleIcon className="w-[18px] h-[18px]" />,
    color: '#10B981',
    bgOpacity: '0.12',
  },
  note: {
    icon: <DocIcon className="w-[18px] h-[18px]" />,
    color: '#F59E0B',
    bgOpacity: '0.12',
  },
  habit: {
    icon: <FlameIcon className="w-[18px] h-[18px]" />,
    color: '#F97316',
    bgOpacity: '0.12',
  },
  workout: {
    icon: <TargetIcon className="w-[18px] h-[18px]" />,
    color: '#EC4899',
    bgOpacity: '0.12',
  },
  link: {
    icon: <LinkIcon className="w-[18px] h-[18px]" />,
    color: '#3B82F6',
    bgOpacity: '0.12',
  },
  book: {
    icon: <BookOpenIcon className="w-[18px] h-[18px]" />,
    color: '#8B5CF6',
    bgOpacity: '0.12',
  },
  learning: {
    icon: <BookOpenIcon className="w-[18px] h-[18px]" />,
    color: '#06B6D4',
    bgOpacity: '0.12',
  },
  goal: {
    icon: <TargetIcon className="w-[18px] h-[18px]" />,
    color: '#EF4444',
    bgOpacity: '0.12',
  },
  roadmap: {
    icon: <CalendarIcon className="w-[18px] h-[18px]" />,
    color: '#14B8A6',
    bgOpacity: '0.12',
  },
  uncategorized: {
    icon: <ListIcon className="w-[18px] h-[18px]" />,
    color: '#6B7280',
    bgOpacity: '0.12',
  },
};

// Stable empty function reference to avoid re-renders
const noop = () => { };

// קומפוננטת קטגוריה יחידה - עיצוב פרימיום מותאם למובייל
const CategoryCard = React.memo<{
  category: CategoryGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectItem: CategoryAccordionProps['onSelectItem'];
  onUpdateItem: CategoryAccordionProps['onUpdateItem'];
  onDeleteItem: CategoryAccordionProps['onDeleteItem'];
  onContextMenu?: CategoryAccordionProps['onContextMenu'];
  index: number;
}>(({
  category,
  isExpanded,
  onToggle,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onContextMenu,
  index,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const defaultConfig = {
    icon: <ListIcon className="w-[18px] h-[18px]" />,
    color: '#6B7280',
    bgOpacity: '0.12',
  };
  const config = categoryConfig[category.key] ?? defaultConfig;

  // חישוב התקדמות למשימות
  const completedCount = useMemo(() => {
    if (category.key !== 'task') return 0;
    return category.items.filter(item => item.isCompleted).length;
  }, [category.items, category.key]);

  const progressPercent = category.key === 'task' && category.count > 0
    ? (completedCount / category.count) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 28,
        delay: index * 0.04,
      }}
      className="relative"
    >
      {/* Header - Mobile-first design */}
      <motion.button
        onClick={onToggle}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className="w-full relative overflow-hidden touch-manipulation"
        animate={{
          scale: isPressed ? 0.98 : 1,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          background: `linear-gradient(135deg, 
            rgba(255,255,255,0.03) 0%, 
            rgba(255,255,255,0.01) 100%
          )`,
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Subtle left accent */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{
            background: `linear-gradient(180deg, ${config.color} 0%, ${config.color}60 100%)`,
            opacity: 0.8,
          }}
        />

        <div className="relative px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Icon Container - Premium glass effect */}
            <motion.div
              className="relative flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: `rgba(${hexToRgb(config.color)}, ${config.bgOpacity})`,
                border: `1px solid rgba(${hexToRgb(config.color)}, 0.2)`,
                color: config.color,
              }}
              animate={{
                scale: isExpanded ? 1.05 : 1,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {config.icon}
            </motion.div>

            {/* Title and meta */}
            <div className="min-w-0 flex-1">
              <h3
                className="text-[15px] font-semibold text-white truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {category.name}
              </h3>

              {/* Progress for tasks - subtle inline design */}
              {category.key === 'task' && category.count > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="flex-1 max-w-[80px] h-1 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: config.color,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-medium tabular-nums"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {completedCount}/{category.count}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Count badge - minimal premium style */}
            <span
              className="min-w-[24px] h-6 px-2 rounded-lg flex items-center justify-center text-[13px] font-semibold tabular-nums"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {category.count}
            </span>

            {/* Chevron - smooth rotation */}
            <motion.div
              className="w-6 h-6 flex items-center justify-center rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.04)',
              }}
              animate={{
                rotate: isExpanded ? 90 : 0,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <ChevronRightIcon
                className="w-4 h-4 rotate-180"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              />
            </motion.div>
          </div>
        </div>
      </motion.button>

      {/* Expanded content - Premium container */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { type: 'spring', stiffness: 400, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="overflow-hidden"
          >
            <div
              className="mt-1.5 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className="p-1.5 space-y-1">
                {/* PERF: Cap stagger to first 10 items, use stable noop refs */}
                {category.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: itemIndex < 10 ? itemIndex * 0.03 : 0,
                      type: 'spring',
                      stiffness: 400,
                      damping: 28,
                    }}
                  >
                    <PersonalItemCard
                      item={item}
                      index={itemIndex}
                      onSelect={onSelectItem}
                      onUpdate={onUpdateItem}
                      onDelete={onDeleteItem}
                      onContextMenu={onContextMenu || noop}
                      onLongPress={noop}
                      isInSelectionMode={false}
                      isSelected={false}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

CategoryCard.displayName = 'CategoryCard';

// Helper function to convert hex to RGB
function hexToRgb(hex: string | undefined): string {
  if (!hex) return '255, 255, 255';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result && result[1] && result[2] && result[3]) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '255, 255, 255';
}

const CategoryAccordion: React.FC<CategoryAccordionProps> = ({
  items,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onContextMenu,
  groupBy = 'type',
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const getCategoryLabel = (key: string, groupBy: string): string => {
    if (groupBy === 'type') {
      const typeLabels: Record<string, string> = {
        task: 'משימות',
        note: 'הערות',
        habit: 'הרגלים',
        goal: 'מטרות',
        workout: 'אימונים',
        roadmap: 'מפות דרכים',
        link: 'לינקים',
        book: 'ספרים',
        learning: 'למידה',
        uncategorized: 'ללא קטגוריה',
      };
      return typeLabels[key] || key;
    }

    if (groupBy === 'status') {
      const statusLabels: Record<string, string> = {
        pending: 'ממתין',
        'in-progress': 'בתהליך',
        completed: 'הושלם',
        'no-status': 'ללא סטטוס',
      };
      return statusLabels[key] || key;
    }

    if (groupBy === 'priority') {
      const priorityLabels: Record<string, string> = {
        high: 'עדיפות גבוהה',
        medium: 'עדיפות בינונית',
        low: 'עדיפות נמוכה',
        'no-priority': 'ללא עדיפות',
      };
      return priorityLabels[key] || key;
    }

    return key;
  };

  const categories = useMemo(() => {
    const grouped = new Map<string, PersonalItem[]>();

    items.forEach(item => {
      let key: string;

      switch (groupBy) {
        case 'type':
          key = item.type || 'uncategorized';
          break;
        case 'status':
          key = item.status || 'no-status';
          break;
        case 'priority':
          key = item.priority || 'no-priority';
          break;
        default:
          key = 'other';
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    });

    grouped.forEach(categoryItems => {
      categoryItems.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    const categoriesArray: CategoryGroup[] = Array.from(grouped.entries()).map(([key, items]) => ({
      key,
      name: getCategoryLabel(key, groupBy),
      items,
      count: items.length,
    }));

    categoriesArray.sort((a, b) => {
      const aLatest = new Date(a.items[0]?.createdAt || 0).getTime();
      const bLatest = new Date(b.items[0]?.createdAt || 0).getTime();
      return bLatest - aLatest;
    });

    return categoriesArray;
  }, [items, groupBy]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  if (categories.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <ListIcon className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </div>
        <p
          className="text-[15px] font-medium"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          אין פריטים להצגה
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((category, index) => (
        <CategoryCard
          key={category.key}
          category={category}
          isExpanded={expandedCategories.has(category.name)}
          onToggle={() => toggleCategory(category.name)}
          onSelectItem={onSelectItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onContextMenu={onContextMenu}
          index={index}
        />
      ))}
    </div>
  );
};

export default React.memo(CategoryAccordion);
