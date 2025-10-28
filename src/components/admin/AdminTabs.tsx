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
import AccountingTab from './AccountingTab';

interface AdminTabsProps {
  unreadCount: number;
  sessionToken: string;
}

export default function AdminTabs({ unreadCount, sessionToken }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="flex w-full admin-card h-12 md:h-14 p-1 overflow-x-auto overflow-y-hidden gap-1 scrollbar-thin">
        <TabsTrigger 
          value="pending" 
          className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm rounded-lg font-medium flex-1 whitespace-nowrap justify-center"
          title="Заявки"
        >
          <Icon name="UserCheck" size={16} />
          <span className="hidden lg:inline">Заявки</span>
        </TabsTrigger>
        <TabsTrigger 
          value="users" 
          className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm rounded-lg font-medium flex-1 whitespace-nowrap justify-center"
          title="Пользователи"
        >
          <Icon name="Users" size={16} />
          <span className="hidden lg:inline">Пользователи</span>
        </TabsTrigger>
        <TabsTrigger 
          value="stats" 
          className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm rounded-lg font-medium flex-1 whitespace-nowrap justify-center"
          title="Рейтинг"
        >
          <Icon name="BarChart3" size={16} />
          <span className="hidden lg:inline">Рейтинг</span>
        </TabsTrigger>
        <TabsTrigger 
          value="accounting" 
          className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm rounded-lg font-medium flex-1 whitespace-nowrap justify-center"
          title="Бух.учет"
        >
          <Icon name="Calculator" size={16} />
          <span className="hidden lg:inline">Бух.учет</span>
        </TabsTrigger>
        <TabsTrigger 
          value="organizations" 
          className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm rounded-lg font-medium flex-1 whitespace-nowrap justify-center"
          title="Организации"
        >
          <Icon name="Building2" size={16} />
          <span className="hidden lg:inline">Организации</span>
        </TabsTrigger>
        <TabsTrigger 
          value="archive" 
          className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm rounded-lg font-medium flex-1 whitespace-nowrap justify-center"
          title="Архив"
        >
          <Icon name="Archive" size={16} />
          <span className="hidden lg:inline">Архив</span>
        </TabsTrigger>
        <TabsTrigger 
          value="chat" 
          className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all text-xs md:text-sm relative rounded-lg font-medium flex-1 whitespace-nowrap justify-center"
          title="Чат"
        >
          <Icon name="MessageCircle" size={16} />
          <span className="hidden lg:inline">Чат</span>
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

      <TabsContent value="accounting">
        <AccountingTab enabled={activeTab === 'accounting'} />
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