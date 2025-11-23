import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface ShiftTableZoomProps {
  children: React.ReactNode;
  parentRef: React.RefObject<HTMLDivElement>;
}

export default function ShiftTableZoom({ children, parentRef }: ShiftTableZoomProps) {
  const [scale, setScale] = useState(100);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setScale(100);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4 mt-6">
        <div className="flex gap-2 items-center">
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            disabled={scale <= 50}
            className="h-8 w-8 p-0 bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 text-slate-200 disabled:opacity-30"
          >
            <Icon name="ZoomOut" size={16} />
          </Button>
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="sm"
            disabled={scale >= 200}
            className="h-8 w-8 p-0 bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 text-slate-200 disabled:opacity-30"
          >
            <Icon name="ZoomIn" size={16} />
          </Button>
          <Button
            onClick={handleResetZoom}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 text-slate-200 font-semibold"
          >
            {scale}%
          </Button>
        </div>
      </div>

      <div 
        ref={parentRef}
        className="overflow-auto border-2 border-slate-700/50 rounded-lg scrollbar-dark"
        style={{
          height: 'calc(100vh - 280px)',
          minHeight: '500px',
          width: '100%'
        }}
      >
        <div
          style={{
            transform: `scale(${scale / 100})`,
            transformOrigin: 'top left',
            minWidth: 'max-content',
            width: `${100 / (scale / 100)}%`
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}