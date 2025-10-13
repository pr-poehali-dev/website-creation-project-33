import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import StartTab from '@/components/user/StartTab';
import WorkTab from '@/components/user/WorkTab';
import TrainingTab from '@/components/user/TrainingTab';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [selectedOrganization, setSelectedOrganization] = useState<number | null>(() => {
    const saved = localStorage.getItem('selected_organization_id');
    return saved ? parseInt(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<string>(selectedOrganization ? 'work' : 'start');

  useEffect(() => {
    if (selectedOrganization) {
      localStorage.setItem('selected_organization_id', selectedOrganization.toString());
      setActiveTab('work');
    } else {
      localStorage.removeItem('selected_organization_id');
      setActiveTab('start');
    }
  }, [selectedOrganization]);

  const handleOrganizationSelect = (orgId: number) => {
    setSelectedOrganization(orgId);
  };

  const handleChangeOrganization = () => {
    setSelectedOrganization(null);
    setActiveTab('start');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e8eef5] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Шапка с кнопкой выйти */}
        <div className="flex justify-between items-center mb-4 slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-[#001f54] overflow-hidden flex items-center justify-center p-2 shadow-lg">
              <img 
                src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg" 
                alt="IMPERIA PROMO"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-[#001f54]">IMPERIA PROMO</h1>
              <p className="text-xs md:text-sm text-gray-600">Привет, {user?.name}</p>
            </div>
          </div>
          <Button 
            onClick={logout} 
            className="bg-[#001f54] hover:bg-[#002b6b] text-white transition-all duration-300 shadow-lg hover:scale-105"
            size="sm"
          >
            <Icon name="LogOut" size={16} className="mr-1 md:mr-2" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-50 border border-gray-200 h-12 md:h-14">
            <TabsTrigger 
              value="start" 
              disabled={!!selectedOrganization}
              className="flex items-center gap-1 md:gap-2 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-300 text-sm md:text-base disabled:opacity-50"
            >
              <Icon name="Play" size={16} className="md:w-[18px] md:h-[18px]" />
              Старт
            </TabsTrigger>
            <TabsTrigger 
              value="work" 
              disabled={!selectedOrganization}
              className="flex items-center gap-1 md:gap-2 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-300 text-sm md:text-base disabled:opacity-50"
            >
              <Icon name="Briefcase" size={16} className="md:w-[18px] md:h-[18px]" />
              Работа
            </TabsTrigger>
            <TabsTrigger 
              value="training" 
              className="flex items-center gap-1 md:gap-2 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-300 text-sm md:text-base"
            >
              <Icon name="GraduationCap" size={16} className="md:w-[18px] md:h-[18px]" />
              Обучение
            </TabsTrigger>
          </TabsList>

          <TabsContent value="start">
            <StartTab onOrganizationSelect={handleOrganizationSelect} />
          </TabsContent>

          <TabsContent value="work">
            <WorkTab 
              selectedOrganizationId={selectedOrganization} 
              onChangeOrganization={handleChangeOrganization}
            />
          </TabsContent>

          <TabsContent value="training">
            <TrainingTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}