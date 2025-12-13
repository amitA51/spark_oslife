import React, { useState, useEffect, useRef } from 'react';
import type { Screen } from '../types';
import { createAssistantChat } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { SendIcon, ChevronLeftIcon } from '../components/icons';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useSound } from '../hooks/useSound';
import { useData } from '../src/contexts/DataContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isTyping?: boolean;
}

interface AssistantScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const AssistantScreen: React.FC<AssistantScreenProps> = ({ setActiveScreen }) => {
  const { feedItems, personalItems } = useData();
  const { playClick } = useSound();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const chatSession = await createAssistantChat(feedItems, personalItems);
        setChat(chatSession);

        const initialHistory = (await chatSession.getHistory()).map((h, i) => ({
          id: `initial-${i}`,
          role: h.role as 'user' | 'model',
          text: h.parts?.[0]?.text || '',
          isTyping: false,
        }));

        const modelMessages = initialHistory.filter(m => m.role === 'model');
        if (modelMessages.length > 0) {
          setMessages(modelMessages);
        }
      } catch (error) {
        console.error('Failed to initialize assistant chat:', error);
        setMessages([
          {
            id: 'error',
            role: 'model',
            text: 'שגיאה בהפעלת היועץ. נסה שוב מאוחר יותר.',
            isTyping: false,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, [feedItems, personalItems]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chat || isLoading) return;

    playClick();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      isTyping: false,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const stream = await chat.sendMessageStream({ message: userMessage.text });

      let modelResponse = '';
      const modelMessageId = `model-${Date.now()}`;

      // Add a placeholder for the model's message with 'isTyping' true
      setMessages(prev => [
        ...prev,
        { id: modelMessageId, role: 'model', text: '', isTyping: true },
      ]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        // Update the model's message in the state as it streams in
        // Note: MarkdownRenderer handles the internal animation, so we just update the text prop.
        // However, to avoid rapid re-renders of the typewriter, we could buffer.
        // But MarkdownRenderer's animate prop handles full text typing.
        // To make streaming look smooth with the typewriter, we just update the text.
        // The key is that `isTyping` tells us it's fresh.

        setMessages(prev =>
          prev.map(msg => (msg.id === modelMessageId ? { ...msg, text: modelResponse } : msg))
        );
      }

      // Mark as done typing when stream ends
      setMessages(prev =>
        prev.map(msg => (msg.id === modelMessageId ? { ...msg, isTyping: false } : msg))
      );
    } catch (error) {
      console.error('Failed to get assistant response:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'model',
        text: 'התנצלותי, נתקלתי בשגיאה.',
        isTyping: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-3">
      <div className="w-2 h-2 bg-[var(--accent-start)] rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-[var(--accent-start)] rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-[var(--accent-start)] rounded-full animate-pulse"></div>
    </div>
  );

  return (
    <div className="screen-shell flex flex-col h-[calc(100vh-80px)] px-4">
      <header className="screen-header flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('library')}
            className="p-2 rounded-full text-secondary hover:bg-bg-secondary hover:text-white transition-colors"
            aria-label="חזור לספרייה"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="screen-title">יועץ אישי</h1>
            <p className="text-sm text-secondary mt-1">שאל שאלות על המידע האישי שלך</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6 pb-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xl p-4 rounded-3xl shadow-md ${msg.role === 'user' ? 'bg-bg-card text-white rounded-br-lg' : 'bg-bg-secondary text-primary rounded-bl-lg'}`}
            >
              {/* Animate only if it's a model message and it's the most recent one (or explicitly marked as typing) */}
              <MarkdownRenderer
                content={msg.text}
                animate={
                  msg.role === 'model' &&
                  (msg.isTyping || msg.id === messages[messages.length - 1]?.id)
                }
              />
            </div>
          </div>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-secondary)] rounded-3xl rounded-bl-lg">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-auto pt-4 pb-2 bg-[var(--bg-primary)]">
        <div className="flex items-center space-x-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full p-2 shadow-lg">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="הקלד כאן..."
            className="flex-1 w-full bg-transparent text-white py-2 px-3 focus:outline-none"
            disabled={isLoading}
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="bg-[var(--accent-gradient)] text-white rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-110 active:scale-95"
            aria-label="שלח הודעה"
          >
            <SendIcon className="h-5 w-5 -rotate-45" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantScreen;
