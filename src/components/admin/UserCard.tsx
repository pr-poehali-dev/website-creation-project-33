import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from './types';
import { formatLastSeen } from '@/utils/timeFormat';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface UserCardProps {
  user: User;
  isSelected: boolean;
  isEditing: boolean;
  editName: string;
  onUserClick: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdateName: () => void;
  onDeleteUser: () => void;
  onEditNameChange: (name: string) => void;
}

export default function UserCard({
  user,
  isSelected,
  isEditing,
  editName,
  onUserClick,
  onStartEdit,
  onCancelEdit,
  onUpdateName,
  onDeleteUser,
  onEditNameChange,
}: UserCardProps) {
  const { user: authUser } = useAuth();
  const [uploadingQR, setUploadingQR] = useState(false);
  const [blockingUser, setBlockingUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleQRUpload = async (file: File) => {
    setUploadingQR(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        const response = await fetch('https://functions.poehali.dev/07269a27-0500-4f53-8cb2-a718a9fc7c85', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'upload',
            user_id: user.id,
            qr_image: base64Image,
            admin_id: authUser?.id
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: 'Успешно!',
            description: 'QR-код загружен'
          });
        } else {
          throw new Error(data.error || 'Ошибка загрузки');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('QR upload error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить QR-код',
        variant: 'destructive'
      });
    } finally {
      setUploadingQR(false);
    }
  };

  const handleBlockUser = async () => {
    setBlockingUser(true);
    try {
      const response = await fetch('https://functions.poehali.dev/f3c8f0dd-ab15-427b-a94e-d3ede8e8c4ba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Промоутер заблокирован',
          description: `${user.name} выкинут на страницу входа`
        });
      } else {
        throw new Error(data.error || 'Ошибка блокировки');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось заблокировать промоутера',
        variant: 'destructive'
      });
    } finally {
      setBlockingUser(false);
    }
  };

  return (
    <div 
      className="border-2 border-slate-700 rounded-xl p-3 md:p-4 hover:bg-slate-800 transition-all duration-300 cursor-pointer bg-slate-800/50 shadow-md hover:shadow-xl hover:scale-[1.01]"
      onClick={onUserClick}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {user.is_online ? (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
            ) : (
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            )}
            {user.is_admin && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 text-xs shadow-sm">
                <Icon name="Shield" size={10} className="mr-1" />
                <span className="hidden sm:inline">Админ</span>
                <span className="sm:hidden">А</span>
              </Badge>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => onEditNameChange(e.target.value)}
                  className="w-full max-w-48 border-2 border-cyan-500 bg-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-200 text-sm md:text-base"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      onUpdateName();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="font-medium text-slate-100 text-base md:text-lg truncate">{user.name}</span>
              )}
            </div>
            {user.registration_ip && (
              <p className="text-slate-500 text-xs">IP: {user.registration_ip}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 flex-shrink-0">
          {isSelected && (
            <Icon name="ChevronDown" size={16} className="text-slate-500 md:mr-2" />
          )}
          
          <div className="flex gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <>
                <Button 
                  size="sm" 
                  onClick={onUpdateName}
                  disabled={!editName.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-2 md:px-3 py-1 h-8 shadow-md transition-all duration-300 hover:scale-105"
                >
                  <Icon name="Check" size={12} className="md:w-[14px] md:h-[14px]" />
                </Button>
                <Button 
                  size="sm" 
                  onClick={onCancelEdit}
                  className="border-2 border-slate-600 text-slate-300 hover:bg-slate-700 px-2 md:px-3 py-1 h-8 transition-all duration-300"
                  variant="ghost"
                >
                  <Icon name="X" size={12} className="md:w-[14px] md:h-[14px]" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleBlockUser}
                  disabled={blockingUser || user.is_admin}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 md:px-3 py-1 h-8 transition-all duration-300"
                  title="Заблокировать промоутера"
                >
                  {blockingUser ? (
                    <Icon name="Loader2" size={12} className="md:w-[14px] md:h-[14px] animate-spin" />
                  ) : (
                    <Icon name="AlertCircle" size={12} className="md:w-[14px] md:h-[14px]" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingQR}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-2 md:px-3 py-1 h-8 transition-all duration-300"
                  title="Загрузить QR-код"
                >
                  {uploadingQR ? (
                    <Icon name="Loader2" size={12} className="md:w-[14px] md:h-[14px] animate-spin" />
                  ) : (
                    <Icon name="Plus" size={12} className="md:w-[14px] md:h-[14px]" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleQRUpload(file);
                    }
                    e.target.value = '';
                  }}
                />
                <Button 
                  size="sm" 
                  onClick={onStartEdit}
                  disabled={user.is_admin}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-2 md:px-3 py-1 h-8 transition-all duration-300"
                >
                  <Icon name="Edit" size={12} className="md:w-[14px] md:h-[14px]" />
                </Button>
                {!user.is_admin && (
                  <Button 
                    size="sm" 
                    onClick={onDeleteUser}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 md:px-3 py-1 h-8 transition-all duration-300"
                  >
                    <Icon name="Trash2" size={12} className="md:w-[14px] md:h-[14px]" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}