import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useChatUnread } from '@/hooks/useChatUnread';
import ChatDialog from '@/components/chat/ChatDialog';
import StartTab from '@/components/user/StartTab';
import WorkTab from '@/components/user/WorkTab';
import TrainingTab from '@/components/user/TrainingTab';
import ContactsCounter from '@/components/user/ContactsCounter';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const unreadCount = useChatUnread();
  const [chatOpen, setChatOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [selectedOrganization, setSelectedOrganization] = useState<number | null>(() => {
    const saved = localStorage.getItem('selected_organization_id');
    return saved ? parseInt(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<string>(selectedOrganization ? 'work' : 'start');
  const [backgroundImage, setBackgroundImage] = useState<string>('');

  useEffect(() => {
    if (selectedOrganization) {
      localStorage.setItem('selected_organization_id', selectedOrganization.toString());
      setActiveTab('work');
      fetchOrganizationName();
    } else {
      localStorage.removeItem('selected_organization_id');
      setActiveTab('start');
      setOrganizationName('');
    }
  }, [selectedOrganization]);

  const fetchOrganizationName = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=get_organizations`, {
        headers: {
          'X-Session-Token': localStorage.getItem('session_token') || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const org = data.organizations.find((o: any) => o.id === selectedOrganization);
        if (org) {
          setOrganizationName(org.name);
        }
      }
    } catch (error) {
      console.error('Error fetching organization name:', error);
    }
  };

  const handleOrganizationSelect = (orgId: number, orgName: string) => {
    setSelectedOrganization(orgId);
    if (orgName === 'Сотка') {
      setBackgroundImage('#ffffff');
    }
  };

  const handleChangeOrganization = () => {
    setSelectedOrganization(null);
    setActiveTab('start');
    setBackgroundImage('');
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-6"
      style={{
        backgroundImage: backgroundImage || 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Шапка */}
        <div className="mb-4 slide-up space-y-3">
          <div className="flex justify-between items-center">
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
            <div className="flex items-center gap-2">
              {selectedOrganization && (
                <>
                  <Button 
                    onClick={() => setChatOpen(true)} 
                    className="bg-[#001f54] hover:bg-[#002b6b] text-white transition-all duration-300 shadow-lg hover:scale-105 relative h-9"
                    size="sm"
                  >
                    <Icon name="MessageCircle" size={16} className="md:mr-1.5" />
                    <span className="hidden md:inline">Чат</span>
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] bg-red-500 hover:bg-red-500 text-white text-xs px-1">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    onClick={handleChangeOrganization}
                    className="border-2 border-[#001f54]/20 text-[#001f54] hover:bg-[#001f54]/5 transition-all duration-300 h-9"
                    variant="ghost"
                    size="sm"
                  >
                    <Icon name="RefreshCw" size={16} className="md:mr-1.5" />
                    <span className="hidden md:inline">Сменить</span>
                  </Button>
                </>
              )}
              <Button 
                onClick={logout} 
                className="bg-[#001f54] hover:bg-[#002b6b] text-white transition-all duration-300 shadow-lg hover:scale-105 h-9"
                size="sm"
              >
                <Icon name="LogOut" size={16} className="md:mr-1.5" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </div>
          </div>
        </div>

        <ChatDialog 
          open={chatOpen} 
          onOpenChange={setChatOpen}
          organizationId={selectedOrganization}
        />

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

          {organizationName && (
            <div className="flex justify-center items-center gap-3">
              <Badge className="bg-[#001f54]/10 text-[#001f54] border border-[#001f54]/20 text-sm md:text-base px-3 py-1">
                <Icon name="Building2" size={14} className="mr-1.5" />
                {organizationName}
              </Badge>
              <ContactsCounter />
            </div>
          )}

          <TabsContent value="start">
            <StartTab onOrganizationSelect={handleOrganizationSelect} />
          </TabsContent>

          <TabsContent value="work">
            <WorkTab 
              selectedOrganizationId={selectedOrganization} 
              organizationName={organizationName}
              onChangeOrganization={handleChangeOrganization}
            />
          </TabsContent>

          <TabsContent value="training">
            <TrainingTab organizationName={organizationName} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}