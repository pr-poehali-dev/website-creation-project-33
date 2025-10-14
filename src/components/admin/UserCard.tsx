import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from './types';
import { formatLastSeen } from '@/utils/timeFormat';

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
  return (
    <div 
      className="border-2 border-white/10 rounded-xl p-3 md:p-4 hover:bg-white/5 transition-all duration-300 cursor-pointer bg-white/5 shadow-md hover:shadow-xl hover:scale-[1.01]"
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
              <Badge className="bg-white/10 text-white border border-white/20 px-1.5 py-0.5 text-xs shadow-sm">
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
                  className="w-full max-w-48 border-2 border-white/20 bg-white/5 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 text-sm md:text-base"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      onUpdateName();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="font-medium text-white text-base md:text-lg truncate">{user.name}</span>
              )}
            </div>
            <div className="text-sm text-white/70 truncate">{user.email}</div>
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>
                {user.is_online 
                  ? 'Онлайн сейчас' 
                  : `Был(а) онлайн: ${formatLastSeen(user.last_seen)}`
                }
              </span>
              <Badge className={`ml-2 px-1.5 py-0.5 text-xs font-medium ${
                user.is_online 
                  ? 'bg-white/10 text-green-400 border border-green-400/30' 
                  : 'bg-white/5 text-white/70 border border-white/10'
              }`}>
                {user.lead_count} лидов
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 flex-shrink-0">
          {isSelected && (
            <Icon name="ChevronDown" size={16} className="text-white/50 md:mr-2" />
          )}
          
          <div className="flex gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <>
                <Button 
                  size="sm" 
                  onClick={onUpdateName}
                  disabled={!editName.trim()}
                  className="glass-button bg-white/10 hover:bg-white/20 text-white px-2 md:px-3 py-1 h-8 shadow-md transition-all duration-300 hover:scale-105"
                >
                  <Icon name="Check" size={12} className="md:w-[14px] md:h-[14px]" />
                </Button>
                <Button 
                  size="sm" 
                  onClick={onCancelEdit}
                  className="border-2 border-[#001f54]/20 text-[#001f54] hover:bg-[#001f54]/5 px-2 md:px-3 py-1 h-8 transition-all duration-300"
                  variant="ghost"
                >
                  <Icon name="X" size={12} className="md:w-[14px] md:h-[14px]" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="sm" 
                  onClick={onStartEdit}
                  disabled={user.is_admin}
                  className="border-2 border-[#001f54]/20 text-[#001f54] hover:bg-[#001f54]/5 px-2 md:px-3 py-1 h-8 transition-all duration-300"
                  variant="ghost"
                >
                  <Icon name="Edit" size={12} className="md:w-[14px] md:h-[14px]" />
                </Button>
                {!user.is_admin && (
                  <Button 
                    size="sm" 
                    onClick={onDeleteUser}
                    className="border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 px-2 md:px-3 py-1 h-8 transition-all duration-300"
                    variant="ghost"
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