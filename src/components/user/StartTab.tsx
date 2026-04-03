import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import PhotoCapture from './PhotoCapture';

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

interface Organization {
  id: number;
  name: string;
}

interface StartTabProps {
  onOrganizationSelect: (orgId: number, orgName: string) => void;
}

export default function StartTab({ onOrganizationSelect }: StartTabProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
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
    setPendingOrg(org);
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (pendingOrg) {
      setConfirmDialogOpen(false);
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
    <div className="min-h-screen bg-[#f0f2f8] flex flex-col items-center justify-start px-4 pt-12 sm:pt-28 pb-8">
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
                  .map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrgClick(org)}
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white active:bg-[#001f54]/5 active:border-[#001f54]/30 hover:bg-[#001f54]/5 hover:border-[#001f54]/30 transition-all duration-200 flex items-center justify-between group touch-manipulation"
                  >
                    <span className="text-gray-800 font-medium text-base group-hover:text-[#001f54] transition-colors">{org.name}</span>
                    <Icon name="ChevronRight" size={18} className="text-gray-300 group-hover:text-[#001f54]/50 flex-shrink-0 ml-2 transition-colors" />
                  </button>
                ))}

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

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение выбора</DialogTitle>
            <DialogDescription>
              Вы выбрали организацию: <strong>{pendingOrg?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-[#001f54] hover:bg-[#002b6b] text-white"
            >
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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