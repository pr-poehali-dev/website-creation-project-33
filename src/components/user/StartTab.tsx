import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

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

  const handleConfirm = () => {
    if (!selectedOrgId) {
      toast({
        title: 'Ошибка',
        description: 'Выберите организацию',
        variant: 'destructive',
      });
      return;
    }

    const selectedOrg = organizations.find(org => org.id === parseInt(selectedOrgId));
    console.log('🏢 Selected org:', selectedOrg?.name);

    onOrganizationSelect(parseInt(selectedOrgId), selectedOrg?.name || '');
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
          <CardTitle className="flex flex-col items-center gap-3 text-[#001f54] text-2xl">
            <div className="p-3 rounded-full bg-[#001f54]/10 shadow-lg">
              <Icon name="Building2" size={32} className="text-[#001f54]" />
            </div>
            Выберите организацию
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-gray-600">
            Выберите организацию, в которой вы будете работать сегодня
          </p>

          {organizations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="AlertCircle" size={48} className="mx-auto mb-3 opacity-30" />
              <p>Организации не добавлены администратором</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrgId(org.id.toString())}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                      selectedOrgId === org.id.toString()
                        ? 'border-[#001f54] bg-[#001f54]/5'
                        : 'border-gray-200 bg-white hover:border-[#001f54]/30'
                    }`}
                  >
                    {org.name.startsWith('ТОП (') ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src="https://cdn.poehali.dev/files/4333ad33-867b-4fa5-ac4a-ee84df41ad36.jpeg" 
                          alt="ТОП IT ACADEMY"
                          className="h-8 object-contain"
                        />
                        <span className="text-lg text-[#001f54] font-medium">
                          {org.name.replace('ТОП (', '').replace(')', '')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg text-[#001f54] font-medium">{org.name}</span>
                    )}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!selectedOrgId}
                className="w-full bg-[#001f54] hover:bg-[#002b6b] text-white h-12 text-lg shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Icon name="Check" size={20} className="mr-2" />
                Подтвердить
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}