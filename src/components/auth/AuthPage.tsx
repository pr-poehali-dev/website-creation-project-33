import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen flex">
      {/* Левая панель — брендинг */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#001f54] flex-col items-center justify-center p-12">
        {/* Фоновые декоративные круги */}
        <div className="absolute top-[-80px] left-[-80px] w-[320px] h-[320px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[260px] h-[260px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.03]" />
        
        {/* Сетка точек */}
        <div 
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />

        {/* Контент */}
        <div className="relative z-10 text-center">
          <div className="w-32 h-32 mx-auto rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-8 shadow-2xl overflow-hidden p-3">
            <img
              src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg"
              alt="IMPERIA PROMO"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3">ИМПЕРИЯ</h1>
          <p className="text-white/50 text-sm tracking-widest uppercase font-medium mb-12">Промо платформа</p>
          
          <div className="space-y-4 text-left">
            {[
              { icon: '📊', title: 'Аналитика в реальном времени', desc: 'Статистика и доход по всем промоутерам' },
              { icon: '💬', title: 'Встроенный чат', desc: 'Быстрая коммуникация с командой' },
              { icon: '🤖', title: 'Telegram-бот', desc: 'Уведомления и управление через бот' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <span className="text-2xl mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-white/50 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Правая панель — форма */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8f9fc] p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Мобильный логотип */}
          <div className="flex lg:hidden items-center justify-center mb-8 gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#001f54] flex items-center justify-center overflow-hidden p-1.5">
              <img
                src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg"
                alt="IMPERIA PROMO"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-2xl font-black text-[#001f54] tracking-tight">ИМПЕРИЯ</span>
          </div>

          {/* Заголовок */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-[#001f54] tracking-tight">
              {isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
            </h2>
            <p className="text-gray-500 mt-1.5 text-sm">
              {isLogin ? 'Войдите, чтобы продолжить работу' : 'Заполните данные для регистрации'}
            </p>
          </div>

          {/* Таб переключатель */}
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-8 shadow-sm">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                isLogin
                  ? 'bg-[#001f54] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#001f54]'
              }`}
            >
              Войти
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                !isLogin
                  ? 'bg-[#001f54] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#001f54]'
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
    </div>
  );
}
