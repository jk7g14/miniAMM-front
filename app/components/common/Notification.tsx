'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { notificationAtom, NotificationState } from '@/app/atoms';

export function Notification() {
  const [notification] = useAtom(notificationAtom);

  if (!notification) return null;

  const bgColor: Record<NotificationState['type'], string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  const icon: Record<NotificationState['type'], string> = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className="fixed bottom-6 right-6 max-w-sm z-50 animate-in slide-in-from-bottom duration-300">
      <div
        className={`${
          bgColor[notification.type]
        } text-white rounded-xl shadow-xl backdrop-blur-sm border border-white/20`}
      >
        <div className="px-8 py-6 flex items-start gap-5">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-lg font-bold">{icon[notification.type]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-loose break-words py-2 px-1">
              {notification.message}
            </p>
            {notification.txHash && (
              <a
                href={`https://coston2-explorer.flare.network/tx/${notification.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs underline mt-3 hover:no-underline transition-all duration-200 hover:bg-white/10 px-2 py-1 rounded"
              >
                <span>View on Explorer</span>
                <span>→</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
