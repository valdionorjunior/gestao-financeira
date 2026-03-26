import React from 'react';

interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  className?: string;
}

export function Skeleton({ height = 20, width = '100%', className = '' }: SkeletonProps) {
  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-lg ${className}`}
      style={{ height: heightStyle, width: widthStyle }}
    />
  );
}
