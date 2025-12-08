import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import { MicrophoneIcon, CloseIcon, SparklesIcon } from './icons';
import { Screen, NlpResult, PersonalItem, PersonalItemType } from '../types';
import { useData } from '../src/contexts/DataContext';

// --- Web Speech API Type Definitions ---
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: { readonly transcript: string; readonly confidence: number };
}

interface SpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/**
 * VoiceInputModal
 *
 * משודרג כך שהקלט הקולי עובר דרך אותו מנגנון AI חכם של SmartCapture:
 * - זיהוי דיבור → תמליל
 * - תמליל → smartParseInput (מחליט סוג פריט + Space + תאריך)
 * - הצגת preview לפני יצירה, עם כפתור "צור" / "ערוך טקסט"
 *
 * בכך גם קלט קולי וגם הקלדה רגילה משתמשים באותה "בינה מלאכותית שיודעת איפה לשים את זה".
 */

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveScreen: (screen: Screen) => void;
}

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'unsupported';

const VoiceInputModal: React.FC<VoiceInputModalProps> = ({ isOpen, onClose, setActiveScreen }) => {
  const { addPersonalItem, personalItems, spaces } = useData();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<NlpResult | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const resetState = () => {
    setStatus('idle');
    setTranscript('');
    setFinalTranscript('');
    setError('');
    setAiSuggestion(null);
  };

  const handleClose = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    resetState();
    onClose();
  };

  /**
   * מנתח את הטקסט עם smartParseInput – כמו ב-SmartCaptureModal.
   * כאן ה-AI יודע:
   * - אם זה task / note / habit / idea
   * - באיזה Space לשים (suggestedSpaceId)
   * - את התאריך והעדיפות אם זה משימה
   */
  const analyzeWithAI = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setStatus('idle');
        setAiSuggestion(null);
        return;
      }

      setStatus('processing');
      setError('');
      try {
        const result = await geminiService.smartParseInput(text, spaces, personalItems);
        setAiSuggestion(result);
        setStatus('idle');
      } catch (e: unknown) {
        console.error('Error processing voice input with smartParseInput:', e);
        setError('שגיאה בניתוח הטקסט.');
        setStatus('error');
      }
    },
    [spaces, personalItems]
  );

  const handleCreateFromSuggestion = useCallback(async () => {
    if (!aiSuggestion) return;

    try {
      const newItemData: Partial<PersonalItem> & { type: PersonalItemType; title: string } = {
        type: aiSuggestion.type as PersonalItemType,
        title: aiSuggestion.title,
        content: '',
        spaceId: aiSuggestion.suggestedSpaceId,
      };

      if (aiSuggestion.type === 'task') {
        newItemData.dueDate = aiSuggestion.dueDate;
        newItemData.priority = aiSuggestion.priority || 'medium';
      }

      if (aiSuggestion.type === 'habit') {
        newItemData.frequency = 'daily';
      }

      const newItem = await addPersonalItem(newItemData);

      setStatus('success');
      setTimeout(() => {
        handleClose();
        setActiveScreen(newItem.type === 'task' ? 'today' : 'library');
      }, 1200);
    } catch (e) {
      console.error('Failed to create item from voice smart capture:', e);
      setError('שגיאה ביצירת הפריט.');
      setStatus('error');
    }
  }, [aiSuggestion, addPersonalItem, setActiveScreen]);

  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setStatus('unsupported');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'he-IL';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setStatus('listening');
        setTranscript('');
        setFinalTranscript('');
        setError('');
        setAiSuggestion(null);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result?.[0]?.transcript ?? '';
          if (result?.isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        setTranscript(interim);
        setFinalTranscript(prev => (final ? prev + final : prev));
      };

      recognition.onend = () => {
        // סיום ההאזנה – מפעילים את ה-AI על התמליל הסופי
        const textToAnalyze = (finalTranscript || transcript).trim();
        if (textToAnalyze) {
          analyzeWithAI(textToAnalyze);
        } else {
          setStatus('idle');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);

        switch (event.error) {
          case 'no-speech':
          case 'audio-capture':
            setError('לא זוהה דיבור או שאין גישה למיקרופון. נסה שוב.');
            break;
          case 'not-allowed':
            setError('הגישה למיקרופון נדחתה. נא לאשר בהגדרות הדפדפן.');
            break;
          case 'network':
            setError('שגיאת רשת בזיהוי דיבור.');
            break;
          default:
            setError('אירעה שגיאה בזיהוי הדיבור.');
        }
        setStatus('error');
      };

      recognitionRef.current = recognition;
    }

    startListening();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen, analyzeWithAI, finalTranscript, transcript]);

  const startListening = () => {
    if (recognitionRef.current && status !== 'listening') {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Could not start recognition:', e);
      }
    }
  };

  const getStatusContent = () => {
    if (status === 'listening') return 'מקשיב...';
    if (status === 'processing') return 'AI מנתח את מה שאמרת...';
    if (status === 'success') return 'נוסף בהצלחה!';
    if (status === 'error') return error || 'אירעה שגיאה';
    if (status === 'unsupported') return 'הדפדפן שלך לא תומך בזיהוי דיבור.';
    if (aiSuggestion) return 'בדוק את ההצעה ויצור פריט אם מתאים';
    return 'לחץ על המיקרופון, דבר חופשי, וה-AI ידע איפה לשים את זה';
  };

  const microphoneButtonClass = () => {
    switch (status) {
      case 'listening':
        return 'animate-pulse-deep';
      case 'processing':
        return 'bg-blue-500/50';
      case 'success':
        return 'bg-green-500/50';
      case 'error':
        return 'bg-red-500/50';
      default:
        return 'bg-[var(--accent-gradient)]';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-modal-enter">
      <button onClick={handleClose} className="absolute top-6 right-6 text-muted hover:text-white">
        <CloseIcon className="w-8 h-8" />
      </button>

      <div className="flex flex-col items-center justify-center flex-grow text-center max-w-xl w-full">
        <button
          onClick={startListening}
          disabled={status === 'listening' || status === 'processing'}
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${microphoneButtonClass()}`}
        >
          {status === 'processing' ? (
            <SparklesIcon className="w-12 h-12 text-white animate-spin" />
          ) : (
            <MicrophoneIcon className="w-12 h-12 text-white" />
          )}
        </button>

        <p className="text-xl text-white mt-6 min-h-[3rem]">
          {transcript || finalTranscript || 'התחל לדבר...'}
        </p>

        <p className="text-sm text-[var(--text-secondary)] mt-2 min-h-[1.5rem]">
          {getStatusContent()}
        </p>

        {aiSuggestion && (
          <div className="mt-6 w-full text-left bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-4 space-y-3">
            <p className="text-sm text-muted">הצעת AI:</p>
            <p className="text-lg font-bold text-white">{aiSuggestion.title}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded-full bg-black/40">
                סוג: {aiSuggestion.type}
              </span>
              {aiSuggestion.dueDate && (
                <span className="px-2 py-1 rounded-full bg-black/40">
                  🗓️ {new Date(aiSuggestion.dueDate).toLocaleDateString('he-IL')}
                </span>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCreateFromSuggestion}
                className="flex-1 py-2 px-3 rounded-xl bg-[var(--accent-gradient)] text-white font-semibold"
              >
                צור פריט
              </button>
              <button
                onClick={() => {
                  // לאפשר למשתמש להעתיק/להמשיך לעריכה טקסטואלית במודאל Smart Capture (עתידי)
                  // לעת עתה רק סוגרים את המודאל ומשאירים את החוויה פשוטה.
                  handleClose();
                  setActiveScreen('add');
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-[var(--bg-secondary)] text-white font-semibold"
              >
                ערוך כטקסט
              </button>
            </div>
          </div>
        )}

        {error && !aiSuggestion && (
          <p className="mt-4 text-red-400 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
};

export default VoiceInputModal;
