import React from 'react';
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
}: UserHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between px-1">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#001f54] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-black tracking-tight">И</span>
        </div>
        <div>
          <div className="text-base font-bold text-[#001f54] tracking-wide leading-none">ИМПЕРИЯ</div>
          <div className="text-[11px] text-gray-400 leading-none mt-0.5">рекламное агентство</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {selectedOrganization && (
          <>
            <button
              onClick={onOpenChat}
              className="relative w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Icon name="MessageCircle" size={17} className="text-gray-600" />
              {(unreadCount + groupUnreadCount) > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-[16px] bg-red-500 text-white text-[10px] px-1 leading-none">
                  {unreadCount + groupUnreadCount}
                </Badge>
              )}
            </button>
            {onChangeOrganization && (
              <button
                onClick={onChangeOrganization}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Icon name="RefreshCw" size={15} className="text-gray-600" />
              </button>
            )}
          </>
        )}
        <button
          onClick={onOpenAI}
          className="w-9 h-9 rounded-xl bg-[#001f54] hover:bg-[#002a72] flex items-center justify-center transition-colors"
        >
          <Icon name="Sparkles" size={15} className="text-white" />
        </button>
        <button
          onClick={onOpenSchedule}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <Icon name="Calendar" size={17} className="text-gray-600" />
        </button>
        <button
          onClick={onLogout}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors group"
        >
          <Icon name="LogOut" size={16} className="text-gray-500 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
    </header>
  );
}
