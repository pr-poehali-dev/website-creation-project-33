import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import AvatarUpload from '@/components/profile/AvatarUpload';
import { Button } from '@/components/ui/button';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      // Загружаем текущую аватарку
      fetchCurrentAvatar();
    }
  }, [isOpen, user]);

  const fetchCurrentAvatar = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/e9c7d677-8995-448a-82e4-ff8cf0409d05', {
        method: 'GET',
        headers: {
          'X-Session-Token': sessionToken || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl || null);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Профиль</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <AvatarUpload 
            currentAvatarUrl={avatarUrl}
            userName={user.name}
            onAvatarUpdate={handleAvatarUpdate}
          />
          
          <div className="space-y-3 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Имя</p>
              <p className="font-medium">{user.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
