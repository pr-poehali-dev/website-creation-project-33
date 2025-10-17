import { useImperativeHandle, forwardRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadsStats } from '@/hooks/useAdminData';
import { useQueryClient } from '@tanstack/react-query';

export interface ContactsStats {
  total_contacts: number;
  today_contacts: number;
}

interface ContactsCounterProps {
  onStatsChange?: (stats: ContactsStats) => void;
}

export interface ContactsCounterRef {
  refresh: () => void;
}

const ContactsCounter = forwardRef<ContactsCounterRef, ContactsCounterProps>(({ onStatsChange }, ref) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: loading } = useLeadsStats(user?.id || null);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['leadsStats', user?.id] });
    }
  }), [user?.id, queryClient]);

  if (loading || !stats) {
    return null;
  }

  if (onStatsChange && stats) {
    onStatsChange(stats);
  }

  return (
    <span className="text-sm text-[#001f54]/70 font-medium">
      {stats.today_contacts}/{stats.total_contacts}
    </span>
  );
});

ContactsCounter.displayName = 'ContactsCounter';

export default ContactsCounter;