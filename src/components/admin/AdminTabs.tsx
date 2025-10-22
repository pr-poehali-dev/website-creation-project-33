import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import UsersTab from './UsersTab';
import StatsTab from './StatsTab';
import PendingUsers from './PendingUsers';
import AllUsersWorkTime from './AllUsersWorkTime';
import AdminChatTab from './AdminChatTab';
import OrganizationsTab from './OrganizationsTab';
import ArchiveTab from './ArchiveTab';

interface AdminTabsProps {
  unreadCount: number;
  sessionToken: string;
}

export default function AdminTabs({ unreadCount, sessionToken }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-6 admin-card h-12 md:h-14 p-1">
        <TabsTrigger 
          value="pending" 
          className="flex items-center gap-1 md:gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm rounded-lg font-medium"
        >
          <Icon name="UserCheck" size={14} className="md:w-[16px] md:h-[16px]" />
          <span className="hidden sm:inline">Заявки</span>
          <span className="sm:hidden">Заяв.</span>
        </TabsTrigger>
        <TabsTrigger 
          value="users" 
          className="flex items-center gap-1 md:gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm rounded-lg font-medium"
        >
          <Icon name="Users" size={14} className="md:w-[16px] md:h-[16px]" />
          <span className="hidden sm:inline">Пользователи</span>
          <span className="sm:hidden">Польз.</span>
        </TabsTrigger>
        <TabsTrigger 
          value="stats" 
          className="flex items-center gap-1 md:gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm rounded-lg font-medium"
        >
          <Icon name="BarChart3" size={14} className="md:w-[16px] md:h-[16px]" />
          <span className="hidden sm:inline">Рейтинг</span>
          <span className="sm:hidden">Рейт.</span>
        </TabsTrigger>
        <TabsTrigger 
          value="organizations" 
          className="flex items-center gap-1 md:gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm rounded-lg font-medium"
        >
          <Icon name="Building2" size={14} className="md:w-[16px] md:h-[16px]" />
          <span className="hidden sm:inline">Организации</span>
          <span className="sm:hidden">Орг.</span>
        </TabsTrigger>
        <TabsTrigger 
          value="archive" 
          className="flex items-center gap-1 md:gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm rounded-lg font-medium"
        >
          <Icon name="Archive" size={14} className="md:w-[16px] md:h-[16px]" />
          <span className="hidden sm:inline">Архив</span>
          <span className="sm:hidden">Арх.</span>
        </TabsTrigger>
        <TabsTrigger 
          value="chat" 
          className="flex items-center gap-1 md:gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm relative rounded-lg font-medium"
        >
          <Icon name="MessageCircle" size={14} className="md:w-[16px] md:h-[16px]" />
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
        <div className="space-y-6">
          <PendingUsers sessionToken={sessionToken} />
          <AllUsersWorkTime sessionToken={sessionToken} />
        </div>
      </TabsContent>

      <TabsContent value="users">
        <UsersTab enabled={activeTab === 'users'} />
      </TabsContent>

      <TabsContent value="stats">
        <StatsTab enabled={activeTab === 'stats'} />
      </TabsContent>

      <TabsContent value="organizations">
        <OrganizationsTab enabled={activeTab === 'organizations'} />
      </TabsContent>

      <TabsContent value="archive">
        <ArchiveTab enabled={activeTab === 'archive'} sessionToken={sessionToken} />
      </TabsContent>

      <TabsContent value="chat">
        <AdminChatTab />
      </TabsContent>
    </Tabs>
  );
}