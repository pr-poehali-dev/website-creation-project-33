import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
}

export default function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [code2FA, setCode2FA] = useState('');
  
  const { login, verify2FA } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      // Вход успешен
      setLoading(false);
    } else if (result.requires_2fa) {
      // Требуется 2FA
      setRequires2FA(true);
      setUserId(result.user_id);
      setError('');
      setLoading(false);
    } else {
      setError(result.error || 'Неверный email или пароль');
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!userId) {
      setError('Ошибка: не найден ID пользователя');
      setLoading(false);
      return;
    }

    const success = await verify2FA(userId, code2FA);
    
    if (!success) {
      setError('Неверный код подтверждения');
    }
    
    setLoading(false);
  };

  if (requires2FA) {
    return (
      <div>
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#001f54]/10 rounded-full mb-4">
            <Icon name="Shield" size={32} className="text-[#001f54]" />
          </div>
          <h3 className="text-lg font-semibold text-[#001f54] mb-2">
            Двухфакторная аутентификация
          </h3>
          <p className="text-sm text-gray-600">
            Код отправлен в Telegram
          </p>
        </div>

        <form onSubmit={handle2FASubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-[#001f54] font-medium text-sm md:text-base">
              Код подтверждения
            </Label>
            <div className="relative">
              <Icon 
                name="Key" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 md:w-5 md:h-5" 
              />
              <Input
                id="code"
                type="text"
                value={code2FA}
                onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="pl-10 bg-white border-gray-200 text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/20 h-12 md:h-auto text-base text-center tracking-widest text-2xl font-bold"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm text-center p-3 rounded-lg">
              <Icon name="AlertCircle" size={16} className="inline mr-2" />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-[#001f54] hover:bg-[#002b6b] text-white font-semibold py-3 md:py-3 rounded-lg transition-all duration-300 shadow-lg h-12 md:h-auto text-base" 
            disabled={loading || code2FA.length !== 6}
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={18} className="mr-2 animate-spin md:w-5 md:h-5" />
                Проверка...
              </>
            ) : (
              <>
                <Icon name="Check" size={18} className="mr-2 md:w-5 md:h-5" />
                Подтвердить
              </>
            )}
          </Button>

          <Button 
            type="button"
            variant="ghost"
            onClick={() => {
              setRequires2FA(false);
              setCode2FA('');
              setError('');
            }}
            className="w-full text-[#001f54] hover:bg-[#001f54]/5"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#001f54] font-medium text-sm md:text-base">
              Email
            </Label>
            <div className="relative">
              <Icon 
                name="Mail" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 md:w-5 md:h-5" 
              />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white border-gray-200 text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/20 h-12 md:h-auto text-base"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#001f54] font-medium text-sm md:text-base">
              Пароль
            </Label>
            <div className="relative">
              <Icon 
                name="Lock" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 md:w-5 md:h-5" 
              />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-white border-gray-200 text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/20 h-12 md:h-auto text-base"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm text-center p-3 rounded-lg">
            <Icon name="AlertCircle" size={16} className="inline mr-2" />
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-[#001f54] hover:bg-[#002b6b] text-white font-semibold py-3 md:py-3 rounded-lg transition-all duration-300 shadow-lg h-12 md:h-auto text-base" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Icon name="Loader2" size={18} className="mr-2 animate-spin md:w-5 md:h-5" />
              Вход...
            </>
          ) : (
            <>
              <Icon name="LogIn" size={18} className="mr-2 md:w-5 md:h-5" />
              Войти
            </>
          )}
        </Button>
      </form>

      <div className="mt-4 md:mt-6 text-center">
        <p className="text-[#001f54] mb-2 text-sm md:text-base">Нет аккаунта?</p>
        <Button 
          variant="ghost" 
          onClick={onToggleMode}
          className="text-[#001f54] hover:text-[#002b6b] hover:bg-[#001f54]/5 transition-all duration-300 h-10 md:h-auto text-sm md:text-base"
        >
          <Icon name="UserPlus" size={16} className="mr-2" />
          Зарегистрироваться
        </Button>
      </div>
    </div>
  );
}