'use client';

import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-1 flex items-center justify-center gap-1.5 
            px-3 py-1.5 rounded-md transition-all duration-200
            font-medium text-sm min-h-[32px] cursor-pointer
            ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          {tab.icon && <span className="text-xs">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
