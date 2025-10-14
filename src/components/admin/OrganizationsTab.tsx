import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

interface Organization {
  id: number;
  name: string;
  created_at: string;
}

export default function OrganizationsTab() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrgName, setNewOrgName] = useState('');
  const [adding, setAdding] = useState(false);

  const getSessionToken = () => localStorage.getItem('session_token');

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

  const addOrganization = async () => {
    if (!newOrgName.trim()) return;

    setAdding(true);
    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'add_organization',
          name: newOrgName.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Организация добавлена',
        });
        setNewOrgName('');
        await fetchOrganizations();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось добавить организацию',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding organization:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить организацию',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const deleteOrganization = async (id: number, name: string) => {
    if (!confirm(`Удалить организацию "${name}"?`)) return;

    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'delete_organization',
          id,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Организация удалена',
        });
        await fetchOrganizations();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось удалить организацию',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить организацию',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  if (loading) {
    return (
      <Card className="border-gray-200 shadow-lg bg-white">
        <CardContent className="p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-3">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка организаций...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="border-[#001f54]/20 shadow-xl bg-white slide-up hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-[#001f54] text-lg md:text-xl">
            <div className="p-1.5 md:p-2 rounded-lg bg-[#001f54]/10">
              <Icon name="Building2" size={18} className="text-[#001f54] md:w-5 md:h-5" />
            </div>
            Добавить организацию
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Название организации"
              className="flex-1 border-2 border-[#001f54]/30 bg-white text-[#001f54] placeholder:text-gray-400 focus:border-[#001f54] focus:ring-[#001f54]/20 h-10 md:h-auto text-sm md:text-base"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addOrganization();
                }
              }}
            />
            <Button
              onClick={addOrganization}
              disabled={!newOrgName.trim() || adding}
              className="bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg transition-all duration-300 hover:scale-105 h-10 md:h-auto text-sm md:text-base"
            >
              {adding ? (
                <Icon name="Loader2" size={14} className="animate-spin md:w-4 md:h-4" />
              ) : (
                <>
                  <Icon name="Plus" size={14} className="mr-1.5 md:mr-2 md:w-4 md:h-4" />
                  Добавить
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#001f54]/20 shadow-xl bg-white slide-up hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-[#001f54] text-lg md:text-xl">
            <div className="p-1.5 md:p-2 rounded-lg bg-[#001f54]/10">
              <Icon name="List" size={18} className="text-[#001f54] md:w-5 md:h-5" />
            </div>
            Список организаций ({organizations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Building2" size={32} className="mx-auto mb-3 opacity-30 md:w-12 md:h-12" />
              <p className="text-sm md:text-base">Организации не добавлены</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="border-2 border-[#001f54]/10 rounded-xl p-3 md:p-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#001f54]/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className="p-1.5 md:p-2 rounded-lg bg-[#001f54]/10 flex-shrink-0">
                        <Icon name="Building2" size={16} className="text-[#001f54] md:w-[18px] md:h-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[#001f54] text-sm md:text-lg truncate">{org.name}</div>
                        <div className="text-[10px] md:text-xs text-gray-500">
                          Добавлено: {new Date(org.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteOrganization(org.id, org.name)}
                      className="border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-300 flex-shrink-0 h-8 w-8 p-0 md:h-9 md:w-9"
                      variant="ghost"
                      size="sm"
                    >
                      <Icon name="Trash2" size={12} className="md:w-[14px] md:h-[14px]" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}