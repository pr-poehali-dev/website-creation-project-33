import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_API } from '@/components/admin/types';

const getSessionToken = () => localStorage.getItem('session_token') || '';
const CHAT_API_URL = 'https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c';

export function useUsers() {
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
      return data.users;
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
}

export function useStats() {
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
    staleTime: 30000,
    refetchInterval: 30000,
  });
}

export function useChartData() {
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
    staleTime: 60000,
    refetchInterval: 60000,
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
    staleTime: 20000,
    refetchInterval: 20000,
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
    staleTime: 60000,
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await fetch(`${ADMIN_API}?action=organizations`, {
        headers: {
          'X-Session-Token': getSessionToken(),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch organizations');
      const data = await response.json();
      return data.organizations || [];
    },
    staleTime: 60000,
    refetchInterval: 60000,
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
    staleTime: 5000,
    refetchInterval: 5000,
  });
}