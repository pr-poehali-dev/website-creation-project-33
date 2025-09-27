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
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(email, password);
    
    if (!success) {
      setError('Неверный email или пароль');
    }
    
    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-black font-medium">
              Email
            </Label>
            <div className="relative">
              <Icon 
                name="Mail" 
                size={20} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white border-gray-200 text-black placeholder:text-gray-400 focus:border-black focus:ring-black/30"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-black font-medium">
              Пароль
            </Label>
            <div className="relative">
              <Icon 
                name="Lock" 
                size={20} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-white border-gray-200 text-black placeholder:text-gray-400 focus:border-black focus:ring-black/30"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-gray-50 border border-gray-200 text-black text-sm text-center p-3 rounded-lg">
            <Icon name="AlertCircle" size={16} className="inline mr-2" />
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-sm" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
              Вход...
            </>
          ) : (
            <>
              <Icon name="LogIn" size={20} className="mr-2" />
              Войти
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-blue-600 mb-2">Нет аккаунта?</p>
        <Button 
          variant="ghost" 
          onClick={onToggleMode}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-300"
        >
          <Icon name="UserPlus" size={16} className="mr-2" />
          Зарегистрироваться
        </Button>
      </div>
    </div>
  );
}