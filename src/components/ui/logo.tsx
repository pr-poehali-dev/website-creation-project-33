import React from 'react';
import Icon from './icon';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-xl bg-primary flex items-center justify-center shadow-sm`}>
        <Icon name="Shield" size={size === 'sm' ? 20 : size === 'md' ? 28 : 36} className="text-primary-foreground" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizes[size]} font-bold text-foreground leading-tight`}>
            Admin Panel
          </h1>
          <p className="text-xs text-muted-foreground font-medium tracking-wide">
            MANAGEMENT SYSTEM
          </p>
        </div>
      )}
    </div>
  );
}