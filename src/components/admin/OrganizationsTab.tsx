import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useOrganizations } from '@/hooks/useAdminData';
import { useQueryClient } from '@tanstack/react-query';

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

interface Organization {
  id: number;
  name: string;
  created_at: string;
  lead_count: number;
}

interface OrganizationsTabProps {
  enabled?: boolean;
}

export default function OrganizationsTab({ enabled = true }: OrganizationsTabProps) {
  const { data: organizations = [], isLoading: loading } = useOrganizations(enabled);
  const queryClient = useQueryClient();
  const [newOrgName, setNewOrgName] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [updating, setUpdating] = useState(false);

  const getSessionToken = () => localStorage.getItem('session_token');



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
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
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

  const startEditing = (org: Organization) => {
    setEditingId(org.id);
    setEditingName(org.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const updateOrganization = async (id: number) => {
    if (!editingName.trim()) return;

    setUpdating(true);
    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'update_organization',
          id,
          name: editingName.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Название обновлено',
        });
        cancelEditing();
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось обновить название',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить название',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
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
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
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



  if (loading) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
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
      <Card className="bg-white border-gray-200 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-900 text-lg md:text-xl">
            <div className="p-1.5 md:p-2 rounded-lg bg-gray-100">
              <Icon name="Building2" size={18} className="text-gray-900 md:w-5 md:h-5" />
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
              className="flex-1 border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-500 focus:border-gray-300 focus:ring-gray-200 h-10 md:h-auto text-sm md:text-base"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addOrganization();
                }
              }}
            />
            <Button
              onClick={addOrganization}
              disabled={!newOrgName.trim() || adding}
              className="glass-button bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105 h-10 md:h-auto text-sm md:text-base"
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

      <Card className="bg-white border-gray-200 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-900 text-lg md:text-xl">
            <div className="p-1.5 md:p-2 rounded-lg bg-gray-100">
              <Icon name="List" size={18} className="text-gray-900 md:w-5 md:h-5" />
            </div>
            Список организаций ({organizations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Icon name="Building2" size={32} className="mx-auto mb-3 opacity-30 md:w-12 md:h-12" />
              <p className="text-sm md:text-base">Организации не добавлены</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {(showAll ? organizations : organizations.slice(0, 4)).map((org) => (
                <div
                  key={org.id}
                  className="border-2 border-gray-200 rounded-xl p-3 md:p-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-300"
                >
                  {editingId === org.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 border-2 border-blue-300 bg-white text-gray-900 h-10 text-sm md:text-base"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') updateOrganization(org.id);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                      />
                      <Button
                        onClick={() => updateOrganization(org.id)}
                        disabled={!editingName.trim() || updating}
                        className="bg-green-600 hover:bg-green-700 text-white h-10 px-3"
                        size="sm"
                      >
                        {updating ? (
                          <Icon name="Loader2" size={16} className="animate-spin" />
                        ) : (
                          <Icon name="Check" size={16} />
                        )}
                      </Button>
                      <Button
                        onClick={cancelEditing}
                        className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-100 h-10 px-3"
                        variant="ghost"
                        size="sm"
                      >
                        <Icon name="X" size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 md:p-2 rounded-lg bg-blue-50 flex-shrink-0">
                          <Icon name="Building2" size={16} className="text-blue-600 md:w-[18px] md:h-[18px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-medium text-gray-900 text-sm md:text-lg truncate">{org.name}</div>
                            <div className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] md:text-xs font-medium flex-shrink-0">
                              {org.lead_count} {org.lead_count === 1 ? 'лид' : org.lead_count < 5 ? 'лида' : 'лидов'}
                            </div>
                          </div>
                          <div className="text-[10px] md:text-xs text-gray-500">
                            Добавлено: {new Date(org.created_at).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          onClick={() => startEditing(org)}
                          className="border-2 border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-300 flex-shrink-0 h-8 w-8 p-0 md:h-9 md:w-9"
                          variant="ghost"
                          size="sm"
                        >
                          <Icon name="Pencil" size={12} className="md:w-[14px] md:h-[14px]" />
                        </Button>
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
                  )}
                </div>
              ))}
              {organizations.length > 4 && (
                <div className="pt-2 md:pt-3">
                  <Button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 transition-all duration-300 h-10 md:h-11 text-sm md:text-base font-medium"
                  >
                    <Icon name={showAll ? "ChevronUp" : "ChevronDown"} size={16} className="mr-2 md:w-[18px] md:h-[18px]" />
                    {showAll ? `Скрыть` : `Показать все (${organizations.length})`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}