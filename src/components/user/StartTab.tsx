import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import VideoRecorder from './VideoRecorder';

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
  const [videoRecorderOpen, setVideoRecorderOpen] = useState(false);

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
      setVideoRecorderOpen(true);
    }
  };

  const handleVideoSuccess = () => {
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
      <Card className="border-[#001f54]/20 shadow-xl bg-white hover:shadow-2xl transition-all duration-300">
        <CardHeader className="text-center">
          <CardTitle className="text-[#001f54] text-2xl">
            Выберите организацию
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {organizations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="AlertCircle" size={48} className="mx-auto mb-3 opacity-30" />
              <p>Организации не добавлены администратором</p>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <Icon name="Search" size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Поиск организации..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-200 text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/20"
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
                    className="w-full p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-[#001f54]/30 transition-all duration-300 flex items-center justify-center hover:shadow-md"
                  >
                    {org.name.startsWith('ТОП (') ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src="https://cdn.poehali.dev/files/4333ad33-867b-4fa5-ac4a-ee84df41ad36.jpeg" 
                          alt="ТОП IT ACADEMY"
                          className="h-8 object-contain"
                        />
                        <span className="text-lg text-[#001f54] font-medium">
                          ТОП ({org.name.replace('ТОП (', '').replace(')', '')})
                        </span>
                      </div>
                    ) : org.name.startsWith('KIBERONE (') ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src="https://cdn.poehali.dev/files/193514cf-f3d3-4bb3-b21a-107c707033e7.jpeg" 
                          alt="KIBERONE"
                          className="h-8 object-contain"
                        />
                        <span className="text-lg text-[#001f54] font-medium">
                          KIBERONE ({org.name.replace('KIBERONE (', '').replace(')', '')})
                        </span>
                      </div>
                    ) : org.name === 'Сотка' ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src="https://cdn.poehali.dev/files/7954e315-365e-4811-a221-ea0a5db669d9.jpeg" 
                          alt="Сотка"
                          className="h-12 object-contain"
                        />
                        <span className="text-lg text-[#001f54] font-medium">Сотка</span>
                      </div>
                    ) : org.name === 'WORKOUT ANT' ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src="https://cdn.poehali.dev/files/78d7d4cd-36bf-48a2-8b4d-d7a24cae0b4d.jpeg" 
                          alt="WORKOUT ANT"
                          className="h-12 object-contain"
                        />
                        <span className="text-lg text-[#001f54] font-medium">WORKOUT ANT</span>
                      </div>
                    ) : (
                      <span className="text-lg text-[#001f54] font-medium">{org.name}</span>
                    )}
                  </button>
                ))}
              </div>

              {!searchQuery && organizations.length > 4 && (
                <Button
                  onClick={() => setShowAll(!showAll)}
                  variant="outline"
                  className="w-full border-[#001f54]/30 text-[#001f54] hover:bg-[#001f54]/5"
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
        <VideoRecorder
          open={videoRecorderOpen}
          onOpenChange={setVideoRecorderOpen}
          onSuccess={handleVideoSuccess}
          type="start"
          organizationId={pendingOrg.id}
        />
      )}
    </div>
  );
}