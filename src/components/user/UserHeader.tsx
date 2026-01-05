import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface UserHeaderProps {
  onLogout: () => void;
  onOpenChat: () => void;
  onOpenAI: () => void;
  onOpenSchedule: () => void;
  onChangeOrganization?: () => void;
  unreadCount: number;
  groupUnreadCount: number;
  selectedOrganization: number | null;
}

export default function UserHeader({ 
  onLogout, 
  onOpenChat, 
  onOpenAI, 
  onOpenSchedule,
  onChangeOrganization,
  unreadCount,
  groupUnreadCount,
  selectedOrganization
}: UserHeaderProps) {
  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden mb-6 bg-teal-900 border-2 border-yellow-400/80 p-4 rounded-xl relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://cdn.poehali.dev/files/SL-070821-44170-88-scaled-1.jpg" 
            alt="" 
            className="w-full h-full object-cover object-right scale-[2.5]"
          />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <h1 className="text-xl font-bold text-white drop-shadow-lg">
            С Новым Годом!
          </h1>
          <div className="flex gap-2">
            {selectedOrganization && (
              <>
                <Button 
                  onClick={onOpenChat} 
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 px-3 py-2 relative"
                  size="sm"
                  variant="outline"
                >
                  <Icon name="MessageCircle" size={16} className="text-white" />
                  {(unreadCount + groupUnreadCount) > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] bg-red-500 hover:bg-red-500 text-white text-xs px-1">
                      {unreadCount + groupUnreadCount}
                    </Badge>
                  )}
                </Button>
                {onChangeOrganization && (
                  <Button 
                    onClick={onChangeOrganization}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 px-3 py-2"
                    size="sm"
                    variant="outline"
                  >
                    <Icon name="RefreshCw" size={16} className="text-white" />
                  </Button>
                )}
              </>
            )}
            <Button 
              onClick={onOpenAI} 
              className="bg-purple-600/40 hover:bg-purple-600/60 backdrop-blur-sm text-white border-2 border-yellow-400/80 px-3 py-2 font-bold"
              size="sm"
            >
              AI
            </Button>
            <Button 
              onClick={onOpenSchedule} 
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 px-3 py-2"
              size="sm"
              variant="outline"
            >
              <Icon name="Calendar" size={16} className="text-white" />
            </Button>
            <Button 
              onClick={onLogout} 
              className="bg-red-600/40 hover:bg-red-600/60 backdrop-blur-sm text-white border-2 border-yellow-400/80 px-3 py-2"
              size="sm"
            >
              <Icon name="LogOut" size={16} className="text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-center items-center mb-8 bg-teal-900 border-2 border-yellow-500/80 p-6 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://cdn.poehali.dev/files/SL-070821-44170-88-scaled-1.jpg" 
            alt="" 
            className="w-full h-full object-cover object-left"
          />
        </div>
        <h1 className="text-4xl font-bold text-white relative z-10 drop-shadow-2xl">
          С Новым Годом!
        </h1>
        <div className="flex items-center gap-3 absolute right-6 z-10">
          {selectedOrganization && (
            <>
              <Button 
                onClick={onOpenChat} 
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl font-semibold relative"
                variant="outline"
              >
                <Icon name="MessageCircle" size={16} className="mr-2 text-white" />
                <span className="text-white">Чат</span>
                {(unreadCount + groupUnreadCount) > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 min-w-[20px] bg-red-500 hover:bg-red-500 text-white text-xs px-1">
                    {unreadCount + groupUnreadCount}
                  </Badge>
                )}
              </Button>
              {onChangeOrganization && (
                <Button 
                  onClick={onChangeOrganization}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl font-semibold"
                  variant="outline"
                >
                  <Icon name="RefreshCw" size={16} className="mr-2 text-white" />
                  <span className="text-white">Сменить</span>
                </Button>
              )}
            </>
          )}
          <Button 
            onClick={onOpenAI} 
            className="bg-purple-600/40 hover:bg-purple-600/60 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl font-bold"
          >
            <Icon name="Sparkles" size={16} className="mr-2" />
            AI Помощник
          </Button>
          <Button 
            onClick={onOpenSchedule} 
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl font-semibold"
            variant="outline"
          >
            <Icon name="Calendar" size={16} className="mr-2 text-white" />
            <span className="text-white">График</span>
          </Button>
          <Button 
            onClick={onLogout} 
            className="bg-red-600/40 hover:bg-red-600/60 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl font-semibold"
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </>
  );
}
