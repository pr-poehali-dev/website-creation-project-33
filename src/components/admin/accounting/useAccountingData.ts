import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { ShiftRecord, User, Organization, ADMIN_API } from './types';

export function useAccountingData(enabled: boolean) {
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const getSessionToken = () => localStorage.getItem('session_token');

  useEffect(() => {
    if (enabled) {
      loadAccountingData();
      loadUsers();
      loadOrganizations();
    }
  }, [enabled]);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${ADMIN_API}?action=users`, {
        headers: { 'X-Session-Token': getSessionToken() || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await fetch(`${ADMIN_API}?action=get_organizations`, {
        headers: { 'X-Session-Token': getSessionToken() || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${ADMIN_API}?action=get_accounting_data`,
        {
          headers: {
            'X-Session-Token': getSessionToken() || '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const filteredShifts = (data.shifts || []).filter((shift: ShiftRecord) => {
          const shiftDate = new Date(shift.date);
          const cutoffDate = new Date('2025-10-20');
          return shiftDate >= cutoffDate;
        });
        setShifts(filteredShifts);
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

  return {
    shifts,
    loading,
    users,
    organizations,
    loadAccountingData,
    getSessionToken
  };
}
