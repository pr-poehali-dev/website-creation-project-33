import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card className="border-[#001f54]/20 shadow-xl bg-white">
        <CardContent className="p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-3">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 slide-up">
      <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://cdn.poehali.dev/projects/84906f5f-7ef4-49e5-9a56-bd61e788e7bd/files/5ec1d6ec-8fb2-46f5-b8cf-c5cf727a7309.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-pink-200/30 via-white/10 to-green-900/40" />

        <CardHeader className="text-center relative z-10 pt-8 pb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl">🌸</span>
            <span className="text-2xl">🌿</span>
            <span className="text-2xl">🌸</span>
          </div>
          <CardTitle className="text-white text-2xl font-bold drop-shadow-lg">
            Добро пожаловать в весну!
          </CardTitle>
          <p className="text-white/90 text-sm drop-shadow mt-1">Выберите организацию для работы</p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10 pb-8">
          {organizations.length === 0 ? (
            <div className="text-center py-8 text-white/80">
              <Icon name="AlertCircle" size={48} className="mx-auto mb-3 opacity-50" />
              <p>Организации не добавлены администратором</p>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <Icon name="Search" size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-800" />
                <Input
                  type="text"
                  placeholder="Поиск организации..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/50 backdrop-blur-md border-pink-300/60 text-gray-900 placeholder:text-gray-700/70 focus:border-pink-400 focus:ring-pink-300/30 shadow-lg"
                />
              </div>

              <div className="space-y-3">
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
                    className="w-full p-4 rounded-xl border-2 border-pink-200/60 bg-white/35 backdrop-blur-sm hover:border-pink-300 hover:bg-white/55 transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-95"
                  >
                    <span className="text-base">🌷</span>
                    <span className="text-lg text-white font-medium drop-shadow-md">{org.name}</span>
                  </button>
                ))}
              </div>

              {!searchQuery && organizations.length > 4 && (
                <Button
                  onClick={() => setShowAll(!showAll)}
                  variant="outline"
                  className="w-full border-pink-300/60 text-white hover:bg-white/30 bg-white/20 backdrop-blur-sm shadow-sm"
                >
                  <Icon name={showAll ? "ChevronUp" : "ChevronDown"} size={20} className="mr-2" />
                  {showAll ? 'Скрыть' : `Показать ещё (${organizations.length - 4})`}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

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