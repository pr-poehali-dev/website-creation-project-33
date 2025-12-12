import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { ShiftRecord, User, Organization, ADMIN_API } from './types';

export function useAccountingData(enabled: boolean) {
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const getSessionToken = () => localStorage.getItem('session_token');

  const loadUsers = async () => {
    try {
      console.log('📥 Загружаем пользователей...');
      const response = await fetch(`${ADMIN_API}?action=users`, {
        headers: { 'X-Session-Token': getSessionToken() || '' }
      });
      if (response.ok) {
        const data = await response.json();
        // API возвращает active_users и inactive_users, берём только активных промоутеров
        const activeUsers = data.active_users || [];
        console.log('✅ Пользователи загружены:', activeUsers.length);
        setUsers(activeUsers);
      } else {
        console.error('❌ Ошибка загрузки пользователей:', response.status);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadOrganizations = async () => {
    try {
      console.log('📥 Загружаем организации...');
      const response = await fetch(`${ADMIN_API}?action=get_organizations`, {
        headers: { 'X-Session-Token': getSessionToken() || '' }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Организации загружены:', data.organizations?.length || 0);
        setOrganizations(data.organizations || []);
      } else {
        console.error('❌ Ошибка загрузки организаций:', response.status);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const loadAccountingData = async (days?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: 'get_accounting_data' });
      if (days !== undefined) {
        params.append('days', days.toString());
      }
      
      const response = await fetch(
        `${ADMIN_API}?${params.toString()}`,
        {
          headers: {
            'X-Session-Token': getSessionToken() || '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Accounting data received:', data.shifts?.[0]);
        // Приводим данные к нужному типу, добавляя compensation_amount если его нет
        const shiftsWithCompensation = (data.shifts || []).map((shift: any) => ({
          ...shift,
          compensation_amount: shift.compensation_amount || 0
        }));
        setShifts(shiftsWithCompensation);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading accounting data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      loadAccountingData();
      loadUsers();
      loadOrganizations();
    }
  }, [enabled]);

  return {
    shifts,
    loading,
    users,
    organizations,
    loadAccountingData,
    getSessionToken
  };
}