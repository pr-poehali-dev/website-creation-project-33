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
        const org = data.organizations.find((o: { id: number; name: string }) => o.id === selectedOrganization);
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
            {organizationName && (
              <div className="mb-4 flex items-center gap-2 px-1">
                <Icon name="Building2" size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500">{organizationName}</span>
                <span className="text-sm text-gray-400">—</span>
                <ContactsCounter ref={contactsCounterRef} onStatsChange={(stats: ContactsStats) => {
                  setTodayContacts(stats.today_contacts);
                  setTotalContacts(stats.total_contacts);
                }} />
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="divide-y divide-gray-100">
                <button
                  onClick={() => setCurrentView('work')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Icon name="Briefcase" size={20} className="text-blue-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Работа</div>
                      <div className="text-xs text-gray-400">Лиды и контакты</div>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                </button>

                <button
                  onClick={() => setCurrentView('work-new')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Icon name="Video" size={20} className="text-blue-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Работа NEW</div>
                      <div className="text-xs text-gray-400">Видео-лиды</div>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                </button>

                <button
                  onClick={() => setCurrentView('schedule')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Icon name="Calendar" size={20} className="text-blue-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">График</div>
                      <div className="text-xs text-gray-400">Расписание смен</div>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                </button>

                <button
                  onClick={() => setCurrentView('training')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Icon name="GraduationCap" size={20} className="text-blue-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Обучение</div>
                      <div className="text-xs text-gray-400">Материалы и тесты</div>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                </button>

                <button
                  onClick={() => setChatOpen(true)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors relative">
                      <Icon name="MessageCircle" size={20} className="text-blue-500" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[18px]">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Чат</div>
                      <div className="text-xs text-gray-400">Связь с администратором</div>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                </button>
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