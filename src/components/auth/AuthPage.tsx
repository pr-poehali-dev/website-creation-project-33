import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-20 h-20 rounded-full bg-white border border-gray-200 shadow-md overflow-hidden flex items-center justify-center p-2">
            <img
              src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg"
              alt="IMPERIA PROMO"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xs tracking-[0.2em] uppercase text-gray-400 font-medium mt-1">Империя Промо</p>
        </div>

        {/* Таб переключатель */}
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-4 shadow-sm">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              isLogin ? 'bg-[#001f54] text-white shadow-md' : 'text-gray-500 hover:text-[#001f54]'
            }`}
          >
            Войти
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              !isLogin ? 'bg-[#001f54] text-white shadow-md' : 'text-gray-500 hover:text-[#001f54]'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          {isLogin ? (
            <LoginForm onToggleMode={toggleMode} hideToggle />
          ) : (
            <RegisterForm onToggleMode={toggleMode} hideToggle />
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Империя Промо. Все права защищены.
        </p>
      </div>
    </div>
  );
}