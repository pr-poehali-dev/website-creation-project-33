import React from 'react';

export default function FloatingOrbs() {
  return (
    <>
      <div className="floating-orb w-96 h-96 bg-blue-500 top-0 left-0" style={{ animationDelay: '0s' }} />
      <div className="floating-orb w-80 h-80 bg-purple-500 bottom-0 right-0" style={{ animationDelay: '5s' }} />
      <div className="floating-orb w-64 h-64 bg-cyan-500 top-1/2 left-1/2" style={{ animationDelay: '10s' }} />
    </>
  );
}
