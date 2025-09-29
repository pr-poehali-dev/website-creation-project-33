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
            <div className="inline-flex items-center justify-center mb-3 md:mb-4">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white border-4 border-[#001f54] overflow-hidden flex items-center justify-center p-4 shadow-lg">
                <img 
                  src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg" 
                  alt="IMPERIA PROMO"
                  className="w-full h-full object-contain"
                />
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