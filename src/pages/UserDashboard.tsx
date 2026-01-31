import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useChatUnread } from '@/hooks/useChatUnread';
import ChatTabs from '@/components/chat/ChatTabs';
import AIHelper from '@/components/chat/AIHelper';
import UserHeader from '@/components/user/UserHeader';
import StartTab from '@/components/user/StartTab';
import WorkTab from '@/components/user/WorkTab';
import NewWorkTab from '@/components/user/NewWorkTab';
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
  const [totalContacts, setTotalContacts] = useState<number>(0);
  const contactsCounterRef = useRef<ContactsCounterRef>(null);
  const [currentView, setCurrentView] = useState<'tiles' | 'start' | 'work' | 'work-new' | 'schedule' | 'training'>(selectedOrganization ? 'tiles' : 'start');

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
      className="min-h-screen p-3 md:p-6 bg-white"
    >
      <div className="max-w-6xl mx-auto">
        <UserHeader 
          onLogout={logout}
          onOpenChat={() => setChatOpen(true)}
          onOpenAI={() => setAiHelperOpen(true)}
          onOpenSchedule={() => setCurrentView('schedule')}
          onChangeOrganization={handleChangeOrganization}
          unreadCount={unreadCount}
          groupUnreadCount={groupUnreadCount}
          selectedOrganization={selectedOrganization}
          organizationName={organizationName}
          todayContacts={todayContacts}
          totalContacts={totalContacts}
        />

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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
              <div
                onClick={() => setCurrentView('work')}
                className="metro-tile bg-teal-900 hover:bg-teal-800 cursor-pointer transition-all duration-200 active:scale-95 p-6 md:p-8 rounded-2xl relative overflow-hidden group min-h-[180px] border-2 border-yellow-500/80 shadow-xl"
              >
                <div className="absolute inset-0 opacity-80">
                  <img 
                    src="https://cdn.poehali.dev/files/SL-070821-44170-88-scaled-1.jpg" 
                    alt="" 
                    className="w-full h-full object-cover scale-[2.5]"
                    style={{ objectPosition: '85% 20%' }}
                  />
                </div>
                {organizationName && (
                  <Badge className="absolute top-4 right-4 bg-[#c89b3c]/30 hover:bg-[#c89b3c]/40 backdrop-blur-sm text-white border border-[#c89b3c]/60 text-xs md:text-sm px-2 py-1 z-20 shadow-lg transition-colors pointer-events-none">
                    <Icon name="Building2" size={12} className="mr-1" />
                    {organizationName}
                    <span className="ml-2 opacity-90">{todayContacts}/{totalContacts}</span>
                  </Badge>
                )}
                <ContactsCounter ref={contactsCounterRef} onStatsChange={(stats: ContactsStats) => {
                  setTodayContacts(stats.today_contacts);
                  setTotalContacts(stats.total_contacts);
                }} />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mb-4">
                    <Icon name="Briefcase" size={24} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Работа</h2>
                  <p className="text-slate-300 text-sm">Лиды и контакты</p>
                </div>
              </div>

              <div
                onClick={() => setCurrentView('work-new')}
                className="metro-tile bg-teal-900 hover:bg-teal-800 cursor-pointer transition-all duration-200 active:scale-95 p-6 md:p-8 rounded-2xl relative overflow-hidden group min-h-[180px] border-2 border-yellow-500/80 shadow-xl"
              >
                <div className="absolute inset-0 opacity-80">
                  <img 
                    src="https://cdn.poehali.dev/files/SL-070821-44170-88-scaled-1.jpg" 
                    alt="" 
                    className="w-full h-full object-cover scale-[2.5]"
                    style={{ objectPosition: '75% 25%' }}
                  />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mb-4">
                    <Icon name="Video" size={24} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Работа NEW</h2>
                  <p className="text-slate-300 text-sm">Видео-лиды</p>
                </div>
              </div>

              <div
                onClick={() => setCurrentView('schedule')}
                className="metro-tile bg-teal-900 hover:bg-teal-800 cursor-pointer transition-all duration-200 active:scale-95 p-6 md:p-8 rounded-2xl relative overflow-hidden group min-h-[180px] border-2 border-yellow-500/80 shadow-xl"
              >
                <div className="absolute inset-0 opacity-80">
                  <img 
                    src="https://cdn.poehali.dev/files/SL-070821-44170-88-scaled-1.jpg" 
                    alt="" 
                    className="w-full h-full object-cover scale-[2.5]"
                    style={{ objectPosition: '90% 35%' }}
                  />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mb-4">
                    <Icon name="Calendar" size={24} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">График</h2>
                  <p className="text-slate-300 text-sm">Расписание смен</p>
                </div>
              </div>

              <div
                onClick={() => setCurrentView('training')}
                className="metro-tile bg-teal-900 hover:bg-teal-800 cursor-pointer transition-all duration-200 active:scale-95 p-6 md:p-8 rounded-2xl relative overflow-hidden group min-h-[180px] border-2 border-yellow-500/80 shadow-xl"
              >
                <div className="absolute inset-0 opacity-80">
                  <img 
                    src="https://cdn.poehali.dev/files/SL-070821-44170-88-scaled-1.jpg" 
                    alt="" 
                    className="w-full h-full object-cover scale-[2.5]"
                    style={{ objectPosition: '80% 55%' }}
                  />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mb-4">
                    <Icon name="GraduationCap" size={24} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Обучение</h2>
                  <p className="text-slate-300 text-sm">Материалы и тесты</p>
                </div>
              </div>

              <div
                onClick={() => setChatOpen(true)}
                className="metro-tile bg-teal-900 hover:bg-teal-800 cursor-pointer transition-all duration-200 active:scale-95 p-6 md:p-8 rounded-2xl relative overflow-hidden group min-h-[180px] border-2 border-yellow-500/80 shadow-xl"
              >
                <div className="absolute inset-0 opacity-80">
                  <img 
                    src="https://cdn.poehali.dev/files/SL-070821-44170-88-scaled-1.jpg" 
                    alt="" 
                    className="w-full h-full object-cover scale-[2.5]"
                    style={{ objectPosition: '95% 45%' }}
                  />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mb-4 relative">
                    <Icon name="MessageCircle" size={24} className="text-white" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Чат</h2>
                  <p className="text-slate-300 text-sm">Связь с администратором</p>
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

        {currentView === 'work-new' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-3 mb-4">
              <button
                onClick={() => setCurrentView('tiles')}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors flex-shrink-0"
              >
                <Icon name="ArrowLeft" size={20} />
                <span className="text-lg">Назад</span>
              </button>
            </div>
            <NewWorkTab />
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