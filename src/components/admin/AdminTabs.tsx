import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import UsersTab from './UsersTab';
import StatsTab from './StatsTab';
import PendingUsers from './PendingUsers';
import AdminChatTab from './AdminChatTab';
import OrganizationsTab from './OrganizationsTab';

interface AdminTabsProps {
  unreadCount: number;
  sessionToken: string;
}

export default function AdminTabs({ unreadCount, sessionToken }: AdminTabsProps) {
  return (
    <Tabs defaultValue="pending" className="space-y-4 md:space-y-6">
      <TabsList className="grid w-full grid-cols-5 glass-panel h-12 md:h-14 rounded-2xl border-0">
        <TabsTrigger 
          value="pending" 
          className="flex items-center gap-1 md:gap-2 text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-base rounded-xl"
        >
          <Icon name="UserCheck" size={14} className="md:w-[18px] md:h-[18px]" />
          <span className="hidden sm:inline">Заявки</span>
          <span className="sm:hidden">Заяв.</span>
        </TabsTrigger>
        <TabsTrigger 
          value="users" 
          className="flex items-center gap-1 md:gap-2 text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-base rounded-xl"
        >
          <Icon name="Users" size={14} className="md:w-[18px] md:h-[18px]" />
          <span className="hidden sm:inline">Пользователи</span>
          <span className="sm:hidden">Польз.</span>
        </TabsTrigger>
        <TabsTrigger 
          value="stats" 
          className="flex items-center gap-1 md:gap-2 text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-base rounded-xl"
        >
          <Icon name="BarChart3" size={14} className="md:w-[18px] md:h-[18px]" />
          <span className="hidden sm:inline">Рейтинг</span>
          <span className="sm:hidden">Рейт.</span>
        </TabsTrigger>
        <TabsTrigger 
          value="organizations" 
          className="flex items-center gap-1 md:gap-2 text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-base rounded-xl"
        >
          <Icon name="Building2" size={14} className="md:w-[18px] md:h-[18px]" />
          <span className="hidden sm:inline">Организации</span>
          <span className="sm:hidden">Орг.</span>
        </TabsTrigger>
        <TabsTrigger 
          value="chat" 
          className="flex items-center gap-1 md:gap-2 text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-base relative rounded-xl"
        >
          <Icon name="MessageCircle" size={14} className="md:w-[18px] md:h-[18px]" />
          <span className="hidden sm:inline">Чат</span>
          <span className="sm:hidden">Чат</span>
          {unreadCount > 0 && (
            <Badge className="ml-1 h-5 min-w-[20px] flex items-center justify-center bg-red-500 hover:bg-red-500 text-white text-xs px-1 rounded-full">
              {unreadCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <PendingUsers sessionToken={sessionToken} />
      </TabsContent>

      <TabsContent value="users">
        <UsersTab />
      </TabsContent>

      <TabsContent value="stats">
        <StatsTab />
      </TabsContent>

      <TabsContent value="organizations">
        <OrganizationsTab />
      </TabsContent>

      <TabsContent value="chat">
        <AdminChatTab />
      </TabsContent>
    </Tabs>
  );
}
