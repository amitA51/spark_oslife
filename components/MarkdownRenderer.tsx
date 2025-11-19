
import React, { useMemo, useState, useEffect } from 'react';
import showdown from 'showdown';

interface MarkdownRendererProps {
  content: string;
  animate?: boolean;
}

// Create a single, configured showdown converter instance.
const converter = new showdown.Converter({
  tables: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true,
  ghCompatibleHeaderId: true,
  openLinksInNewWindow: true,
  sanitize: true, 
});

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, animate = false }) => {
  const [displayedContent, setDisplayedContent] = useState(animate ? '' : content);
  const [isTyping, setIsTyping] = useState(animate);

  useEffect(() => {
    if (!animate) {
        setDisplayedContent(content);
        setIsTyping(false);
        return;
    }

    // If content changed drastically, reset
    if (content.length < displayedContent.length) {
        setDisplayedContent('');
        setIsTyping(true);
    }

    let currentIndex = displayedContent.length;
    
    // If we are already done, don't restart unless content grew
    if (currentIndex >= content.length) {
        setIsTyping(false);
        return;
    }

    setIsTyping(true);

    const intervalId = setInterval(() => {
        if (currentIndex >= content.length) {
            clearInterval(intervalId);
            setIsTyping(false);
            return;
        }

        // Variable speed typing for natural feel
        const char = content[currentIndex];
        const jump = char === ' ' ? 1 : 2; // Type faster on non-spaces? Or logic to type chunks.
        
        // Type chunks to speed up long text
        const chunkSize = content.length > 200 ? 3 : 1; 
        
        setDisplayedContent(content.slice(0, currentIndex + chunkSize));
        currentIndex += chunkSize;
    }, 15); // Fast typing speed

    return () => clearInterval(intervalId);
  }, [content, animate]);

  const htmlContent = useMemo(() => {
    return converter.makeHtml(displayedContent);
  }, [displayedContent]);

  return (
    <div className="relative">
        <div
        className="prose-custom whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
        {isTyping && (
            <span className="inline-block w-2.5 h-5 bg-[var(--dynamic-accent-start)] ml-1 align-middle animate-blink shadow-[0_0_8px_var(--dynamic-accent-glow)]"></span>
        )}
    </div>
  );
};

export default MarkdownRenderer;
