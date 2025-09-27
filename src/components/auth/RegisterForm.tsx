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

    const success = await register(email, password, name);
    
    if (!success) {
      setError('Пользователь с таким email уже существует');
    }
    
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/90 font-medium">
              Имя
            </Label>
            <div className="relative">
              <Icon 
                name="User" 
                size={20} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" 
              />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 glass-effect border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/30"
                placeholder="Ваше имя"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/90 font-medium">
              Email
            </Label>
            <div className="relative">
              <Icon 
                name="Mail" 
                size={20} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" 
              />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 glass-effect border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/30"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/90 font-medium">
              Пароль
            </Label>
            <div className="relative">
              <Icon 
                name="Lock" 
                size={20} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" 
              />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 glass-effect border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/30"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <p className="text-white/60 text-sm">Минимум 6 символов</p>
          </div>
        </div>

        {error && (
          <div className="glass-effect border-red-400/30 bg-red-500/10 text-red-300 text-sm text-center p-3 rounded-lg">
            <Icon name="AlertCircle" size={16} className="inline mr-2" />
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full glow-button text-white font-semibold py-3 rounded-lg transition-all duration-300" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
              Регистрация...
            </>
          ) : (
            <>
              <Icon name="UserPlus" size={20} className="mr-2" />
              Зарегистрироваться
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-white/60 mb-2">Уже есть аккаунт?</p>
        <Button 
          variant="ghost" 
          onClick={onToggleMode}
          className="text-purple-300 hover:text-white hover:bg-white/10 transition-all duration-300"
        >
          <Icon name="LogIn" size={16} className="mr-2" />
          Войти
        </Button>
      </div>
    </div>
  );
}