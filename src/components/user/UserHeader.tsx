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
  organizationName?: string;
  todayContacts?: number;
  totalContacts?: number;
}

export default function UserHeader({ 
  onLogout, 
  onOpenChat, 
  onOpenAI, 
  onOpenSchedule,
  onChangeOrganization,
  unreadCount,
  groupUnreadCount,
  selectedOrganization,
  organizationName,
  todayContacts,
  totalContacts
}: UserHeaderProps) {
  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden mb-6 bg-green-800 border-2 border-pink-300/60 p-4 rounded-xl relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://cdn.poehali.dev/projects/84906f5f-7ef4-49e5-9a56-bd61e788e7bd/files/5ec1d6ec-8fb2-46f5-b8cf-c5cf727a7309.jpg" 
            alt="" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-pink-200/20 to-green-800/50" />
        
        {selectedOrganization ? (
          <>
            {/* With Organization Selected - Year in center, buttons on right */}
            <div className="flex items-center justify-end relative z-10">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg absolute left-[27%] transform -translate-x-1/2">
                2026
              </h1>
              <div className="flex gap-1">
                {onChangeOrganization && (
                  <Button 
                    onClick={onChangeOrganization}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-pink-300/60 px-2 py-1.5 h-8"
                    size="sm"
                    variant="outline"
                  >
                    <Icon name="RefreshCw" size={14} className="text-white" />
                  </Button>
                )}
                <Button 
                  onClick={onOpenAI} 
                  className="bg-purple-600/40 hover:bg-purple-600/60 backdrop-blur-sm text-white border-2 border-pink-300/60 px-2 py-1.5 h-8"
                  size="sm"
                >
                  <Icon name="Sparkles" size={14} className="text-white" />
                </Button>
                <Button 
                  onClick={onOpenSchedule} 
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-pink-300/60 px-2 py-1.5 h-8"
                  size="sm"
                  variant="outline"
                >
                  <Icon name="Calendar" size={14} className="text-white" />
                </Button>
                <Button 
                  onClick={onLogout} 
                  className="bg-red-600/40 hover:bg-red-600/60 backdrop-blur-sm text-white border-2 border-pink-300/60 px-2 py-1.5 h-8"
                  size="sm"
                >
                  <Icon name="LogOut" size={14} className="text-white" />
                </Button>
              </div>
            </div>
            </>
          ) : (
            <>
              {/* Without Organization - Logo left, Buttons right */}
              <div className="flex items-center justify-between w-full relative z-10">
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white drop-shadow-lg leading-tight tracking-wide">ИМПЕРИЯ</span>
                  <span className="text-xs text-white/80 drop-shadow leading-tight">рекламное агентство</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={onOpenAI} 
                    className="bg-purple-600/40 hover:bg-purple-600/60 backdrop-blur-sm text-white border-2 border-pink-300/60 px-3 py-2"
                    size="sm"
                  >
                    <Icon name="Sparkles" size={16} className="text-white" />
                  </Button>
                  <Button 
                    onClick={onOpenSchedule} 
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-pink-300/60 px-3 py-2"
                    size="sm"
                    variant="outline"
                  >
                    <Icon name="Calendar" size={16} className="text-white" />
                  </Button>
                  <Button 
                    onClick={onLogout} 
                    className="bg-red-600/40 hover:bg-red-600/60 backdrop-blur-sm text-white border-2 border-pink-300/60 px-3 py-2"
                    size="sm"
                  >
                    <Icon name="LogOut" size={16} className="text-white" />
                  </Button>
                </div>
              </div>
            </>
          )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-center items-center mb-8 bg-green-800 border-2 border-pink-300/60 p-6 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://cdn.poehali.dev/projects/84906f5f-7ef4-49e5-9a56-bd61e788e7bd/files/5ec1d6ec-8fb2-46f5-b8cf-c5cf727a7309.jpg" 
            alt="" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-pink-200/20 to-green-900/50" />
        <div className="flex flex-col absolute left-6 z-10">
          <span className="text-3xl font-bold text-white drop-shadow-2xl tracking-widest leading-tight">ИМПЕРИЯ</span>
          <span className="text-sm text-white/85 drop-shadow leading-tight">рекламное агентство</span>
        </div>
        <div className="flex items-center gap-3 absolute right-6 z-10">
          {selectedOrganization && (
            <>
              <Button 
                onClick={onOpenChat} 
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-pink-300/60 shadow-xl relative px-3"
                variant="outline"
                size="sm"
              >
                <Icon name="MessageCircle" size={18} className="text-white" />
                {(unreadCount + groupUnreadCount) > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 min-w-[20px] bg-red-500 hover:bg-red-500 text-white text-xs px-1">
                    {unreadCount + groupUnreadCount}
                  </Badge>
                )}
              </Button>
              {onChangeOrganization && (
                <Button 
                  onClick={onChangeOrganization}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-pink-300/60 shadow-xl px-3"
                  variant="outline"
                  size="sm"
                >
                  <Icon name="RefreshCw" size={18} className="text-white" />
                </Button>
              )}
            </>
          )}
          <Button 
            onClick={onOpenAI} 
            className="bg-purple-600/40 hover:bg-purple-600/60 backdrop-blur-sm text-white border-2 border-pink-300/60 shadow-xl px-3"
            size="sm"
          >
            <Icon name="Sparkles" size={18} className="text-white" />
          </Button>
          <Button 
            onClick={onOpenSchedule} 
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-pink-300/60 shadow-xl px-3"
            variant="outline"
            size="sm"
          >
            <Icon name="Calendar" size={18} className="text-white" />
          </Button>
          <Button 
            onClick={onLogout} 
            className="bg-red-600/40 hover:bg-red-600/60 backdrop-blur-sm text-white border-2 border-pink-300/60 shadow-xl px-3"
            size="sm"
          >
            <Icon name="LogOut" size={18} className="text-white" />
          </Button>
        </div>
      </div>
    </>
  );
}