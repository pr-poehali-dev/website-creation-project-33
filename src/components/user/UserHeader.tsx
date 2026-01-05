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
      <div className="md:hidden mb-6 bg-teal-900 border-2 border-yellow-400/80 p-4 rounded-xl relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://cdn.poehali.dev/files/SL-070821-44170-88-scaled-1.jpg" 
            alt="" 
            className="w-full h-full object-cover object-center scale-[1.5]"
          />
        </div>
        
        {selectedOrganization ? (
          <>
            {/* With Organization Selected - Year on left, buttons on right */}
            <div className="flex items-center justify-between relative z-10">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                2026
              </h1>
              <div className="flex gap-1">
                {onChangeOrganization && (
                  <Button 
                    onClick={onChangeOrganization}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 px-2 py-1.5 h-8"
                    size="sm"
                    variant="outline"
                  >
                    <Icon name="RefreshCw" size={14} className="text-white" />
                  </Button>
                )}
                <Button 
                  onClick={onOpenAI} 
                  className="bg-purple-600/40 hover:bg-purple-600/60 backdrop-blur-sm text-white border-2 border-yellow-400/80 px-2 py-1.5 h-8"
                  size="sm"
                >
                  <Icon name="Sparkles" size={14} className="text-white" />
                </Button>
                <Button 
                  onClick={onOpenSchedule} 
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 px-2 py-1.5 h-8"
                  size="sm"
                  variant="outline"
                >
                  <Icon name="Calendar" size={14} className="text-white" />
                </Button>
                <Button 
                  onClick={onLogout} 
                  className="bg-red-600/40 hover:bg-red-600/60 backdrop-blur-sm text-white border-2 border-yellow-400/80 px-2 py-1.5 h-8"
                  size="sm"
                >
                  <Icon name="LogOut" size={14} className="text-white" />
                </Button>
              </div>
            </div>
            </>
          ) : (
            <>
              {/* Without Organization - Centered Title and Buttons */}
              <div className="flex flex-col items-center gap-3 relative z-10">
                <h1 className="text-xl font-bold text-white drop-shadow-lg">
                  С Новым Годом!
                </h1>
                <div className="flex gap-2">
                  <Button 
                    onClick={onOpenAI} 
                    className="bg-purple-600/40 hover:bg-purple-600/60 backdrop-blur-sm text-white border-2 border-yellow-400/80 px-3 py-2"
                    size="sm"
                  >
                    <Icon name="Sparkles" size={16} className="text-white" />
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
            </>
          )}
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
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl relative px-3"
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
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl px-3"
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
            className="bg-purple-600/40 hover:bg-purple-600/60 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl px-3"
            size="sm"
          >
            <Icon name="Sparkles" size={18} className="text-white" />
          </Button>
          <Button 
            onClick={onOpenSchedule} 
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl px-3"
            variant="outline"
            size="sm"
          >
            <Icon name="Calendar" size={18} className="text-white" />
          </Button>
          <Button 
            onClick={onLogout} 
            className="bg-red-600/40 hover:bg-red-600/60 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl px-3"
            size="sm"
          >
            <Icon name="LogOut" size={18} className="text-white" />
          </Button>
        </div>
      </div>
    </>
  );
}