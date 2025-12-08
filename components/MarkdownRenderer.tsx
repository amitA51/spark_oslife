import React, { useMemo, useState, useEffect } from 'react';
import showdown from 'showdown';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
  animate?: boolean;
}

// DOMPurify configuration for safe HTML rendering
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'del', 'input', 'span', 'div'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'type', 'checked', 'disabled', 'class'],
  ALLOW_DATA_ATTR: false,
};

// Create a single, configured showdown converter instance.
// Note: showdown's 'sanitize' option is deprecated and doesn't provide real XSS protection
const converter = new showdown.Converter({
  tables: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true,
  ghCompatibleHeaderId: true,
  openLinksInNewWindow: true,
});

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, animate = false }) => {
  const [displayedContent, setDisplayedContent] = useState(animate ? '' : content);
  const [isTyping, setIsTyping] = useState(animate);

  // Use ref to track the current typing position without causing re-renders
  const currentIndexRef = React.useRef(0);

  useEffect(() => {
    // PERFORMANCE: Track if component is still mounted to prevent state updates after unmount
    let isMounted = true;

    if (!animate) {
      setDisplayedContent(content);
      setIsTyping(false);
      currentIndexRef.current = content.length;
      return;
    }

    // If content changed drastically (e.g., new message), reset
    if (content.length < currentIndexRef.current) {
      setDisplayedContent('');
      currentIndexRef.current = 0;
      setIsTyping(true);
    }

    // If we are already done, don't restart unless content grew
    if (currentIndexRef.current >= content.length) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);

    const intervalId = setInterval(() => {
      // RACE CONDITION FIX: Check if still mounted before updating state
      if (!isMounted) {
        clearInterval(intervalId);
        return;
      }

      if (currentIndexRef.current >= content.length) {
        clearInterval(intervalId);
        if (isMounted) setIsTyping(false);
        return;
      }

      // Type chunks to speed up long text
      const chunkSize = content.length > 200 ? 3 : 1;
      currentIndexRef.current += chunkSize;

      if (isMounted) {
        setDisplayedContent(content.slice(0, currentIndexRef.current));
      }
    }, 15);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [content, animate]);

  const htmlContent = useMemo(() => {
    const rawHtml = converter.makeHtml(displayedContent);
    // SECURITY: Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(rawHtml, DOMPURIFY_CONFIG);
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
