import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { UserStats } from './types';

interface DetailedLead {
  user_name: string;
  lead_type: string;
  organization: string;
  created_at: string;
}

interface PeriodDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: string;
  displayLabel: string;
  detailedLeads: DetailedLead[];
  loading: boolean;
}

interface PromoterOrgStats {
  promoter: string;
  organizations: {
    name: string;
    contacts: number;
    approaches: number;
    total: number;
  }[];
  totalContacts: number;
  totalApproaches: number;
  total: number;
}

export default function PeriodDetailModal({
  isOpen,
  onClose,
  period,
  displayLabel,
  detailedLeads,
  loading
}: PeriodDetailModalProps) {
  const [expandedPromoter, setExpandedPromoter] = React.useState<string | null>(null);

  const promoterStats: PromoterOrgStats[] = React.useMemo(() => {
    const statsMap = new Map<string, PromoterOrgStats>();

    detailedLeads.forEach(lead => {
      if (!statsMap.has(lead.user_name)) {
        statsMap.set(lead.user_name, {
          promoter: lead.user_name,
          organizations: [],
          totalContacts: 0,
          totalApproaches: 0,
          total: 0
        });
      }

      const promoterData = statsMap.get(lead.user_name)!;
      const isContact = lead.lead_type === 'контакт';

      if (isContact) {
        promoterData.totalContacts++;
      } else {
        promoterData.totalApproaches++;
      }
      promoterData.total++;

      let orgStats = promoterData.organizations.find(o => o.name === lead.organization);
      if (!orgStats) {
        orgStats = {
          name: lead.organization,
          contacts: 0,
          approaches: 0,
          total: 0
        };
        promoterData.organizations.push(orgStats);
      }

      if (isContact) {
        orgStats.contacts++;
      } else {
        orgStats.approaches++;
      }
      orgStats.total++;
    });

    const result = Array.from(statsMap.values());
    
    result.forEach(promoter => {
      promoter.organizations.sort((a, b) => b.contacts - a.contacts);
    });

    result.sort((a, b) => b.totalContacts - a.totalContacts);

    return result;
  }, [detailedLeads]);

  const totalContacts = promoterStats.reduce((sum, p) => sum + p.totalContacts, 0);
  const totalApproaches = promoterStats.reduce((sum, p) => sum + p.totalApproaches, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-100 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800">
              <Icon name="Calendar" className="text-cyan-400" />
            </div>
            Детализация: {displayLabel}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" className="animate-spin text-cyan-400" size={32} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Всего лидов</div>
                <div className="text-2xl font-bold text-slate-100">{totalContacts + totalApproaches}</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                <div className="text-green-400 text-sm mb-1">Контакты</div>
                <div className="text-2xl font-bold text-green-400">{totalContacts}</div>
              </div>
              <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
                <div className="text-orange-400 text-sm mb-1">Подходы</div>
                <div className="text-2xl font-bold text-orange-400">{totalApproaches}</div>
              </div>
            </div>

            {promoterStats.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Нет данных за выбранный период</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Icon name="Users" size={18} />
                  Промоутеры ({promoterStats.length})
                </h3>

                {promoterStats.map((promoter) => (
                  <div
                    key={promoter.promoter}
                    className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-all"
                  >
                    <button
                      onClick={() => setExpandedPromoter(
                        expandedPromoter === promoter.promoter ? null : promoter.promoter
                      )}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon 
                          name={expandedPromoter === promoter.promoter ? "ChevronDown" : "ChevronRight"} 
                          size={18} 
                          className="text-slate-400"
                        />
                        <span className="font-medium text-slate-100">{promoter.promoter}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Icon name="UserCheck" size={12} className="mr-1" />
                          {promoter.totalContacts}
                        </Badge>
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          <Icon name="Users" size={12} className="mr-1" />
                          {promoter.totalApproaches}
                        </Badge>
                        <span className="text-slate-300 font-semibold">
                          Всего: {promoter.total}
                        </span>
                      </div>
                    </button>

                    {expandedPromoter === promoter.promoter && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-700 bg-slate-900/50">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                            <Icon name="Building2" size={14} />
                            Организации ({promoter.organizations.length})
                          </div>
                          
                          {promoter.organizations.map((org, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between py-2 px-3 bg-slate-800/70 rounded-lg"
                            >
                              <span className="text-slate-200">{org.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-green-400 text-sm flex items-center gap-1">
                                  <Icon name="UserCheck" size={12} />
                                  {org.contacts}
                                </span>
                                <span className="text-orange-400 text-sm flex items-center gap-1">
                                  <Icon name="Users" size={12} />
                                  {org.approaches}
                                </span>
                                <span className="text-slate-300 font-medium text-sm">
                                  = {org.total}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
