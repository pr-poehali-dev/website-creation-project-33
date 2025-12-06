import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useOrganizations } from '@/hooks/useAdminData';
import { useQueryClient } from '@tanstack/react-query';
import RatePeriodsModal from './RatePeriodsModal';
import AddOrganizationCard from './AddOrganizationCard';
import OrganizationSearchBar from './OrganizationSearchBar';
import OrganizationListItem from './OrganizationListItem';

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

interface Organization {
  id: number;
  name: string;
  created_at: string;
  lead_count: number;
  contact_rate: number;
  payment_type: 'cash' | 'cashless';
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
  const [editingRate, setEditingRate] = useState('');
  const [editingPaymentType, setEditingPaymentType] = useState<'cash' | 'cashless'>('cash');
  const [updating, setUpdating] = useState(false);
  const [periodsModalOrg, setPeriodsModalOrg] = useState<{ id: number; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    setEditingRate(org.contact_rate?.toString() || '0');
    setEditingPaymentType(org.payment_type || 'cash');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditingRate('');
    setEditingPaymentType('cash');
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
          contact_rate: parseInt(editingRate) || 0,
          payment_type: editingPaymentType,
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
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center text-slate-300 flex items-center justify-center gap-3">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка организаций...
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredOrganizations = organizations.filter((org: Organization) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedOrganizations = [...filteredOrganizations].sort((a, b) => 
    b.lead_count - a.lead_count
  );

  const displayOrganizations = showAll 
    ? sortedOrganizations 
    : sortedOrganizations.slice(0, 10);

  return (
    <div className="space-y-4 md:space-y-6">
      <AddOrganizationCard
        newOrgName={newOrgName}
        setNewOrgName={setNewOrgName}
        addOrganization={addOrganization}
        adding={adding}
      />

      <Card className="bg-slate-900 border-slate-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-100 text-lg md:text-xl">
            <div className="p-1.5 md:p-2 rounded-lg bg-slate-800">
              <Icon name="Building2" size={18} className="text-cyan-400 md:w-5 md:h-5" />
            </div>
            Организации ({organizations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            organizationCount={organizations.length}
          />

          {filteredOrganizations.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm md:text-base">
                {searchQuery ? 'Организации не найдены' : 'Нет организаций'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:gap-4">
                {displayOrganizations.map((org: Organization) => (
                  <OrganizationListItem
                    key={org.id}
                    org={org}
                    editingId={editingId}
                    editingName={editingName}
                    editingRate={editingRate}
                    editingPaymentType={editingPaymentType}
                    updating={updating}
                    startEditing={startEditing}
                    cancelEditing={cancelEditing}
                    updateOrganization={updateOrganization}
                    deleteOrganization={deleteOrganization}
                    setEditingName={setEditingName}
                    setEditingRate={setEditingRate}
                    setEditingPaymentType={setEditingPaymentType}
                    onOpenPeriods={setPeriodsModalOrg}
                  />
                ))}
              </div>

              {!searchQuery && sortedOrganizations.length > 10 && (
                <div className="mt-4 text-center">
                  <Button
                    onClick={() => setShowAll(!showAll)}
                    variant="outline"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 transition-all duration-300 text-sm"
                  >
                    <Icon
                      name={showAll ? 'ChevronUp' : 'ChevronDown'}
                      size={16}
                      className="mr-2"
                    />
                    {showAll ? 'Скрыть' : `Показать ещё ${sortedOrganizations.length - 10}`}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {periodsModalOrg && (
        <RatePeriodsModal
          isOpen={!!periodsModalOrg}
          onClose={() => setPeriodsModalOrg(null)}
          organizationId={periodsModalOrg.id}
          organizationName={periodsModalOrg.name}
        />
      )}
    </div>
  );
}
