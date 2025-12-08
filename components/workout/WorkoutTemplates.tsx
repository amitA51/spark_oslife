import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutTemplate } from '../../types';
import * as dataService from '../../services/dataService';
import { AddIcon, TrashIcon, PlayIcon, DumbbellIcon } from '../icons';
import './workout-premium.css';

interface WorkoutTemplatesProps {
  onStartWorkout: (template: WorkoutTemplate) => void;
  onClose?: () => void;
}

const WorkoutTemplates: React.FC<WorkoutTemplatesProps> = ({ onStartWorkout, onClose }) => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState<WorkoutTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    await dataService.initializeBuiltInWorkoutTemplates();
    const data = await dataService.getWorkoutTemplates();
    setTemplates(data);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newTemplate: WorkoutTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      exercises: [],
      isBuiltin: false,
      createdAt: new Date().toISOString(),
    };

    await dataService.createWorkoutTemplate(newTemplate);
    setNewTemplateName('');
    setShowAddForm(false);
    loadTemplates();
  };

  const handleDelete = (template: WorkoutTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplateToDelete(template);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    await dataService.deleteWorkoutTemplate(templateToDelete.id);
    setTemplateToDelete(null);
    loadTemplates();
  };

  const cancelDelete = () => {
    setTemplateToDelete(null);
  };

  // Estimate workout duration (avg 3 min per set)
  const estimateDuration = (template: WorkoutTemplate) => {
    const totalSets = template.exercises.reduce((sum, ex) => sum + (ex.sets?.length || 3), 0);
    const mins = totalSets * 3;
    return mins < 60 ? `${mins} דק'` : `${Math.round(mins / 60)} שעה`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center sticky top-0 bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent backdrop-blur-xl z-10 py-4 -mx-2 px-2">
        <div>
          <h2 className="text-2xl font-black workout-gradient-text-accent">
            תבניות אימון
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">בחר תבנית להתחלה מהירה</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={() => setShowAddForm(!showAddForm)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--cosmos-accent-cyan)] text-black rounded-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all flex items-center gap-2"
          >
            <AddIcon className="w-5 h-5" />
            <span className="hidden sm:inline">תבנית חדשה</span>
          </motion.button>
          {onClose && (
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
            >
              סגור
            </motion.button>
          )}
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateTemplate}
            className="workout-glass-card rounded-2xl p-4 flex gap-3 overflow-hidden"
          >
            <input
              type="text"
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              placeholder="שם התבנית החדשה..."
              className="flex-1 px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-[var(--accent-primary)] outline-none text-white placeholder-white/30 transition-colors"
              autoFocus
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--cosmos-accent-cyan)] text-black rounded-xl font-bold shadow-lg"
            >
              צור
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onStartWorkout(template)}
            className="workout-template-card relative overflow-hidden rounded-2xl cursor-pointer group"
          >
            {/* Card Background */}
            <div className={`absolute inset-0 ${template.isBuiltin
              ? 'bg-gradient-to-br from-[var(--cosmos-accent-primary)]/10 via-transparent to-[var(--cosmos-accent-cyan)]/5'
              : 'bg-gradient-to-br from-white/5 to-white/[0.02]'
              }`} />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-[var(--cosmos-accent-primary)]/0 group-hover:bg-[var(--cosmos-accent-primary)]/5 transition-colors duration-300" />

            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--cosmos-accent-primary)]/10 to-transparent rounded-bl-[100%] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Card Border */}
            <div className={`absolute inset-0 rounded-2xl border ${template.isBuiltin
              ? 'border-[var(--cosmos-accent-primary)]/20 group-hover:border-[var(--cosmos-accent-primary)]/40'
              : 'border-white/10 group-hover:border-white/20'
              } transition-colors`} />

            {/* Content */}
            <div className="relative z-10 p-5">
              {/* Header Row */}
              <div className="flex justify-between items-start mb-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-3 rounded-xl ${template.isBuiltin
                    ? 'bg-gradient-to-br from-[var(--cosmos-accent-primary)]/20 to-[var(--cosmos-accent-primary)]/5'
                    : 'bg-white/5'
                    }`}
                >
                  {template.isBuiltin ? (
                    <DumbbellIcon className="w-6 h-6 text-[var(--cosmos-accent-primary)]" />
                  ) : (
                    <PlayIcon className="w-6 h-6 text-white/70" />
                  )}
                </motion.div>

                {!template.isBuiltin && (
                  <motion.button
                    onClick={e => handleDelete(template, e)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-red-500/0 hover:bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </motion.button>
                )}
              </div>

              {/* Template Name */}
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[var(--cosmos-accent-primary)] transition-colors">
                {template.name}
              </h3>

              {/* Stats Row */}
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] mb-3">
                <span className="flex items-center gap-1">
                  <span className="text-[var(--cosmos-accent-primary)]">{template.exercises.length}</span>
                  תרגילים
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{estimateDuration(template)}</span>
              </div>

              {/* Muscle Groups */}
              {template.muscleGroups && template.muscleGroups.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {template.muscleGroups.slice(0, 3).map(muscle => (
                    <span
                      key={muscle}
                      className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/60 font-medium"
                    >
                      {muscle}
                    </span>
                  ))}
                  {template.muscleGroups.length > 3 && (
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/40">
                      +{template.muscleGroups.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Type Badge */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide ${template.isBuiltin
                ? 'bg-[var(--cosmos-accent-primary)]/10 text-[var(--cosmos-accent-primary)]'
                : 'bg-white/5 text-white/50'
                }`}>
                {template.isBuiltin ? '⭐ מובנה' : '👤 אישי'}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Create New Card */}
        <motion.button
          onClick={() => setShowAddForm(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02, borderColor: 'rgba(99, 102, 241, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-white/10 text-white/40 hover:text-[var(--cosmos-accent-primary)] hover:bg-white/[0.02] transition-all min-h-[200px] group"
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            <AddIcon className="w-10 h-10 mb-3 opacity-40 group-hover:opacity-100 transition-opacity" />
          </motion.div>
          <span className="font-semibold">צור תבנית חדשה</span>
          <span className="text-xs mt-1 opacity-60">התחל אימון ריק</span>
        </motion.button>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {templateToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[12000] flex items-center justify-center p-4"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm workout-glass-card rounded-3xl p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">למחוק תבנית?</h3>
              <p className="text-base text-white/80 mb-1">{templateToDelete.name}</p>
              <p className="text-sm text-white/50 mb-6">
                המחיקה תשפיע רק על התבנית, אימונים שכבר ביצעת יישארו בהיסטוריה.
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={cancelDelete}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-white/10 transition-all"
                >
                  ביטול
                </motion.button>
                <motion.button
                  onClick={confirmDelete}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all"
                >
                  מחיקה
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutTemplates;

