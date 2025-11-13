import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface ShiftTableZoomProps {
  children: React.ReactNode;
}

export default function ShiftTableZoom({ children }: ShiftTableZoomProps) {
  const [scale, setScale] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPinching, setIsPinching] = useState(false);
  const initialDistanceRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(100);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 10, 300));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 10, 30));
  };

  const handleResetZoom = () => {
    setScale(100);
  };

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const getDistance = (touches: TouchList) => {
      const touch1 = touches[0];
      const touch2 = touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsPinching(true);
        initialDistanceRef.current = getDistance(e.touches);
        initialScaleRef.current = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const scaleDelta = (currentDistance / initialDistanceRef.current) - 1;
        const newScale = Math.round(initialScaleRef.current * (1 + scaleDelta));
        setScale(Math.max(30, Math.min(300, newScale)));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        setIsPinching(false);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scale, isPinching]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2 items-center">
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            disabled={scale <= 30}
            className="h-8 w-8 p-0"
          >
            <Icon name="ZoomOut" size={16} />
          </Button>
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="sm"
            disabled={scale >= 300}
            className="h-8 w-8 p-0"
          >
            <Icon name="ZoomIn" size={16} />
          </Button>
          <Button
            onClick={handleResetZoom}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
          >
            {scale}%
          </Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="overflow-x-auto overflow-y-visible border-2 border-gray-200 rounded-lg"
        style={{
          transformOrigin: 'top left',
          touchAction: isPinching ? 'none' : 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          scrollbarWidth: 'thin',
          scrollbarColor: '#3b82f6 #e5e7eb',
          scrollBehavior: 'auto'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          style={{
            transform: `scale(${scale / 100})`,
            transformOrigin: 'top left',
            transition: isPinching ? 'none' : 'transform 0.2s ease-out',
            minWidth: 'max-content'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
