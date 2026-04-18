import { useState, useEffect } from 'react';
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
        headers: { 'X-Session-Token': getSessionToken() || '' },
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить организации', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOrgClick = (org: Organization) => {
    setPendingOrg(prev => prev?.id === org.id ? null : org);
  };

  const handleConfirm = () => {
    if (pendingOrg) setPhotoCaptureOpen(true);
  };

  const handleCancel = () => setPendingOrg(null);

  const handlePhotoSuccess = () => {
    if (pendingOrg) {
      onOrganizationSelect(pendingOrg.id, pendingOrg.name);
      setPendingOrg(null);
    }
  };

  const filtered = organizations
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    .filter(org => org.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const visible = showAll ? filtered : filtered.slice(0, 4);
  const hiddenCount = filtered.length - 4;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Icon name="Loader2" size={32} className="animate-spin text-[#001f54]" />
          <span className="text-sm">Загрузка площадок...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-6 bg-[#001f54] px-6 py-8">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, #4f8ef7 0%, transparent 60%), radial-gradient(circle at 10% 80%, #001f54 0%, transparent 50%)'
          }}
        />
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <Icon name="MapPin" size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Выбор площадки</h1>
          <p className="text-blue-200 text-sm">Выберите организацию, чтобы начать смену</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск площадки..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#001f54]/40 focus:ring-2 focus:ring-[#001f54]/10 transition-all"
        />
      </div>

      {/* List */}
      <div className="flex-1">
        {organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Icon name="Building2" size={28} className="opacity-40" />
            </div>
            <p className="text-sm font-medium">Площадки не добавлены</p>
            <p className="text-xs mt-1 text-gray-300">Обратитесь к администратору</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((org, i) => {
              const isSelected = pendingOrg?.id === org.id;
              return (
                <div
                  key={org.id}
                  className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'border-[#001f54] shadow-lg shadow-[#001f54]/10'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <button
                    onClick={() => handleOrgClick(org)}
                    className={`w-full px-4 py-4 flex items-center justify-between text-left transition-colors ${
                      isSelected ? 'bg-[#001f54]' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-white/15' : 'bg-gray-50'
                      }`}>
                        <Icon name="Building2" size={16} className={isSelected ? 'text-white' : 'text-gray-400'} />
                      </div>
                      <span className={`font-medium text-sm transition-colors ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {org.name}
                      </span>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <Icon
                        name={isSelected ? 'Check' : 'ChevronRight'}
                        size={13}
                        className={isSelected ? 'text-white' : 'text-gray-400'}
                      />
                    </div>
                  </button>

                  {/* Confirm panel */}
                  <div className={`transition-all duration-300 ease-in-out ${isSelected ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <div className="flex gap-2 px-4 pb-4 bg-[#001f54]">
                      <button
                        onClick={handleCancel}
                        className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-white text-[#001f54] text-sm font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Icon name="Play" size={13} />
                        Начать смену
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!searchQuery && hiddenCount > 0 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-3.5 text-sm text-[#001f54] hover:text-[#001f54]/70 transition-colors flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#001f54]/30 mt-1"
              >
                <Icon name={showAll ? 'ChevronUp' : 'ChevronDown'} size={15} />
                {showAll ? 'Скрыть' : `Показать ещё ${hiddenCount} площадок`}
              </button>
            )}

            {searchQuery && filtered.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Icon name="SearchX" size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Ничего не найдено</p>
              </div>
            )}
          </div>
        )}
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
