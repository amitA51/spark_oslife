import React, { useEffect } from 'react';
import { performanceService } from '../../services/performanceService';
import { updateAppBadge } from '../../services/notificationsService';
import { StatusMessageType } from '../StatusMessage';
import type { FeedItem } from '../../types';

interface AppMonitoringProps {
  feedItems: FeedItem[];
  showStatus: (type: StatusMessageType, text: string) => void;
}

/**
 * AppMonitoring Component
 *
 * Manages application monitoring and analytics:
 * - Performance monitoring (Web Vitals, memory usage)
 * - Performance issue detection
 * - Mouse tracking for spotlight effects
 * - App badge updates based on unread feed items
 */
const AppMonitoring: React.FC<AppMonitoringProps> = ({ feedItems, showStatus }) => {
  // Performance Monitoring
  useEffect(() => {
    performanceService.measureBasicVitals();
    performanceService.logMetric('App Mount', performance.now());

    // Log memory usage periodically (every 5 minutes)
    const memoryInterval = setInterval(() => {
      performanceService.logMemoryUsage();
    }, 300000);

    // Check for performance issues every 5 minutes
    const issueCheckInterval = setInterval(() => {
      const issues = performanceService.detectIssues();
      const criticalIssues = issues.filter(i => i.severity === 'high');

      if (criticalIssues.length > 0) {
        showStatus('info', `זוהו ${criticalIssues.length} בעיות ביצועים קריטיות`);
      }
    }, 300000); // 5 minutes

    return () => {
      clearInterval(memoryInterval);
      clearInterval(issueCheckInterval);
    };
  }, [showStatus]);

  // Global Mouse Tracker for Spotlight Effect
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      // Update CSS variables on body for the spotlight effect
      document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  // Update app badge whenever unread feed items change
  useEffect(() => {
    const unreadCount = feedItems.filter(item => !item.is_read).length;
    updateAppBadge(unreadCount);
  }, [feedItems]);

  // This component doesn't render anything - it's purely for side effects
  return null;
};

export default AppMonitoring;
