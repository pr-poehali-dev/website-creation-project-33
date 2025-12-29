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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${ADMIN_API}?action=users`, {
        headers: { 'X-Session-Token': getSessionToken() || '' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Ошибка загрузки пользователей:', response.status);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error loading users:', error);
      }
    }
  };

  const loadOrganizations = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${ADMIN_API}?action=get_organizations`, {
        headers: { 'X-Session-Token': getSessionToken() || '' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      } else {
        console.error('Ошибка загрузки организаций:', response.status);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error loading organizations:', error);
      }
    }
  };

  const loadAccountingData = async (days?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: 'get_accounting_data' });
      if (days !== undefined) {
        params.append('days', days.toString());
      } else {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          params.append('days', '30');
        }
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(
        `${ADMIN_API}?${params.toString()}`,
        {
          headers: {
            'X-Session-Token': getSessionToken() || '',
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('Accounting data received:', data.shifts?.[0]);
        const shiftsWithCompensation = (data.shifts || []).map((shift: any) => ({
          ...shift,
          compensation_amount: shift.compensation_amount || 0
        }));
        setShifts(shiftsWithCompensation);
      } else {
        const errorText = await response.text();
        console.error('Ошибка ответа:', response.status, errorText);
        toast({
          title: 'Ошибка загрузки',
          description: `Код ошибки: ${response.status}`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error loading accounting data:', error);
      if (error.name === 'AbortError') {
        toast({
          title: 'Превышено время ожидания',
          description: 'Сервер не ответил за 30 секунд. Попробуйте позже.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Ошибка сети',
          description: error.message || 'Проверьте подключение к интернету',
          variant: 'destructive',
        });
      }
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