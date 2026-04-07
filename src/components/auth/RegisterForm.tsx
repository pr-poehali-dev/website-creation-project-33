import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

const TRAINING_API = 'https://functions.poehali.dev/1401561e-4d80-430c-87e9-7e8252e0a9b9';

interface RegisterFormProps {
  onToggleMode: () => void;
  hideToggle?: boolean;
}

export default function RegisterForm({ onToggleMode, hideToggle }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [seniors, setSeniors] = useState<{ id: number; name: string }[]>([]);
  const [selectedSeniorId, setSelectedSeniorId] = useState<number | ''>('');
  
  const { register } = useAuth();

  useEffect(() => {
    fetch(`${TRAINING_API}?action=get_seniors`)
      .then(r => r.json())
      .then(d => {
        if (d.seniors) setSeniors(d.seniors);
      })
      .catch(() => {});
  }, []);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const result = await register(email, password, fullName, selectedSeniorId !== '' ? selectedSeniorId : undefined);
    
    if (result === 'pending') {
      setPendingApproval(true);
    } else if (result === true) {
      // Успешная регистрация
    } else if (typeof result === 'object' && result.error) {
      setError(result.error);
    } else {
      setError('Ошибка регистрации');
    }
    
    setLoading(false);
  };

  if (pendingApproval) {
    return (
      <div className="animate-fade-up">
        {/* Иконка */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-[#001f54] flex items-center justify-center shadow-lg shadow-[#001f54]/30">
              <Icon name="SendHorizonal" size={32} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center shadow-md">
              <Icon name="Check" size={14} className="text-white" />
            </div>
          </div>
        </div>

        {/* Текст */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-[#001f54] mb-2">Заявка отправлена</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Администратор рассмотрит вашу заявку и откроет доступ. Ожидайте уведомления.
          </p>
        </div>



        <Button
          onClick={onToggleMode}
          className="w-full bg-[#001f54] hover:bg-[#002b6b] text-white font-semibold h-12 rounded-xl transition-all duration-200 shadow-md shadow-[#001f54]/20 text-sm"
        >
          Вернуться к входу
        </Button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">

          {/* Имя и Фамилия */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-[#001f54] font-medium text-sm md:text-base">
                Имя
              </Label>
              <div className="relative">
                <Icon 
                  name="User" 
                  size={18} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-10 bg-white border-gray-200 text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/20 h-12 md:h-auto text-base"
                  placeholder=""
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-[#001f54] font-medium text-sm md:text-base">
                Фамилия
              </Label>
              <div className="relative">
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-white border-gray-200 text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/20 h-12 md:h-auto text-base"
                  placeholder=""
                  required
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#001f54] font-medium text-sm md:text-base">
              Email
            </Label>
            <div className="relative">
              <Icon 
                name="Mail" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white border-gray-200 text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/20 h-12 md:h-auto text-base"
                placeholder=""
                autoComplete="off"
                required
              />
            </div>
          </div>
          
          {/* Старший */}
          {seniors.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="senior" className="text-[#001f54] font-medium text-sm md:text-base">
                Старший
              </Label>
              <div className="relative">
                <Icon name="UserCheck" size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                <select
                  id="senior"
                  value={selectedSeniorId}
                  onChange={(e) => setSelectedSeniorId(e.target.value !== '' ? Number(e.target.value) : '')}
                  className="w-full pl-10 pr-4 h-12 md:h-auto bg-white border border-gray-200 rounded-md text-[#001f54] text-base focus:outline-none focus:border-[#001f54] focus:ring-2 focus:ring-[#001f54]/20 appearance-none cursor-pointer"
                >
                  <option value="">Выберите старшего</option>
                  {seniors.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <Icon name="ChevronDown" size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Пароль */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#001f54] font-medium text-sm md:text-base">
              Пароль
            </Label>
            <div className="relative">
              <Icon 
                name="Lock" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-white border-gray-200 text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/20 h-12 md:h-auto text-base"
                placeholder=""
                required
                minLength={6}
              />
            </div>

          </div>

          {/* Повторите пароль */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[#001f54] font-medium text-sm md:text-base">
              Повторите пароль
            </Label>
            <div className="relative">
              <Icon 
                name="Lock" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`pl-10 pr-10 bg-white text-[#001f54] placeholder:text-gray-400 h-12 md:h-auto text-base transition-all duration-300 ${
                  passwordsMatch
                    ? 'border-green-400 focus:border-green-500 focus:ring-green-500/20'
                    : passwordsMismatch
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-200 focus:border-[#001f54] focus:ring-[#001f54]/20'
                }`}
                placeholder=""
                required
              />
              {confirmPassword.length > 0 && (
                <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                  passwordsMatch ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}>
                  <Icon name="CheckCircle2" size={18} className="text-green-500" />
                </div>
              )}
              {passwordsMismatch && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 opacity-100 scale-100">
                  <Icon name="XCircle" size={18} className="text-red-400" />
                </div>
              )}
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
          className="w-full bg-[#001f54] hover:bg-[#002b6b] text-white font-semibold h-12 rounded-xl transition-all duration-200 shadow-md shadow-[#001f54]/20 text-sm" 
          disabled={loading || passwordsMismatch}
        >
          {loading ? (
            <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Регистрация...</>
          ) : (
            'Зарегистрироваться'
          )}
        </Button>
      </form>

      {!hideToggle && (
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
      )}
    </div>
  );
}