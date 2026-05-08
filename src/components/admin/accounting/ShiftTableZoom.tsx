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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 40px)' }}>
      <div className="flex justify-between items-center py-1 px-0 flex-shrink-0">
        <div className="flex gap-1.5 md:gap-2 items-center">
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            disabled={scale <= 50}
            className="h-7 w-7 md:h-8 md:w-8 p-0 bg-white border-gray-300 hover:bg-gray-50 text-gray-600 disabled:opacity-30"
          >
            <Icon name="ZoomOut" size={14} className="md:w-4 md:h-4" />
          </Button>
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="sm"
            disabled={scale >= 200}
            className="h-7 w-7 md:h-8 md:w-8 p-0 bg-white border-gray-300 hover:bg-gray-50 text-gray-600 disabled:opacity-30"
          >
            <Icon name="ZoomIn" size={14} className="md:w-4 md:h-4" />
          </Button>
          <Button
            onClick={handleResetZoom}
            variant="outline"
            size="sm"
            className="h-7 px-2 md:h-8 md:px-3 text-[10px] md:text-xs bg-white border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold"
          >
            {scale}%
          </Button>
        </div>
      </div>

      <div 
        ref={parentRef}
        className="overflow-auto border border-gray-200 md:border-2 rounded-lg flex-1"
        style={{
          minHeight: 0,
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