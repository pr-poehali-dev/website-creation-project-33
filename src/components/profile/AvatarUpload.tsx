import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import UserAvatar from '@/components/chat/UserAvatar';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

const AVATAR_API_URL = 'https://functions.poehali.dev/e9c7d677-8995-448a-82e4-ff8cf0409d05';

export default function AvatarUpload({ currentAvatarUrl, userName, onAvatarUpdate }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, выберите изображение',
        variant: 'destructive'
      });
      return;
    }

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ошибка',
        description: 'Размер файла не должен превышать 5MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      // Конвертируем в base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Убираем префикс data:image/...;base64,

        // Отправляем на сервер
        const sessionToken = localStorage.getItem('session_token');
        const response = await fetch(AVATAR_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken || ''
          },
          body: JSON.stringify({
            image: base64Data,
            content_type: file.type
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setAvatarUrl(data.avatar_url);
          onAvatarUpdate(data.avatar_url);
          toast({
            title: 'Успешно',
            description: 'Аватарка обновлена'
          });
        } else {
          throw new Error(data.error || 'Ошибка загрузки');
        }
      };

      reader.onerror = () => {
        throw new Error('Ошибка чтения файла');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить аватарку',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Удалить аватарку?')) return;

    setIsUploading(true);

    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(AVATAR_API_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAvatarUrl(null);
        onAvatarUpdate('');
        toast({
          title: 'Успешно',
          description: 'Аватарка удалена'
        });
      } else {
        throw new Error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить аватарку',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <UserAvatar 
        name={userName} 
        avatarUrl={avatarUrl}
        size={120}
      />
      
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          size="sm"
          className="gap-2"
        >
          <Icon name={isUploading ? "Loader2" : "Upload"} size={16} className={isUploading ? "animate-spin" : ""} />
          {isUploading ? 'Загрузка...' : 'Изменить'}
        </Button>
        
        {avatarUrl && (
          <Button
            onClick={handleDeleteAvatar}
            disabled={isUploading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Icon name="Trash2" size={16} />
            Удалить
          </Button>
        )}
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        JPG, PNG или GIF. Максимум 5MB
      </p>
    </div>
  );
}
