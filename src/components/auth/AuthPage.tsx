import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Анимированный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 opacity-30">
          <div className="w-2 h-2 bg-white rounded-full absolute top-12 left-16 animate-pulse"></div>
          <div className="w-1 h-1 bg-white rounded-full absolute top-28 left-44 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="w-1 h-1 bg-white rounded-full absolute top-44 left-28 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="w-2 h-2 bg-white rounded-full absolute top-64 left-56 animate-pulse" style={{animationDelay: '3s'}}></div>
        </div>
      </div>
      
      {/* Плавающие световые элементы */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 float-animation"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 float-animation" style={{animationDelay: '2s'}}></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 float-animation" style={{animationDelay: '4s'}}></div>
      
      {/* Основной контент */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-effect rounded-2xl p-8 shadow-2xl slide-up">
          {/* Логотип/заголовок с эффектом */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 rounded-full glass-effect mb-4 pulse-glow">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              {isLogin ? 'Добро пожаловать!' : 'Присоединяйтесь!'}
            </h1>
            <p className="text-white/70">
              {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
            </p>
          </div>
          
          {isLogin ? (
            <LoginForm onToggleMode={toggleMode} />
          ) : (
            <RegisterForm onToggleMode={toggleMode} />
          )}
        </div>
      </div>
    </div>
  );
}