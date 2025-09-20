'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  suffix?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  suffix,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-dark mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`
            w-full px-4 py-2 
            border rounded-lg 
            text-base font-sans
            transition-all duration-200
            ${
              error
                ? 'border-red-500  focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
                : 'border-neutral-dark/20 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
            }
            focus:outline-none
            disabled:bg-neutral-dark/5 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-dark/60">
            {suffix}
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p
          className={`text-xs mt-1 ${
            error ? 'text-red-500' : 'text-neutral-dark/60'
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};
