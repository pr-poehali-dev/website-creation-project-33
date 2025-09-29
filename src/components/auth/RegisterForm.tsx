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
  const [showPassword, setShowPassword] = useState(false);
  
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
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-foreground">
              Полное имя
            </Label>
            <div className="relative">
              <Icon 
                name="User" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Иван Иванов"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email адрес
            </Label>
            <div className="relative">
              <Icon 
                name="Mail" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="user@company.com"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">
              Пароль
            </Label>
            <div className="relative">
              <Icon 
                name="Lock" 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Минимум 6 символов</p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center p-3 rounded-lg flex items-center justify-center gap-2">
            <Icon name="AlertCircle" size={16} />
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 shadow-sm" 
          disabled={loading || !email || !password || !name}
        >
          {loading ? (
            <>
              <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
              Создание аккаунта...
            </>
          ) : (
            <>
              <Icon name="UserPlus" size={18} className="mr-2" />
              Создать аккаунт
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Уже есть учетная запись?</p>
          <Button 
            variant="outline" 
            onClick={onToggleMode}
            className="w-full h-10 border-input hover:bg-accent text-foreground transition-all duration-200"
            disabled={loading}
          >
            <Icon name="LogIn" size={16} className="mr-2" />
            Войти в систему
          </Button>
        </div>
      </div>
    </div>
  );
}