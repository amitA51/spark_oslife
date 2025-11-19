import React, { useState } from 'react';
import { ImportSource, importData, importFromObsidian, ImportResult } from '../services/importService';
import { PersonalItem } from '../types';
import { CloseIcon, UploadIcon, CheckCircleIcon, AlertIcon } from './icons';

interface ImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (items: PersonalItem[]) => Promise<void>;
}

type Step = 'select-source' | 'upload' | 'preview' | 'importing' | 'complete';

const ImportWizard: React.FC<ImportWizardProps> = ({ isOpen, onClose, onImport }) => {
    const [step, setStep] = useState<Step>('select-source');
    const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        setStep('importing');

        try {
            let result: ImportResult;

            if (selectedSource === 'obsidian' || selectedSource === 'markdown') {
                // Handle markdown files
                result = await importFromObsidian(Array.from(files));
            } else {
                // Handle JSON files
                const file = files[0];
                const text = await file.text();
                const jsonData = JSON.parse(text);
                result = await importData(jsonData, selectedSource, file.name);
            }

            setImportResult(result);
            setStep('preview');
        } catch (error) {
            setImportResult({
                success: false,
                itemsImported: 0,
                items: [],
                errors: [`שגיאה בקריאת הקובץ: ${error}`],
                warnings: [],
            });
            setStep('preview');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        if (!importResult || importResult.items.length === 0) return;

        setIsProcessing(true);
        try {
            await onImport(importResult.items);
            setStep('complete');
        } catch (error) {
            alert(`שגיאה בייבוא: ${error}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setStep('select-source');
        setSelectedSource(null);
        setImportResult(null);
        setIsProcessing(false);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-primary)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">ייבוא נתונים</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Select Source */}
                    {step === 'select-source' && (
                        <div className="space-y-4">
                            <p className="text-[var(--text-secondary)] mb-6">
                                בחר את המקור ממנו תרצה לייבא נתונים:
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'obsidian', name: 'Obsidian', desc: 'קבצי Markdown', icon: '📝' },
                                    { id: 'notion', name: 'Notion', desc: 'JSON Export', icon: '📄' },
                                    { id: 'todoist', name: 'Todoist', desc: 'JSON Export', icon: '✅' },
                                    { id: 'trello', name: 'Trello', desc: 'JSON Export', icon: '📋' },
                                ].map((source) => (
                                    <button
                                        key={source.id}
                                        onClick={() => {
                                            setSelectedSource(source.id as ImportSource);
                                            setStep('upload');
                                        }}
                                        className="p-6 bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] rounded-xl transition-all text-right group"
                                    >
                                        <div className="text-4xl mb-3">{source.icon}</div>
                                        <h3 className="font-bold text-lg text-[var(--text-primary)] mb-1">
                                            {source.name}
                                        </h3>
                                        <p className="text-sm text-[var(--text-secondary)]">{source.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <button
                                onClick={() => setStep('select-source')}
                                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                ← חזור
                            </button>
                            <div className="text-center">
                                <h3 className="text-xl font-bold mb-2">העלה קבצים מ-{selectedSource}</h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-6">
                                    {selectedSource === 'obsidian' || selectedSource === 'markdown'
                                        ? 'בחר קבצי Markdown (.md)'
                                        : 'בחר קובץ JSON ייצוא'}
                                </p>
                                <label className="cursor-pointer">
                                    <div className="border-2 border-dashed border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] rounded-xl p-12 transition-all">
                                        <UploadIcon className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
                                        <p className="text-[var(--text-primary)] font-medium">
                                            לחץ לבחירת קבצים
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)] mt-2">
                                            {selectedSource === 'obsidian' ? 'ניתן לבחור מספר קבצים' : 'קובץ JSON בלבד'}
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        accept={selectedSource === 'obsidian' || selectedSource === 'markdown' ? '.md' : '.json'}
                                        multiple={selectedSource === 'obsidian' || selectedSource === 'markdown'}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Importing */}
                    {step === 'importing' && (
                        <div className="text-center py-12">
                            <div className="animate-spin w-16 h-16 border-4 border-[var(--dynamic-accent-start)] border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-[var(--text-primary)] font-medium">מעבד קבצים...</p>
                        </div>
                    )}

                    {/* Step 4: Preview */}
                    {step === 'preview' && importResult && (
                        <div className="space-y-6">
                            {importResult.errors.length > 0 && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-red-400 mb-2">שגיאות</h4>
                                            <ul className="text-sm text-red-300 space-y-1">
                                                {importResult.errors.map((error, i) => (
                                                    <li key={i}>• {error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {importResult.warnings.length > 0 && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-yellow-400 mb-2">אזהרות</h4>
                                            <ul className="text-sm text-yellow-300 space-y-1">
                                                {importResult.warnings.map((warning, i) => (
                                                    <li key={i}>• {warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {importResult.items.length > 0 && (
                                <>
                                    <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                                        <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                                            נמצאו {importResult.itemsImported} פריטים לייבוא
                                        </h4>
                                        <div className="max-h-64 overflow-y-auto space-y-2">
                                            {importResult.items.slice(0, 10).map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-primary)]"
                                                >
                                                    <p className="font-medium text-sm text-[var(--text-primary)]">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                                        {item.type} • {item.tags.length} תגים
                                                    </p>
                                                </div>
                                            ))}
                                            {importResult.items.length > 10 && (
                                                <p className="text-xs text-center text-[var(--text-secondary)] pt-2">
                                                    ועוד {importResult.items.length - 10} פריטים...
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleReset}
                                            className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
                                        >
                                            ביטול
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={isProcessing}
                                            className="flex-1 px-4 py-3 bg-[var(--dynamic-accent-start)] text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50 transition-all"
                                        >
                                            {isProcessing ? 'מייבא...' : 'ייבא עכשיו'}
                                        </button>
                                    </div>
                                </>
                            )}

                            {importResult.items.length === 0 && importResult.errors.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-[var(--text-secondary)]">לא נמצאו פריטים לייבוא</p>
                                    <button
                                        onClick={handleReset}
                                        className="mt-4 px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                                    >
                                        נסה שוב
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 5: Complete */}
                    {step === 'complete' && (
                        <div className="text-center py-12">
                            <CheckCircleIcon className="w-20 h-20 text-green-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                                הייבוא הושלם בהצלחה!
                            </h3>
                            <p className="text-[var(--text-secondary)] mb-6">
                                {importResult?.itemsImported} פריטים יובאו למערכת
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-[var(--dynamic-accent-start)] text-white rounded-lg font-medium hover:brightness-110 transition-all"
                            >
                                סגור
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportWizard;
