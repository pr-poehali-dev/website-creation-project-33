import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-8">
      {/* Основной контент */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200">
          {/* Логотип/заголовок */}
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-block p-3 md:p-4 rounded-full bg-gray-100 mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex items-center justify-center">
                <span className="text-xl md:text-2xl">🚀</span>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">
              {isLogin ? 'Добро пожаловать!' : 'Присоединяйтесь!'}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
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