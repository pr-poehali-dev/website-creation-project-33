import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export default function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    const result = await register(email, password, name);
    
    if (result === 'pending') {
      // Отправляем данные в Google Sheets
      try {
        await fetch('https://functions.poehali.dev/ce92c4be-1721-49f2-95bb-4bafa6f05fc4', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name,
            phone: email,
            source: 'Регистрация на сайте'
          })
        });
      } catch (error) {
        console.error('Ошибка отправки в Google Sheets:', error);
      }
      
      setPendingApproval(true);
    } else if (result === true) {
      // Успешная регистрация (если вдруг не требуется одобрение)
    } else if (typeof result === 'object' && result.error) {
      setError(result.error);
    } else {
      setError('Ошибка регистрации');
    }
    
    setLoading(false);
  };

  if (pendingApproval) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
          <Icon name="Clock" size={40} className="text-amber-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-[#001f54]">Заявка отправлена!</h3>
          <p className="text-gray-600 px-4">
            Ваша заявка на регистрацию ожидает одобрения администратора. 
            Вы получите доступ после проверки.
          </p>
        </div>
        <Button
          onClick={onToggleMode}
          variant="outline"
          className="border-[#001f54] text-[#001f54] hover:bg-[#001f54]/5"
        >
          Вернуться к входу
        </Button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#001f54] font-medium text-sm md:text-base">
              Имя
            </Label>
            <div className="relative">
              <Icon 
                name="User" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 md:w-5 md:h-5" 
              />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 bg-white border-gray-200 text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/20 h-12 md:h-auto text-base"
                placeholder="Ваше имя"
                required
              />
            </div>
          </div>

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
                minLength={6}
              />
            </div>
            <p className="text-[#001f54]/70 text-xs md:text-sm">Минимум 6 символов</p>
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
              Регистрация...
            </>
          ) : (
            <>
              <Icon name="UserPlus" size={18} className="mr-2 md:w-5 md:h-5" />
              Зарегистрироваться
            </>
          )}
        </Button>
      </form>

      <div className="mt-4 md:mt-6 text-center">
        <p className="text-[#001f54] mb-2 text-sm md:text-base">Уже есть аккаунт?</p>
        <Button 
          variant="ghost" 
          onClick={onToggleMode}
          className="text-[#001f54] hover:text-[#002b6b] hover:bg-[#001f54]/5 transition-all duration-300 h-10 md:h-auto text-sm md:text-base"
        >
          <Icon name="LogIn" size={16} className="mr-2" />
          Войти
        </Button>
      </div>
    </div>
  );
}