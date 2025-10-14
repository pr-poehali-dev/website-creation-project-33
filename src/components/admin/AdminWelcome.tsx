import React from 'react';

interface AdminWelcomeProps {
  adminName: string;
}

export default function AdminWelcome({ adminName }: AdminWelcomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001f54] via-[#002b6b] to-[#001f54] flex items-center justify-center p-4">
      <style>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-logo {
          animation: fadeInScale 0.3s ease-out forwards;
        }
        .animate-text {
          animation: fadeInUp 0.3s ease-out 0.1s forwards;
          opacity: 0;
        }
      `}</style>
      
      <div className="text-center">
        <div className="mb-8 animate-logo">
          <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full bg-white border-4 border-white overflow-hidden flex items-center justify-center p-6 shadow-2xl">
            <img 
              src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg" 
              alt="IMPERIA PROMO"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="space-y-3 animate-text">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Привет, {adminName}
          </h1>
        </div>
      </div>
    </div>
  );
}
