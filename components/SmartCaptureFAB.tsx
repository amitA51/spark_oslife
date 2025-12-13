import React, { useState, Suspense, lazy } from 'react';
import { SparklesIcon } from './icons';
import { StatusMessageType } from './StatusMessage';

const SmartCaptureModal = lazy(() => import('./SmartCaptureModal'));

interface SmartCaptureFABProps {
  showStatus: (type: StatusMessageType, text: string, onUndo?: () => void) => void;
}

const SmartCaptureFAB: React.FC<SmartCaptureFABProps> = ({ showStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fab right-auto left-6"
        aria-label="לכידה חכמה"
      >
        <SparklesIcon className="w-7 h-7 text-white" />
      </button>

      <Suspense fallback={null}>
        {isModalOpen && (
          <SmartCaptureModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            showStatus={showStatus}
          />
        )}
      </Suspense>
    </>
  );
};

export default SmartCaptureFAB;

