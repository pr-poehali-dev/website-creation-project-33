import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formKey, setFormKey] = useState(0);

  const toggleMode = (mode?: boolean) => {
    const next = mode !== undefined ? mode : !isLogin;
    setIsLogin(next);
    setFormKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f8] flex items-start justify-center pt-16 sm:pt-32 px-4 sm:px-6 pb-6">
      <div className="w-full max-w-sm animate-fade-up">

        {/* Заголовок */}
        <div className="mb-6 sm:mb-8 animate-fade-down" style={{ animationDelay: '0.05s' }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#001f54] mb-1 transition-all duration-300">
            {isLogin ? 'Добро пожаловать' : 'Присоединяйтесь'}
          </h1>
          <p className="text-gray-500 text-sm transition-all duration-300">
            {isLogin ? 'Войдите, чтобы продолжить работу' : 'Создайте новый аккаунт'}
          </p>
        </div>

        {/* Таб переключатель */}
        <div className="flex bg-white rounded-2xl p-1 mb-4 shadow-sm animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => toggleMode(true)}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              isLogin ? 'bg-[#001f54] text-white shadow-md scale-[1.02]' : 'text-gray-400 hover:text-[#001f54]'
            }`}
          >
            Войти
          </button>
          <button
            onClick={() => toggleMode(false)}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              !isLogin ? 'bg-[#001f54] text-white shadow-md scale-[1.02]' : 'text-gray-400 hover:text-[#001f54]'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Форма */}
        <div
          key={formKey}
          className="bg-white rounded-2xl shadow-sm p-6 animate-fade-up"
          style={{ animationDelay: '0.15s' }}
        >
          {isLogin ? (
            <LoginForm onToggleMode={() => toggleMode(false)} hideToggle />
          ) : (
            <RegisterForm onToggleMode={() => toggleMode(true)} hideToggle />
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          © {new Date().getFullYear()} Империя Промо. Все права защищены.
        </p>
      </div>
    </div>
  );
}
