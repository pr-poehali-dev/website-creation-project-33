import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PhotoCapture from './PhotoCapture';

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

interface Organization {
  id: number;
  name: string;
}

interface StartTabProps {
  onOrganizationSelect: (orgId: number, orgName: string) => void;
  onOpenSchedule?: () => void;
}

export default function StartTab({ onOrganizationSelect, onOpenSchedule }: StartTabProps) {
  const { logout } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [pendingOrg, setPendingOrg] = useState<Organization | null>(null);
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false);

  const getSessionToken = () => localStorage.getItem('session_token');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch(`${ADMIN_API}?action=get_organizations`, {
        headers: {
          'X-Session-Token': getSessionToken() || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить организации',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrgClick = (org: Organization) => {
    if (pendingOrg?.id === org.id) return;
    setPendingOrg(org);
  };

  const handleConfirm = () => {
    if (pendingOrg) {
      setPhotoCaptureOpen(true);
    }
  };

  const handlePhotoSuccess = () => {
    if (pendingOrg) {
      console.log('🏢 Selected org:', pendingOrg.name);
      onOrganizationSelect(pendingOrg.id, pendingOrg.name);
      setPendingOrg(null);
    }
  };

  const handleCancel = () => {
    setPendingOrg(null);
    setConfirmDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f8] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500 flex items-center justify-center gap-3 w-full max-w-sm">
          <Icon name="Loader2" size={24} className="animate-spin" />
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f8] flex flex-col items-center justify-start px-4 pt-12 sm:pt-28 pb-8 relative">
      <div className="absolute top-4 right-3 sm:right-4 flex items-center gap-2">
        {onOpenSchedule && (
          <button
            onClick={onOpenSchedule}
            className="flex items-center gap-2 px-3 py-2.5 sm:py-2 rounded-xl bg-white shadow-sm text-gray-500 hover:text-[#001f54] hover:shadow-md active:scale-95 transition-all duration-200 text-sm font-medium touch-manipulation"
          >
            <Icon name="CalendarDays" size={16} />
            <span className="hidden sm:inline">График</span>
          </button>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2.5 sm:py-2 rounded-xl bg-white shadow-sm text-gray-500 hover:text-[#001f54] hover:shadow-md active:scale-95 transition-all duration-200 text-sm font-medium touch-manipulation"
        >
          <Icon name="LogOut" size={16} />
          <span className="hidden sm:inline">Выйти</span>
        </button>
      </div>

      <div className="w-full max-w-sm animate-fade-up">

        <div className="mb-5 sm:mb-8 animate-fade-down" style={{ animationDelay: '0.05s' }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#001f54] mb-1">
            Выбор организации
          </h1>
          <p className="text-gray-500 text-sm">
            Выберите площадку для начала работы
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="relative mb-3">
            <Icon name="Search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Выберите организацию для работы..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#001f54]/40 rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            {organizations.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Icon name="AlertCircle" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Организации не добавлены администратором</p>
              </div>
            ) : (
              <>
                {organizations
                  .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                  .filter((org) =>
                    org.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice(0, showAll ? undefined : 4)
                  .map((org) => {
                    const isSelected = pendingOrg?.id === org.id;
                    return (
                      <div
                        key={org.id}
                        className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                          isSelected
                            ? 'border-[#001f54] bg-[#001f54]'
                            : 'border-gray-200 bg-white hover:bg-[#001f54]/5 hover:border-[#001f54]/30'
                        }`}
                      >
                        <button
                          onClick={() => handleOrgClick(org)}
                          className="w-full px-4 py-4 flex items-center justify-between touch-manipulation"
                        >
                          <span className={`font-medium text-base transition-colors ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                            {org.name}
                          </span>
                          <Icon
                            name={isSelected ? 'Check' : 'ChevronRight'}
                            size={18}
                            className={`flex-shrink-0 ml-2 transition-all duration-300 ${isSelected ? 'text-white' : 'text-gray-300'}`}
                          />
                        </button>

                        <div className={`transition-all duration-300 ease-in-out ${isSelected ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                          <div className="flex gap-2 px-4 pb-4">
                            <button
                              onClick={handleCancel}
                              className="flex-1 py-2.5 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 active:bg-white/30 transition-colors touch-manipulation"
                            >
                              Отмена
                            </button>
                            <button
                              onClick={handleConfirm}
                              className="flex-1 py-2.5 rounded-lg bg-white text-[#001f54] text-sm font-semibold hover:bg-white/90 active:bg-white/90 transition-colors touch-manipulation"
                            >
                              Подтвердить
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {!searchQuery && organizations.length > 4 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-4 text-sm text-[#001f54] hover:text-[#001f54]/70 active:text-[#001f54]/70 transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                  >
                    <Icon name={showAll ? "ChevronUp" : "ChevronDown"} size={16} />
                    {showAll ? 'Скрыть' : `Показать ещё (${organizations.length - 4})`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          © {new Date().getFullYear()} Империя Промо. Все права защищены.
        </p>
      </div>


      {pendingOrg && (
        <PhotoCapture
          open={photoCaptureOpen}
          onOpenChange={setPhotoCaptureOpen}
          onSuccess={handlePhotoSuccess}
          type="start"
          organizationId={pendingOrg.id}
        />
      )}
    </div>
  );
}