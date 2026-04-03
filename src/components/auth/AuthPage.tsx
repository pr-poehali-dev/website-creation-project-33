import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen bg-[#f0f2f8] flex items-start justify-center pt-16 sm:pt-32 px-4 sm:px-6 pb-6">
      <div className="w-full max-w-sm">

        {/* Заголовок */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#001f54] mb-1">
            {isLogin ? 'Добро пожаловать' : 'Присоединяйтесь'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isLogin ? 'Войдите, чтобы продолжить работу' : 'Создайте новый аккаунт'}
          </p>
        </div>

        {/* Таб переключатель */}
        <div className="flex bg-white rounded-2xl p-1 mb-4 shadow-sm">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              isLogin ? 'bg-[#001f54] text-white shadow-md' : 'text-gray-400 hover:text-[#001f54]'
            }`}
          >
            Войти
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              !isLogin ? 'bg-[#001f54] text-white shadow-md' : 'text-gray-400 hover:text-[#001f54]'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
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