import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_API } from '@/components/admin/types';

const getSessionToken = () => localStorage.getItem('session_token') || '';
const CHAT_API_URL = 'https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c';
const LEADS_STATS_API = 'https://functions.poehali.dev/78eb7cbb-8b7c-4a62-aaa3-74d7b1e8f257';
const MONTHLY_CONTACTS_API = 'https://functions.poehali.dev/d0ce132d-5700-4f2a-850e-e49d41bd8969';

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch(`${ADMIN_API}?action=users`, {
        headers: {
          'X-Session-Token': getSessionToken(),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return {
        active: data.active_users || [],
        inactive: data.inactive_users || []
      };
    },
    enabled,
  });
}

export function useStats(enabled = true) {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await fetch(`${ADMIN_API}?action=stats`, {
        headers: {
          'X-Session-Token': getSessionToken(),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled,
  });
}

export function useChartData(enabled = true) {
  return useQuery({
    queryKey: ['chartData'],
    queryFn: async () => {
      const response = await fetch(`${ADMIN_API}?action=chart_data`, {
        headers: {
          'X-Session-Token': getSessionToken(),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch chart data');
      const data = await response.json();
      return data.chart_data;
    },
    enabled,
  });
}

export function useOrganizationStats(enabled = true) {
  return useQuery({
    queryKey: ['organizationStats'],
    queryFn: async () => {
      const response = await fetch(`${ADMIN_API}?action=organization_stats`, {
        headers: {
          'X-Session-Token': getSessionToken(),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch organization stats');
      const data = await response.json();
      return data.organization_stats;
    },
    enabled,
  });
}

export function useUserLeads(userId: number | null) {
  return useQuery({
    queryKey: ['userLeads', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`${ADMIN_API}?action=user_leads&user_id=${userId}`, {
        headers: {
          'X-Session-Token': getSessionToken(),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user leads');
      const data = await response.json();
      return data.leads || [];
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

export function useDailyUserStats(date: string | null) {
  return useQuery({
    queryKey: ['dailyUserStats', date],
    queryFn: async () => {
      if (!date) return { user_stats: [], detailed_leads: [] };
      const response = await fetch(`${ADMIN_API}?action=daily_user_stats&date=${date}`, {
        headers: {
          'X-Session-Token': getSessionToken(),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch daily stats');
      return response.json();
    },
    enabled: !!date,
  });
}

export function useOrganizations(enabled = true) {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await fetch(`${ADMIN_API}?action=get_organizations`, {
        headers: {
          'X-Session-Token': getSessionToken(),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch organizations');
      const data = await response.json();
      return data.organizations || [];
    },
    enabled,
  });
}

export function useUpdateUserName() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, name }: { userId: number; name: string }) => {
      const response = await fetch(ADMIN_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken(),
        },
        body: JSON.stringify({
          action: 'update_user',
          user_id: userId,
          name,
        }),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useToggleVideoRecording() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, enabled }: { userId: number; enabled: boolean }) => {
      const response = await fetch(ADMIN_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken(),
        },
        body: JSON.stringify({
          action: 'toggle_video_recording',
          user_id: userId,
          enabled,
        }),
      });
      if (!response.ok) throw new Error('Failed to toggle video recording');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: number) => {
      const response = await fetch(ADMIN_API, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken(),
        },
        body: JSON.stringify({
          action: 'delete_lead',
          lead_id: leadId,
        }),
      });
      if (!response.ok) throw new Error('Failed to delete lead');
      return response.json();
    },
    onSuccess: (_, leadId) => {
      queryClient.invalidateQueries({ queryKey: ['userLeads'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteLeadsByDate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, date }: { userId: number; date: string }) => {
      const response = await fetch(ADMIN_API, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken(),
        },
        body: JSON.stringify({
          action: 'delete_leads_by_date',
          user_id: userId,
          date,
        }),
      });
      if (!response.ok) throw new Error('Failed to delete leads');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userLeads'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(ADMIN_API, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken(),
        },
        body: JSON.stringify({
          action: 'delete_user',
          user_id: userId,
        }),
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken(),
        },
        body: JSON.stringify({
          action: 'activate_user',
          user_id: userId,
        }),
      });
      if (!response.ok) throw new Error('Failed to activate user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChatMessages(userId: string | null) {
  return useQuery({
    queryKey: ['chatMessages', userId],
    queryFn: async () => {
      if (!userId) return { messages: [], users: [] };
      const response = await fetch(CHAT_API_URL, {
        method: 'GET',
        headers: {
          'X-User-Id': userId,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch chat messages');
      return response.json();
    },
    enabled: !!userId,
  });
}

export function useLeadsStats(userId: number | null) {
  return useQuery({
    queryKey: ['leadsStats', userId],
    queryFn: async () => {
      if (!userId) return { total_contacts: 0, today_contacts: 0 };
      const response = await fetch(`${LEADS_STATS_API}?user_id=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch leads stats');
      return response.json();
    },
    enabled: !!userId,
    staleTime: 10000,
    refetchInterval: 10000,
  });
}

export function useUserWorkTime(userId: number | null) {
  return useQuery({
    queryKey: ['userWorkTime', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`${ADMIN_API}?action=user_work_time&user_id=${userId}`, {
        headers: {
          'X-Session-Token': getSessionToken(),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch work time');
      const data = await response.json();
      return data.work_time || [];
    },
    enabled: !!userId,
    staleTime: Infinity,
  });
}

export function useMonthlyContacts(enabled = true) {
  return useQuery({
    queryKey: ['monthlyContacts'],
    queryFn: async () => {
      const response = await fetch(MONTHLY_CONTACTS_API);
      if (!response.ok) throw new Error('Failed to fetch monthly contacts');
      return response.json();
    },
    enabled,
    staleTime: 300000,
  });
}