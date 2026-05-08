import React from 'react';

interface ShiftTableZoomProps {
  children: React.ReactNode;
  parentRef: React.RefObject<HTMLDivElement>;
  scale?: number;
}

export default function ShiftTableZoom({ children, parentRef, scale = 100 }: ShiftTableZoomProps) {
  return (
    <div className="flex flex-col h-full">
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