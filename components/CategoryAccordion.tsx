import React, { useState, useMemo } from 'react';
import type { PersonalItem } from '../types';
import PersonalItemCard from './PersonalItemCard';

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
  items: PersonalItem[];
  count: number;
};

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

    const categoriesArray: CategoryGroup[] = Array.from(grouped.entries()).map(([name, items]) => ({
      name: getCategoryLabel(name, groupBy),
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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-[var(--text-secondary)] text-sm">אין פריטים להצגה</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-screen-enter">
      {categories.map((category, index) => {
        const isExpanded = expandedCategories.has(category.name);

        return (
          <div
            key={category.name}
            className="themed-card overflow-hidden transition-all duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 flex items-center justify-center transition-transform duration-300"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  <span className="text-[var(--text-secondary)] text-lg">▶</span>
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{category.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--dynamic-accent-start)]/20 text-[var(--dynamic-accent-start)] font-mono">
                  {category.count}
                </span>
              </div>
            </button>

            <div
              className="transition-all duration-300 ease-out overflow-hidden"
              style={{
                maxHeight: isExpanded ? `${category.items.length * 150}px` : '0px',
                opacity: isExpanded ? 1 : 0,
              }}
            >
              <div className="px-2 pb-2 space-y-2">
                {category.items.map((item, itemIndex) => (
                  <PersonalItemCard
                    key={item.id}
                    item={item}
                    index={itemIndex}
                    onSelect={onSelectItem}
                    onUpdate={onUpdateItem}
                    onDelete={onDeleteItem}
                    onContextMenu={onContextMenu || (() => { })}
                    onLongPress={() => { }}
                    isInSelectionMode={false}
                    isSelected={false}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(CategoryAccordion);
