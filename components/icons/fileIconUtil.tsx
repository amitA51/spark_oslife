/**
 * File Icon Utility
 * 
 * Returns the appropriate icon component for a file based on its MIME type.
 * Separated from the main icons barrel to avoid ESM initialization issues.
 */

import React from 'react';
import { ImageIcon, AudioFileIcon, PdfIcon, DocIcon, FileIcon } from './mediaIcons';

export const getFileIcon = (mimeType: string): React.ReactElement => {
    const cls = 'h-5 w-5';
    if (mimeType.startsWith('image/')) return <ImageIcon className={`${cls} text-purple-400`} />;
    if (mimeType.startsWith('audio/')) return <AudioFileIcon className={`${cls} text-teal-400`} />;
    if (mimeType === 'application/pdf') return <PdfIcon className={`${cls} text-red-400`} />;
    if (mimeType.includes('document') || mimeType.includes('msword'))
        return <DocIcon className={`${cls} text-blue-400`} />;
    return <FileIcon className={`${cls} text-gray-400`} />;
};
