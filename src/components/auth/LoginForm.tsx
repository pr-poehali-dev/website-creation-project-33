import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
  hideToggle?: boolean;
}

export default function LoginForm({ onToggleMode, hideToggle }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [code2FA, setCode2FA] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, verify2FA } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      setLoading(false);
    } else if (result.requires_2fa) {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#001f54]/10 rounded-2xl mb-4">
            <Icon name="Shield" size={28} className="text-[#001f54]" />
          </div>
          <h3 className="text-lg font-bold text-[#001f54] mb-1">
            Двухфакторная аутентификация
          </h3>
          <p className="text-sm text-gray-500">
            Код отправлен в Telegram
          </p>
        </div>

        <form onSubmit={handle2FASubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-gray-700 font-medium text-sm">
              Код подтверждения
            </Label>
            <Input
              id="code"
              type="text"
              value={code2FA}
              onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="h-14 bg-gray-50 border-gray-200 text-[#001f54] placeholder:text-gray-300 focus:border-[#001f54] focus:ring-[#001f54]/10 text-center tracking-[0.5em] text-2xl font-bold rounded-xl"
              placeholder="——————"
              maxLength={6}
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-[#001f54] hover:bg-[#002b6b] text-white font-semibold h-12 rounded-xl transition-all duration-200 shadow-md shadow-[#001f54]/20 text-sm" 
            disabled={loading || code2FA.length !== 6}
          >
            {loading ? (
              <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Проверка...</>
            ) : (
              <><Icon name="Check" size={16} className="mr-2" />Подтвердить</>
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
            className="w-full text-gray-500 hover:text-[#001f54] hover:bg-gray-50 rounded-xl h-10 text-sm"
          >
            <Icon name="ArrowLeft" size={14} className="mr-2" />
            Назад
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-1.5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
              Email
            </Label>
            <div className="relative">
              <Icon 
                name="Mail" 
                size={16} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" 
              />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-gray-50 border-gray-200 text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/10 rounded-xl text-sm transition-all duration-200 hover:border-gray-300 focus:scale-[1.01]"
                placeholder=""
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5 animate-fade-up" style={{ animationDelay: '0.12s' }}>
            <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
              Пароль
            </Label>
            <div className="relative">
              <Icon 
                name="Lock" 
                size={16} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" 
              />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/10 rounded-xl text-sm transition-all duration-200 hover:border-gray-300 focus:scale-[1.01]"
                placeholder=""
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#001f54] transition-colors duration-200"
                tabIndex={-1}
              >
                <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl animate-fade-down">
            <Icon name="AlertCircle" size={16} />
            {error}
          </div>
        )}

        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <Button 
            type="submit" 
            className="w-full bg-[#001f54] hover:bg-[#002b6b] active:scale-[0.98] text-white font-semibold h-12 rounded-xl transition-all duration-200 shadow-md shadow-[#001f54]/20 hover:shadow-lg hover:shadow-[#001f54]/30 text-sm" 
            disabled={loading}
          >
            {loading ? (
              <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Вход...</>
            ) : (
              'Войти'
            )}
          </Button>
        </div>
      </form>

      {!hideToggle && (
        <div className="mt-5 text-center">
          <Button 
            variant="ghost" 
            onClick={onToggleMode}
            className="text-[#001f54] hover:text-[#002b6b] hover:bg-[#001f54]/5 transition-all rounded-xl text-sm h-10"
          >
            <Icon name="UserPlus" size={14} className="mr-2" />
            Зарегистрироваться
          </Button>
        </div>
      )}
    </div>
  );
}