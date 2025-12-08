import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, FlameIcon, MicrophoneIcon, StopIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import { useData } from '../src/contexts/DataContext';
import { useHaptics } from '../hooks/useHaptics';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { toDateKey } from '../utils/dateUtils';

interface QuickAddProps {
  onItemAdded: (message: string) => void;
}

const QuickAddTask: React.FC<QuickAddProps> = ({ onItemAdded }) => {
  const { addPersonalItem } = useData();
  const { triggerHaptic } = useHaptics();
  const [title, setTitle] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = today, 1 = tomorrow, etc.
  const [itemType, setItemType] = useState<'task' | 'habit'>('task');
  const [isLoading, setIsLoading] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);

  // Use the centralized speech recognition hook
  const {
    isListening,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition({
    lang: 'he-IL',
    continuous: false,
    interimResults: false,
    onTranscript: (transcript) => {
      setTitle(prev => prev ? `${prev} ${transcript}` : transcript);
      triggerHaptic('light');
    },
    onError: (errorMessage) => {
      onItemAdded(errorMessage);
    },
  });

  // Generate next 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      index: i,
      date: date,
      label: i === 0 ? 'היום' : i === 1 ? 'מחר' : ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'][date.getDay()],
      dayNum: date.getDate(),
    };
  });

  const getDateString = (daysFromToday: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return toDateKey(date);
  };

  const handleAdd = async () => {
    if (!title.trim() || isLoading) return;

    setIsLoading(true);
    triggerHaptic('medium');

    try {
      if (itemType === 'task') {
        await addPersonalItem({
          type: 'task',
          title: title.trim(),
          dueDate: getDateString(selectedDay),
          content: '',
          isCompleted: false,
          priority: 'medium',
        });
        const dayLabel = selectedDay === 0 ? 'להיום' : selectedDay === 1 ? 'למחר' : `ל${weekDays[selectedDay]?.label}`;
        onItemAdded(`משימה נוספה ${dayLabel}`);
      } else {
        await addPersonalItem({
          type: 'habit',
          title: title.trim(),
          content: '',
          frequency: 'daily',
        });
        onItemAdded('הרגל חדש נוסף');
      }
      setTitle('');
      setSelectedDay(0);
    } catch (error) {
      console.error('Failed to add item:', error);
      onItemAdded('שגיאה בהוספה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
      triggerHaptic('light');
    } else {
      startListening();
      triggerHaptic('medium');
    }
  }, [isListening, startListening, stopListening, triggerHaptic]);

  return (
    <div className="glass-subtle rounded-2xl p-4 border border-white/5">
      {/* Input Row */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyPress={e => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder={itemType === 'task' ? 'הוסף משימה...' : 'הוסף הרגל...'}
          className="flex-1 bg-transparent text-white py-2 text-base focus:outline-none placeholder:text-gray-500"
        />

        {/* Voice Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleVoiceInput}
          className={`p-3 rounded-xl transition-all ${isListening
            ? 'bg-red-500/20 text-red-400 animate-pulse'
            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          aria-label={isListening ? 'הפסק הקלטה' : 'הקלט'}
        >
          {isListening ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
        </motion.button>

        {/* Add Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleAdd}
          disabled={!title.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? <LoadingSpinner className="w-5 h-5" /> : 'הוסף'}
        </motion.button>
      </div>

      {/* Type & Day Selectors */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        {/* Task/Habit Toggle */}
        <div className="flex bg-white/5 rounded-lg p-1">
          <button
            onClick={() => { setItemType('task'); triggerHaptic('light'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${itemType === 'task'
              ? 'bg-accent-cyan/20 text-accent-cyan'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <CheckCircleIcon className="w-3.5 h-3.5" />
            משימה
          </button>
          <button
            onClick={() => { setItemType('habit'); triggerHaptic('light'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${itemType === 'habit'
              ? 'bg-orange-500/20 text-orange-400'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <FlameIcon className="w-3.5 h-3.5" />
            הרגל
          </button>
        </div>

        {/* Day Picker (only for tasks) */}
        {itemType === 'task' && (
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => { setShowDayPicker(!showDayPicker); triggerHaptic('light'); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs hover:bg-white/10 transition-all"
            >
              <span className="w-5 h-5 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center text-[10px] font-bold">
                {weekDays[selectedDay]?.dayNum}
              </span>
              <span>{weekDays[selectedDay]?.label}</span>
              <span className="text-gray-500">▼</span>
            </button>
          </div>
        )}
      </div>

      {/* Day Picker Dropdown */}
      <AnimatePresence>
        {showDayPicker && itemType === 'task' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-white/5"
          >
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {weekDays.map((day) => (
                <button
                  key={day.index}
                  onClick={() => {
                    setSelectedDay(day.index);
                    setShowDayPicker(false);
                    triggerHaptic('light');
                  }}
                  className={`flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-xl transition-all ${selectedDay === day.index
                    ? 'bg-gradient-to-br from-accent-cyan/30 to-accent-violet/30 border border-accent-cyan/40'
                    : 'bg-white/5 hover:bg-white/10'
                    }`}
                >
                  <span className={`text-[10px] ${selectedDay === day.index ? 'text-accent-cyan' : 'text-gray-500'}`}>
                    {day.label}
                  </span>
                  <span className={`text-sm font-bold ${selectedDay === day.index ? 'text-white' : 'text-gray-300'}`}>
                    {day.dayNum}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickAddTask;
