import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export interface OrgUsageLimit {
  name: string;
  maxUses: number;
}

interface OrganizationFilterProps {
  userOrgStats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>;
  orgLimits: Map<string, number>;
  weekStart: string;
  onOrgToggle: (org: string) => void;
  onOrgLimitChange: (org: string, limit: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export default function OrganizationFilter({
  userOrgStats,
  orgLimits,
  weekStart,
  onOrgToggle,
  onOrgLimitChange,
  onSelectAll,
  onClearAll,
  onSave,
  isSaving
}: OrganizationFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  
  const allOrgs = new Set<string>();
  Object.values(userOrgStats).forEach(stats => {
    stats.forEach(stat => allOrgs.add(stat.organization_name));
  });
  
  const sortedOrgs = Array.from(allOrgs).sort();
  
  const actualSelectedCount = sortedOrgs.filter(org => orgLimits.has(org)).length;

  if (sortedOrgs.length === 0) {
    return null;
  }

  return (
    <Card className="bg-cyan-500/10 border-2 border-cyan-500/50">
      <CardContent className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Icon name="Building2" size={20} className="text-cyan-400" />
            <span className="font-semibold text-slate-100">
              Организации для рекомендаций
            </span>
            <span className="text-sm text-cyan-400">
              ({actualSelectedCount} из {sortedOrgs.length})
            </span>
          </div>
          <Icon 
            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
            size={20} 
            className="text-cyan-400" 
          />
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAll();
                }}
                variant="outline"
                size="sm"
                className="text-xs bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700/50"
              >
                <Icon name="CheckSquare" size={14} className="mr-1" />
                Выбрать все
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAll();
                }}
                variant="outline"
                size="sm"
                className="text-xs bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700/50"
              >
                <Icon name="Square" size={14} className="mr-1" />
                Снять все
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
                disabled={isSaving}
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSaving ? (
                  <Icon name="Loader2" size={14} className="mr-1 animate-spin" />
                ) : (
                  <Icon name="Save" size={14} className="mr-1" />
                )}
                Сохранить
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {sortedOrgs.map(org => {
                const isSelected = orgLimits.has(org);
                const currentLimit = orgLimits.get(org) || 1;
                const isOrgExpanded = expandedOrg === org;

                return (
                  <div key={org} className="space-y-1">
                    <div className="p-2 rounded bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 transition-colors border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOrgToggle(org);
                          }}
                        >
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                            isSelected ? 'border-emerald-500 bg-slate-800/50' : 'border-slate-600 bg-slate-800/50'
                          }`}>
                            {isSelected && (
                              <Icon name="Check" size={12} className="text-emerald-400" />
                            )}
                          </div>
                          <span className="text-sm">{org}</span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {currentLimit}x в неделю
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedOrg(isOrgExpanded ? null : org);
                              }}
                              className="p-1 hover:bg-slate-700/50 rounded"
                            >
                              <Icon 
                                name={isOrgExpanded ? "ChevronUp" : "ChevronDown"} 
                                size={14} 
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && isOrgExpanded && (
                      <div className="bg-slate-800/50 p-3 rounded border-2 border-cyan-500/50 ml-6">
                        <div className="space-y-2">
                          <p className="text-xs text-slate-400 mb-2">
                            Максимум использований в неделю:
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 4, 5].map(limit => (
                              <button
                                key={limit}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOrgLimitChange(org, limit);
                                }}
                                className={`px-3 py-1 rounded text-sm transition-colors ${
                                  currentLimit === limit
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {limit}x
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}