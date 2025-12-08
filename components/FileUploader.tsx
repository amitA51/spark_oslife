import React, { useRef, useState } from 'react';
import { UploadIcon } from './icons';
import { Attachment } from '../types';

interface FileUploaderProps {
  onFileSelect: (file: Attachment) => void;
  maxSizeMB?: number;
  accept?: string;
  label?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  maxSizeMB = 5,
  accept = '*',
  label = 'העלה קובץ',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setError(null);

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`הקובץ גדול מדי. הגודל המקסימלי הוא ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const url = event.target?.result as string;
      const attachment: Attachment = {
        id: Date.now().toString(),
        name: file.name,
        type: 'local',
        url: url,
        mimeType: file.type,
        size: file.size,
      };
      onFileSelect(attachment);
    };
    reader.onerror = () => setError('שגיאה בקריאת הקובץ.');
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
                    border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                    ${
                      isDragging
                        ? 'border-[var(--dynamic-accent-start)] bg-[var(--dynamic-accent-start)]/10'
                        : 'border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] hover:bg-[var(--bg-secondary)]'
                    }
                `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={accept}
        />
        <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)]">
          <UploadIcon className="w-8 h-8 mb-2" />
          <span className="font-medium text-sm">{label}</span>
          <span className="text-xs opacity-70">לחץ או גרור קובץ לכאן (עד {maxSizeMB}MB)</span>
        </div>
      </div>
      {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
    </div>
  );
};

export default FileUploader;
