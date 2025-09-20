'use client';

import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  noPadding = false,
}) => {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle) && (
        <div
          className={`${!noPadding ? '' : 'px-6 pt-6'} ${
            title || subtitle ? 'mb-4' : ''
          }`}
        >
          {title && (
            <h3 className="text-xl font-bold text-neutral-dark">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-neutral-dark/60 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      <div className={noPadding ? '' : !title && !subtitle ? '' : ''}>
        {children}
      </div>
    </div>
  );
};
