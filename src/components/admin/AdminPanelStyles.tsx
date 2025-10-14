import React from 'react';

export default function AdminPanelStyles() {
  return (
    <style>{`
      /* iOS 18 Spring Animations */
      @keyframes glass-float {
        0%, 100% { 
          transform: translate(0, 0) rotate(0deg) scale(1);
        }
        25% { 
          transform: translate(20px, -15px) rotate(2deg) scale(1.05);
        }
        50% { 
          transform: translate(-10px, 10px) rotate(-1.5deg) scale(0.98);
        }
        75% { 
          transform: translate(-15px, -8px) rotate(1deg) scale(1.02);
        }
      }
      
      @keyframes ios-spring-in {
        0% {
          opacity: 0;
          transform: scale(0.85) translateY(20px);
        }
        50% {
          transform: scale(1.02) translateY(-5px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      @keyframes ios-bounce {
        0%, 100% {
          transform: translateY(0) scale(1);
        }
        50% {
          transform: translateY(-8px) scale(1.02);
        }
      }
      
      @keyframes shimmer {
        0% { 
          background-position: -1000px 0;
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
        100% { 
          background-position: 1000px 0;
          opacity: 0.5;
        }
      }
      
      @keyframes glow-pulse {
        0%, 100% {
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 0 40px rgba(255, 255, 255, 0.05),
            0 0 20px rgba(255, 255, 255, 0.1);
        }
        50% {
          box-shadow: 
            0 12px 40px 0 rgba(31, 38, 135, 0.5),
            inset 0 0 60px rgba(255, 255, 255, 0.08),
            0 0 30px rgba(255, 255, 255, 0.2);
        }
      }
      
      @keyframes liquid-morph {
        0%, 100% {
          border-radius: 20px;
        }
        25% {
          border-radius: 25px 20px 25px 20px;
        }
        50% {
          border-radius: 20px 25px 20px 25px;
        }
        75% {
          border-radius: 25px 20px 25px 20px;
        }
      }
      
      .glass-panel {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 
          0 8px 32px 0 rgba(31, 38, 135, 0.37),
          inset 0 0 40px rgba(255, 255, 255, 0.05);
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        animation: ios-spring-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      .glass-panel:hover {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transform: translateY(-4px) scale(1.01);
        box-shadow: 
          0 16px 48px 0 rgba(31, 38, 135, 0.6),
          inset 0 0 60px rgba(255, 255, 255, 0.08),
          0 0 40px rgba(255, 255, 255, 0.15);
        animation: glow-pulse 2s ease-in-out infinite;
      }
      
      .glass-panel:active {
        transform: translateY(-2px) scale(0.99);
        transition: all 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      .glass-button {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        overflow: hidden;
      }
      
      .glass-button::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
      }
      
      .glass-button:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-3px) scale(1.05);
        box-shadow: 
          0 12px 24px rgba(0, 0, 0, 0.3),
          0 0 20px rgba(255, 255, 255, 0.2);
      }
      
      .glass-button:hover::before {
        width: 300px;
        height: 300px;
      }
      
      .glass-button:active {
        transform: translateY(-1px) scale(0.98);
        transition: all 0.1s ease;
      }
      
      .floating-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
        opacity: 0.4;
        animation: glass-float 20s infinite ease-in-out;
        will-change: transform;
      }
      
      /* iOS 18 Touch Feedback */
      @media (hover: none) and (pointer: coarse) {
        .glass-panel:active {
          transform: scale(0.97);
          transition: transform 0.1s ease;
        }
        
        .glass-button:active {
          transform: scale(0.95);
          background: rgba(255, 255, 255, 0.25);
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }
      }
      
      /* Smooth scrolling iOS style */
      * {
        -webkit-overflow-scrolling: touch;
      }
      
      /* iOS spring bounce on scroll */
      @supports (-webkit-overflow-scrolling: touch) {
        body {
          overscroll-behavior-y: none;
        }
      }
    `}</style>
  );
}
