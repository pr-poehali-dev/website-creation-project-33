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
  const [activeTab, setActiveTab] = useState<string>('tiles');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [todayContacts, setTodayContacts] = useState<number>(0);
  const [totalContacts, setTotalContacts] = useState<number>(0);
  const contactsCounterRef = useRef<ContactsCounterRef>(null);
  const [currentView, setCurrentView] = useState<'tiles' | 'start' | 'work' | 'work-new' | 'schedule' | 'training'>('tiles');

  useEffect(() => {
    if (selectedOrganization) {
      localStorage.setItem('selected_organization_id', selectedOrganization.toString());
      fetchOrganizationName();
    } else {
      localStorage.removeItem('selected_organization_id');
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
    setSelectedOrganization(null);
    setBackgroundImage('');
  };

  if (currentView === 'schedule') {
    return (
      <div className="min-h-screen bg-[#f0f2f8] flex flex-col items-center justify-start px-3 sm:px-4 pt-8 sm:pt-16 pb-8 relative">

        {/* Десктоп: кнопка назад в левом верхнем углу */}
        <button
          onClick={() => setCurrentView('tiles')}
          className="hidden sm:flex absolute top-4 left-4 items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-sm text-gray-500 hover:text-[#001f54] hover:shadow-md transition-all duration-200 text-sm font-medium"
        >
          <Icon name="ArrowLeft" size={15} />
          <span>Назад</span>
        </button>

        <div className="w-full max-w-lg animate-fade-up">
          <div className="mb-4 sm:mb-6">
            {/* Мобиле: заголовок + кнопка-иконка в одну строку */}
            <div className="flex items-start justify-between gap-3 sm:block">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-[#001f54] mb-0.5">
                  График работы
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Выберите удобные промежутки времени на неделю
                </p>
              </div>
              <button
                onClick={() => setCurrentView('tiles')}
                className="flex sm:hidden items-center px-3 py-2.5 rounded-xl bg-white shadow-sm text-gray-500 active:scale-95 transition-all duration-200 flex-shrink-0 mt-1 touch-manipulation"
              >
                <Icon name="ArrowLeft" size={16} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-5">
            <ScheduleTab />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-6 pb-10 bg-white flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1">
        {!(currentView === 'work' && !selectedOrganization) && (
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
        )}

        <ChatTabs 
          open={chatOpen} 
          onOpenChange={setChatOpen}
          organizationId={selectedOrganization}
        />

        <AIHelper 
          open={aiHelperOpen}
          onOpenChange={setAiHelperOpen}
        />

        {currentView === 'tiles' && (
          <>
            {organizationName && selectedOrganization && (
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
            <div className="divide-y divide-gray-100">
                {[
                  { label: 'Работа', icon: 'Briefcase', action: () => setCurrentView('work'), iconAnim: 'icon-bounce' },
                  { label: 'Работа NEW', icon: 'Video', action: () => setCurrentView('work-new'), iconAnim: 'icon-pulse' },
                  { label: 'График', icon: 'Calendar', action: () => setCurrentView('schedule'), iconAnim: 'icon-swing' },
                  { label: 'Обучение', icon: 'GraduationCap', action: () => setCurrentView('training'), iconAnim: 'icon-nod' },
                  { label: 'Чат', icon: 'MessageCircle', action: () => setChatOpen(true), iconAnim: 'icon-shake', badge: unreadCount > 0 ? unreadCount : null },
                ].map((item, i) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full py-3.5 flex items-center justify-between hover:bg-gray-50 rounded-xl px-2 transition-colors group"
                    style={{
                      opacity: 0,
                      animation: `fadeSlideIn 0.3s ease forwards`,
                      animationDelay: `${i * 60}ms`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`icon-wrap ${item.iconAnim}`}>
                        <Icon name={item.icon} size={17} className="text-gray-400" />
                      </span>
                      <span className="font-medium text-gray-800">{item.label}</span>
                      {item.badge && (
                        <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[18px]">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <Icon name="ChevronRight" size={15} className="text-gray-300" />
                  </button>
                ))}
              </div>
              <style>{`
                @keyframes fadeSlideIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .icon-wrap { display: inline-flex; transition: transform 0.2s ease; }

                /* Briefcase — подпрыгивает */
                @keyframes bounce {
                  0%,100% { transform: translateY(0); }
                  40% { transform: translateY(-4px); }
                  70% { transform: translateY(-2px); }
                }
                .group:hover .icon-bounce { animation: bounce 0.5s ease; }

                /* Video — пульсирует масштаб */
                @keyframes pulse-scale {
                  0%,100% { transform: scale(1); }
                  50% { transform: scale(1.3); }
                }
                .group:hover .icon-pulse { animation: pulse-scale 0.4s ease; }

                /* Calendar — покачивается */
                @keyframes swing {
                  0%,100% { transform: rotate(0deg); }
                  25% { transform: rotate(-12deg); }
                  75% { transform: rotate(12deg); }
                }
                .group:hover .icon-swing { animation: swing 0.4s ease; }

                /* GraduationCap — кивает */
                @keyframes nod {
                  0%,100% { transform: rotateX(0deg); }
                  50% { transform: translateY(3px); }
                }
                .group:hover .icon-nod { animation: nod 0.4s ease; }

                /* MessageCircle — трясётся */
                @keyframes shake {
                  0%,100% { transform: translateX(0); }
                  20% { transform: translateX(-3px); }
                  40% { transform: translateX(3px); }
                  60% { transform: translateX(-2px); }
                  80% { transform: translateX(2px); }
                }
                .group:hover .icon-shake { animation: shake 0.4s ease; }
              `}</style>

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
              {organizationName && selectedOrganization && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className="bg-[#001f54]/10 text-[#001f54] border-0 text-sm px-2 py-1 max-w-[140px] truncate">
                    <Icon name="Building2" size={14} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{organizationName}</span>
                  </Badge>
                  <ContactsCounter ref={contactsCounterRef} onStatsChange={(stats: ContactsStats) => setTodayContacts(stats.today_contacts)} />
                </div>
              )}
            </div>
            {!selectedOrganization ? (
              <StartTab
                onOrganizationSelect={handleOrganizationSelect}
                onOpenSchedule={() => setCurrentView('schedule')}
              />
            ) : (
              <WorkTab 
                selectedOrganizationId={selectedOrganization} 
                organizationName={organizationName}
                onChangeOrganization={handleChangeOrganization}
                todayContactsCount={todayContacts}
                onContactAdded={() => contactsCounterRef.current?.refresh()}
                onShiftEnd={handleChangeOrganization}
              />
            )}
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
      <p className="text-center text-xs text-gray-400 pt-6">
        © {new Date().getFullYear()} Империя Промо. Все права защищены.
      </p>
    </div>
  );
}