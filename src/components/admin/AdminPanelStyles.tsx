import React from 'react';

export default function AdminPanelStyles() {
  return (
    <style>{`
      /* iOS 26 Quantum Animations */
      @keyframes quantum-float {
        0%, 100% { 
          transform: translate(0, 0) rotate(0deg) scale(1);
          filter: blur(60px) hue-rotate(0deg);
        }
        20% { 
          transform: translate(30px, -25px) rotate(3deg) scale(1.08);
          filter: blur(70px) hue-rotate(30deg);
        }
        40% { 
          transform: translate(-20px, 15px) rotate(-2deg) scale(0.95);
          filter: blur(55px) hue-rotate(60deg);
        }
        60% { 
          transform: translate(25px, 20px) rotate(1.5deg) scale(1.03);
          filter: blur(65px) hue-rotate(90deg);
        }
        80% { 
          transform: translate(-15px, -10px) rotate(-1deg) scale(1.01);
          filter: blur(58px) hue-rotate(120deg);
        }
      }
      
      @keyframes ios26-material-in {
        0% {
          opacity: 0;
          transform: scale(0.75) translateY(40px) rotateX(15deg);
          filter: blur(20px);
        }
        40% {
          opacity: 0.6;
          transform: scale(1.05) translateY(-10px) rotateX(-5deg);
          filter: blur(5px);
        }
        70% {
          transform: scale(0.98) translateY(3px) rotateX(2deg);
          filter: blur(0px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0) rotateX(0deg);
          filter: blur(0px);
        }
      }
      
      @keyframes ios26-elastic-bounce {
        0%, 100% {
          transform: translateY(0) scale(1) rotateZ(0deg);
        }
        25% {
          transform: translateY(-12px) scale(1.03, 0.97) rotateZ(-1deg);
        }
        50% {
          transform: translateY(-20px) scale(1.05, 0.95) rotateZ(0deg);
        }
        75% {
          transform: translateY(-8px) scale(0.98, 1.02) rotateZ(1deg);
        }
      }
      
      @keyframes quantum-shimmer {
        0% { 
          background-position: -1200px 0;
          opacity: 0.3;
          filter: hue-rotate(0deg);
        }
        50% {
          opacity: 1;
          filter: hue-rotate(180deg);
        }
        100% { 
          background-position: 1200px 0;
          opacity: 0.3;
          filter: hue-rotate(360deg);
        }
      }
      
      @keyframes neural-glow {
        0%, 100% {
          box-shadow: 
            0 10px 40px 0 rgba(31, 38, 135, 0.4),
            inset 0 0 50px rgba(255, 255, 255, 0.06),
            0 0 25px rgba(100, 200, 255, 0.15),
            0 0 50px rgba(200, 100, 255, 0.1);
        }
        33% {
          box-shadow: 
            0 15px 50px 0 rgba(100, 50, 200, 0.5),
            inset 0 0 70px rgba(255, 255, 255, 0.1),
            0 0 35px rgba(200, 100, 255, 0.25),
            0 0 70px rgba(100, 200, 255, 0.15);
        }
        66% {
          box-shadow: 
            0 15px 50px 0 rgba(50, 100, 200, 0.5),
            inset 0 0 70px rgba(255, 255, 255, 0.1),
            0 0 35px rgba(100, 255, 200, 0.25),
            0 0 70px rgba(255, 100, 200, 0.15);
        }
      }
      
      @keyframes fluid-morph {
        0%, 100% {
          border-radius: 24px;
        }
        20% {
          border-radius: 32px 24px 28px 20px;
        }
        40% {
          border-radius: 20px 32px 24px 28px;
        }
        60% {
          border-radius: 28px 20px 32px 24px;
        }
        80% {
          border-radius: 24px 28px 20px 32px;
        }
      }
      
      @keyframes holographic-shift {
        0% {
          background-position: 0% 50%;
          filter: hue-rotate(0deg) brightness(1);
        }
        25% {
          background-position: 50% 100%;
          filter: hue-rotate(90deg) brightness(1.1);
        }
        50% {
          background-position: 100% 50%;
          filter: hue-rotate(180deg) brightness(1);
        }
        75% {
          background-position: 50% 0%;
          filter: hue-rotate(270deg) brightness(1.1);
        }
        100% {
          background-position: 0% 50%;
          filter: hue-rotate(360deg) brightness(1);
        }
      }
      
      .glass-panel {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(30px) saturate(200%) brightness(1.1);
        -webkit-backdrop-filter: blur(30px) saturate(200%) brightness(1.1);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 
          0 10px 40px 0 rgba(31, 38, 135, 0.4),
          inset 0 0 50px rgba(255, 255, 255, 0.06),
          0 0 25px rgba(100, 200, 255, 0.15);
        transition: all 0.8s cubic-bezier(0.23, 1.4, 0.32, 1);
        animation: ios26-material-in 0.8s cubic-bezier(0.23, 1.4, 0.32, 1);
        transform-style: preserve-3d;
        perspective: 1000px;
      }
      
      .glass-panel:hover {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.25);
        transform: translateY(-6px) scale(1.02) rotateX(2deg);
        box-shadow: 
          0 20px 60px 0 rgba(50, 100, 200, 0.6),
          inset 0 0 80px rgba(255, 255, 255, 0.12),
          0 0 50px rgba(100, 200, 255, 0.2),
          0 0 100px rgba(200, 100, 255, 0.15);
        animation: neural-glow 3s ease-in-out infinite;
      }
      
      .glass-panel:active {
        transform: translateY(-3px) scale(0.98) rotateX(-2deg);
        transition: all 0.15s cubic-bezier(0.23, 1.4, 0.32, 1);
      }
      
      .glass-button {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
        backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.25);
        transition: all 0.5s cubic-bezier(0.23, 1.4, 0.32, 1);
        position: relative;
        overflow: hidden;
        background-size: 200% 200%;
        animation: holographic-shift 8s ease infinite;
      }
      
      .glass-button::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
        transform: translate(-50%, -50%);
        transition: width 0.8s ease-out, height 0.8s ease-out;
        pointer-events: none;
      }
      
      .glass-button::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transform: translateX(-100%);
        transition: transform 0.6s ease;
      }
      
      .glass-button:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
        transform: translateY(-4px) scale(1.08) rotateZ(-1deg);
        box-shadow: 
          0 15px 30px rgba(0, 0, 0, 0.4),
          0 0 30px rgba(100, 200, 255, 0.3),
          inset 0 0 20px rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
      }
      
      .glass-button:hover::before {
        width: 400px;
        height: 400px;
      }
      
      .glass-button:hover::after {
        transform: translateX(100%);
      }
      
      .glass-button:active {
        transform: translateY(-2px) scale(0.96) rotateZ(1deg);
        transition: all 0.12s cubic-bezier(0.6, -0.3, 0.4, 1.3);
        box-shadow: 
          0 8px 15px rgba(0, 0, 0, 0.3),
          0 0 20px rgba(100, 200, 255, 0.2),
          inset 0 0 15px rgba(255, 255, 255, 0.15);
      }
      
      .floating-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
        opacity: 0.5;
        animation: quantum-float 25s infinite ease-in-out;
        will-change: transform, filter;
        mix-blend-mode: screen;
      }
      
      /* iOS 26 Neural Touch Feedback */
      @media (hover: none) and (pointer: coarse) {
        @keyframes neural-press {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.94);
          }
          100% {
            transform: scale(0.97);
          }
        }
        
        .glass-panel:active {
          animation: neural-press 0.2s cubic-bezier(0.6, -0.3, 0.4, 1.3);
          transform: scale(0.97);
          transition: transform 0.15s ease;
        }
        
        .glass-button:active {
          transform: scale(0.92);
          background: rgba(255, 255, 255, 0.3);
        }
        
        * {
          -webkit-tap-highlight-color: rgba(100, 200, 255, 0.1);
          -webkit-touch-callout: none;
        }
      }
      
      /* Quantum Smooth Scrolling */
      * {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        scrollbar-width: thin;
        scrollbar-color: rgba(100, 200, 255, 0.3) transparent;
      }
      
      *::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      *::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
      }
      
      *::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(100, 200, 255, 0.4), rgba(200, 100, 255, 0.4));
        border-radius: 10px;
        border: 2px solid transparent;
      }
      
      *::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(100, 200, 255, 0.6), rgba(200, 100, 255, 0.6));
      }
      
      /* iOS 26 Neural Overscroll */
      @supports (-webkit-overflow-scrolling: touch) {
        body {
          overscroll-behavior-y: contain;
        }
      }
      
      /* Quantum Depth Layers */
      @supports (backdrop-filter: blur(1px)) {
        .glass-panel {
          transform: translateZ(0);
          will-change: transform, box-shadow;
        }
      }
    `}</style>
  );
}