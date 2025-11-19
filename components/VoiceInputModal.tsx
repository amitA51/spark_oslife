import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AppContext } from '../state/AppContext';
import * as dataService from '../services/dataService';
import * as geminiService from '../services/geminiService';
import { MicrophoneIcon, CloseIcon, SparklesIcon } from './icons';
import { Screen, PersonalItemType, NlpResult } from '../types';

interface VoiceInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    setActiveScreen: (screen: Screen) => void;
}

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'unsupported';

const VoiceInputModal: React.FC<VoiceInputModalProps> = ({ isOpen, onClose, setActiveScreen }) => {
    const { dispatch } = useContext(AppContext);
    const [status, setStatus] = useState<VoiceStatus>('idle');
    const [transcript, setTranscript] = useState('');
    const [finalTranscript, setFinalTranscript] = useState('');
    const [error, setError] = useState('');
    const recognitionRef = useRef<any>(null);

    const handleClose = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        onClose();
    };
    
    const processVoiceInput = useCallback(async (text: string) => {
        if (!text) {
            setStatus('idle');
            return;
        }
        setStatus('processing');
        try {
            const result: NlpResult = await geminiService.parseNaturalLanguageInput(text);
            const newItemData: any = {
                type: result.type as PersonalItemType,
                title: result.title,
                content: '',
            };
            if (result.type === 'task') {
                newItemData.dueDate = result.dueDate;
                newItemData.priority = result.priority || 'medium';
            }
            if (result.type === 'habit') {
                newItemData.frequency = 'daily';
            }
            
            const newItem = await dataService.addPersonalItem(newItemData);
            dispatch({ type: 'ADD_PERSONAL_ITEM', payload: newItem });

            setStatus('success');
            setTimeout(() => {
                handleClose();
                setActiveScreen('today');
            }, 1500);

        } catch (e: any) {
            console.error("Error processing voice input:", e);
            setError('שגיאה בעיבוד הבקשה.');
            setStatus('error');
        }
    }, [dispatch, setActiveScreen]);

    useEffect(() => {
        if (!isOpen) return;

        // FIX: (line 71) Cast `window` to `any` to access non-standard SpeechRecognition properties.
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setStatus('unsupported');
            return;
        }

        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'he-IL';
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onstart = () => {
                setStatus('listening');
                setTranscript('');
                setFinalTranscript('');
                setError('');
            };

            recognition.onresult = (event: any) => {
                let interim = '';
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                setTranscript(interim);
                setFinalTranscript(final);
            };

            recognition.onend = () => {
                setStatus('idle');
                if (finalTranscript) {
                    processVoiceInput(finalTranscript);
                }
            };
            
            recognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                if (event.error === 'no-speech' || event.error === 'audio-capture') {
                     setError("לא זוהה דיבור. נסה שוב.");
                } else if (event.error === 'not-allowed') {
                    setError("הגישה למיקרופון נדחתה.");
                } else {
                    setError("אירעה שגיאה בזיהוי הדיבור.");
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
    }, [isOpen, processVoiceInput]);

    const startListening = () => {
        if (recognitionRef.current && status !== 'listening') {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Could not start recognition:", e);
                // This might happen if it's already started
            }
        }
    };

    const getStatusContent = () => {
        switch (status) {
            case 'listening':
                return "מקשיב...";
            case 'processing':
                return "מעבד בקשה...";
            case 'success':
                return "נוסף בהצלחה!";
            case 'error':
                return error || "אירעה שגיאה";
            case 'unsupported':
                return "הדפדפן שלך לא תומך בזיהוי דיבור.";
            case 'idle':
            default:
                return "לחץ על המיקרופון והתחל לדבר";
        }
    };
    
    const microphoneButtonClass = () => {
        switch(status) {
            case 'listening': return 'animate-pulse-deep';
            case 'processing': return 'bg-blue-500/50';
            case 'success': return 'bg-green-500/50';
            case 'error': return 'bg-red-500/50';
            default: return 'bg-[var(--accent-gradient)]';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-modal-enter">
            <button onClick={handleClose} className="absolute top-6 right-6 text-gray-400 hover:text-white">
                <CloseIcon className="w-8 h-8"/>
            </button>

            <div className="flex flex-col items-center justify-center flex-grow text-center">
                <button 
                    onClick={startListening}
                    disabled={status === 'listening' || status === 'processing'}
                    className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${microphoneButtonClass()}`}
                >
                    {status === 'processing' ? <SparklesIcon className="w-16 h-16 text-white animate-spin"/> : <MicrophoneIcon className="w-16 h-16 text-white" />}
                </button>

                <p className="text-2xl text-white mt-8 h-16">{transcript || finalTranscript}</p>

                <p className="text-lg text-[var(--text-secondary)] mt-4 min-h-[28px]">
                    {getStatusContent()}
                </p>
            </div>
        </div>
    );
};

export default VoiceInputModal;
