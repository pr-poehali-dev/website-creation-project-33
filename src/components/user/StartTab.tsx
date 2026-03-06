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
    <div className="slide-up">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

        <div className="px-6 pt-6 pb-4">
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Выберите организацию для работы..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-emerald-400 focus:ring-emerald-300/30 rounded-xl text-sm"
            />
          </div>
        </div>

        <div className="px-6 pb-6 space-y-2">
          {organizations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Icon name="AlertCircle" size={40} className="mx-auto mb-3 opacity-30" />
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
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center justify-between group shadow-sm hover:shadow-md"
                >
                  <span className="text-gray-800 font-medium text-sm group-hover:text-blue-700 transition-colors">{org.name}</span>
                  <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                </button>
              ))}

              {!searchQuery && organizations.length > 4 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full py-3 text-sm text-gray-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Icon name={showAll ? "ChevronUp" : "ChevronDown"} size={16} />
                  {showAll ? 'Скрыть' : `Показать ещё (${organizations.length - 4})`}
                </button>
              )}
            </>
          )}
        </div>
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