import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useChatUnread } from '@/hooks/useChatUnread';
import ChatTabs from '@/components/chat/ChatTabs';
import AIHelper from '@/components/chat/AIHelper';
import StartTab from '@/components/user/StartTab';
import WorkTab from '@/components/user/WorkTab';
import TrainingTab from '@/components/user/TrainingTab';
import ScheduleTab from '@/components/user/ScheduleTab';
import ContactsCounter, { ContactsStats, ContactsCounterRef } from '@/components/user/ContactsCounter';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const unreadCount = useChatUnread();
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [aiHelperOpen, setAiHelperOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [selectedOrganization, setSelectedOrganization] = useState<number | null>(() => {
    const saved = localStorage.getItem('selected_organization_id');
    return saved ? parseInt(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<string>(selectedOrganization ? 'work' : 'tiles');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [todayContacts, setTodayContacts] = useState<number>(0);
  const contactsCounterRef = useRef<ContactsCounterRef>(null);
  const [currentView, setCurrentView] = useState<'tiles' | 'start' | 'work' | 'schedule' | 'training'>(selectedOrganization ? 'tiles' : 'start');

  useEffect(() => {
    if (selectedOrganization) {
      localStorage.setItem('selected_organization_id', selectedOrganization.toString());
      setCurrentView('tiles');
      fetchOrganizationName();
    } else {
      localStorage.removeItem('selected_organization_id');
      setCurrentView('start');
      setOrganizationName('');
    }
  }, [selectedOrganization]);

  // Загрузка счетчика непрочитанных групповых сообщений
  const fetchGroupUnread = async () => {
    if (!user) return;
    try {
      const response = await fetch('https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c?is_group=true', {
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setGroupUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching group unread count:', error);
    }
  };

  useEffect(() => {
    if (!user || !selectedOrganization) return;

    fetchGroupUnread();
    const interval = setInterval(fetchGroupUnread, 5000);
    return () => clearInterval(interval);
  }, [user, selectedOrganization]);

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
    console.log('🔄 handleChangeOrganization called');
    setSelectedOrganization(null);
    setCurrentView('start');
    setBackgroundImage('');
    console.log('✅ State reset: organization=null, tab=start');
  };

  return (
    <div 
      className="min-h-screen p-3 md:p-6"
      style={{
        backgroundImage: backgroundImage || 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Шапка */}
        <div className="mb-3 md:mb-4 slide-up">
          <div className="flex justify-between items-start md:items-center gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-[#001f54] overflow-hidden flex items-center justify-center p-2 shadow-lg flex-shrink-0">
                <img 
                  src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg" 
                  alt="ИМПЕРИЯ"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm md:text-xl font-bold text-[#001f54] leading-tight">
                  ИМПЕРИЯ
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {selectedOrganization && (
                <>
                  <Button 
                    onClick={() => setChatOpen(true)} 
                    className="bg-[#001f54] hover:bg-[#002b6b] text-white transition-all duration-300 shadow-lg relative h-10 w-10 p-0 md:h-9 md:w-auto md:px-3 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    size="sm"
                  >
                    <Icon name="MessageCircle" size={18} />
                    {(unreadCount + groupUnreadCount) > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] bg-red-500 hover:bg-red-500 text-white text-xs px-1">
                        {unreadCount + groupUnreadCount}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    onClick={handleChangeOrganization}
                    className="hidden md:flex border-0 text-[#001f54] hover:bg-[#001f54]/5 transition-all duration-300 h-10 w-10 p-0 md:h-9 md:w-auto md:px-3 focus-visible:ring-0 focus-visible:ring-offset-0"
                    variant="ghost"
                    size="sm"
                  >
                    <Icon name="RefreshCw" size={18} />
                  </Button>
                </>
              )}
              <Button 
                onClick={() => setAiHelperOpen(true)} 
                className="hidden md:flex bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 shadow-lg h-10 w-10 p-0 md:h-9 md:w-auto md:px-3 font-bold text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                size="sm"
              >
                AI
              </Button>
              <Button 
                onClick={() => setCurrentView('schedule')} 
                className="bg-[#001f54] hover:bg-[#002b6b] text-white transition-all duration-300 shadow-lg h-10 w-10 p-0 md:h-9 md:w-auto md:px-3 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                size="sm"
              >
                <Icon name="Calendar" size={18} />
              </Button>
              <Button 
                onClick={logout} 
                className="bg-[#001f54] hover:bg-[#002b6b] text-white transition-all duration-300 shadow-lg h-10 w-10 p-0 md:h-9 md:w-auto md:px-3 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                size="sm"
              >
                <Icon name="LogOut" size={18} />
              </Button>
            </div>
          </div>
        </div>

        <ChatTabs 
          open={chatOpen} 
          onOpenChange={setChatOpen}
          organizationId={selectedOrganization}
        />

        <AIHelper 
          open={aiHelperOpen}
          onOpenChange={setAiHelperOpen}
        />

        {currentView === 'start' && (
          <StartTab onOrganizationSelect={handleOrganizationSelect} />
        )}

        {currentView === 'tiles' && selectedOrganization && (
          <>
            {organizationName && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                <Badge className="bg-[#001f54]/10 text-[#001f54] border border-[#001f54]/20 text-sm md:text-base px-3 py-1.5">
                  <Icon name="Building2" size={14} className="mr-1.5" />
                  {organizationName}
                </Badge>
                <ContactsCounter ref={contactsCounterRef} onStatsChange={(stats: ContactsStats) => setTodayContacts(stats.today_contacts)} />
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
              <div
                onClick={() => setCurrentView('work')}
                className="metro-tile bg-blue-600 hover:bg-blue-700 cursor-pointer transition-all duration-200 active:scale-95 p-8 rounded-xl relative overflow-hidden group min-h-[180px]"
              >
                <div className="relative z-10">
                  <Icon name="Briefcase" size={56} className="text-white mb-5" />
                  <h2 className="text-3xl font-bold text-white mb-2">Работа</h2>
                  <p className="text-blue-100 text-base">Лиды и контакты</p>
                </div>
                <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon name="Briefcase" size={140} className="text-white" />
                </div>
              </div>

              <div
                onClick={() => setCurrentView('schedule')}
                className="metro-tile bg-green-600 hover:bg-green-700 cursor-pointer transition-all duration-200 active:scale-95 p-8 rounded-xl relative overflow-hidden group min-h-[180px]"
              >
                <div className="relative z-10">
                  <Icon name="Calendar" size={56} className="text-white mb-5" />
                  <h2 className="text-3xl font-bold text-white mb-2">График</h2>
                  <p className="text-green-100 text-base">Расписание смен</p>
                </div>
                <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon name="Calendar" size={140} className="text-white" />
                </div>
              </div>

              <div
                onClick={() => setCurrentView('training')}
                className="metro-tile bg-purple-600 hover:bg-purple-700 cursor-pointer transition-all duration-200 active:scale-95 p-8 rounded-xl relative overflow-hidden group min-h-[180px]"
              >
                <div className="relative z-10">
                  <Icon name="GraduationCap" size={56} className="text-white mb-5" />
                  <h2 className="text-3xl font-bold text-white mb-2">Обучение</h2>
                  <p className="text-purple-100 text-base">Материалы и тесты</p>
                </div>
                <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon name="GraduationCap" size={140} className="text-white" />
                </div>
              </div>

              <div
                onClick={() => setChatOpen(true)}
                className="metro-tile bg-orange-600 hover:bg-orange-700 cursor-pointer transition-all duration-200 active:scale-95 p-8 rounded-xl relative overflow-hidden group min-h-[180px]"
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <Icon name="MessageCircle" size={56} className="text-white" />
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-lg px-3 py-1">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Чат</h2>
                  <p className="text-orange-100 text-base">Связь с администратором</p>
                </div>
                <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon name="MessageCircle" size={120} className="text-white" />
                </div>
              </div>
            </div>
          </>
        )}

        {currentView === 'work' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-3 mb-4">
              <button
                onClick={() => setCurrentView('tiles')}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors flex-shrink-0"
              >
                <Icon name="ArrowLeft" size={20} />
                <span className="text-lg">Назад</span>
              </button>
              {organizationName && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className="bg-[#001f54]/10 text-[#001f54] border-0 text-sm px-2 py-1 max-w-[140px] truncate">
                    <Icon name="Building2" size={14} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{organizationName}</span>
                  </Badge>
                  <ContactsCounter ref={contactsCounterRef} onStatsChange={(stats: ContactsStats) => setTodayContacts(stats.today_contacts)} />
                </div>
              )}
            </div>
            <WorkTab 
              selectedOrganizationId={selectedOrganization} 
              organizationName={organizationName}
              onChangeOrganization={handleChangeOrganization}
              todayContactsCount={todayContacts}
              onContactAdded={() => contactsCounterRef.current?.refresh()}
              onShiftEnd={handleChangeOrganization}
            />
          </div>
        )}

        {currentView === 'schedule' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView(selectedOrganization ? 'tiles' : 'start')}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors mb-4"
            >
              <Icon name="ArrowLeft" size={20} />
              <span className="text-lg">Назад</span>
            </button>
            <ScheduleTab />
          </div>
        )}

        {currentView === 'training' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('tiles')}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors mb-4"
            >
              <Icon name="ArrowLeft" size={20} />
              <span className="text-lg">Назад</span>
            </button>
            <TrainingTab organizationName={organizationName} />
          </div>
        )}
      </div>
    </div>
  );
}