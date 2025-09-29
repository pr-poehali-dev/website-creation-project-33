import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Logo from '@/components/ui/logo';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Логотип и заголовок */}
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center" />
          <div className="mt-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isLogin ? 'Добро пожаловать' : 'Создание аккаунта'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? 'Войдите в систему управления' 
                : 'Зарегистрируйтесь для доступа к системе'
              }
            </p>
          </div>
        </div>

        {/* Основная карточка */}
        <Card className="border-border shadow-lg bg-card">
          <CardHeader className="pb-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">
                {isLogin ? 'Авторизация' : 'Регистрация'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin 
                  ? 'Введите свои учетные данные'
                  : 'Заполните форму для создания аккаунта'
                }
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLogin ? (
              <LoginForm onToggleMode={toggleMode} />
            ) : (
              <RegisterForm onToggleMode={toggleMode} />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 Admin Panel System. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
}