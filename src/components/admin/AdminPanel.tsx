import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import StatsOverview from './StatsOverview';
import PromotersList from './PromotersList';
import AdminChat from './AdminChat';

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e8eef5]">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white border-4 border-[#001f54] overflow-hidden flex items-center justify-center p-3 shadow-xl">
              <img 
                src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg" 
                alt="IMPERIA PROMO"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#001f54]">Админ панель</h1>
              <p className="text-sm text-gray-600">Добро пожаловать, {user?.name}</p>
            </div>
          </div>
          <Button 
            onClick={logout} 
            className="bg-[#001f54] hover:bg-[#002b6b] text-white"
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg">
            <TabsTrigger value="stats" className="data-[state=active]:bg-[#001f54] data-[state=active]:text-white">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="promoters" className="data-[state=active]:bg-[#001f54] data-[state=active]:text-white">
              <Icon name="Users" size={16} className="mr-2" />
              Промоутеры
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-[#001f54] data-[state=active]:text-white">
              <Icon name="MessageCircle" size={16} className="mr-2" />
              Чат
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <StatsOverview />
          </TabsContent>

          <TabsContent value="promoters">
            <PromotersList />
          </TabsContent>

          <TabsContent value="chat">
            <AdminChat />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}