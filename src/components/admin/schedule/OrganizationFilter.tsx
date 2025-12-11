import { useState, useEffect } from 'react';
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
  const [allOrganizations, setAllOrganizations] = useState<string[]>([]);
  
  useEffect(() => {
    loadAllOrganizations();
  }, []);
  
  const loadAllOrganizations = async () => {
    try {
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=get_all_organizations',
        {
          headers: {
            'X-Session-Token': localStorage.getItem('session_token') || '',
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.organizations && Array.isArray(data.organizations)) {
          setAllOrganizations(data.organizations.sort());
          console.log(`✅ Загружено ${data.organizations.length} организаций из БД`);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки организаций:', error);
    }
  };
  
  const sortedOrgs = allOrganizations;
  
  const actualSelectedCount = sortedOrgs.filter(org => orgLimits.has(org)).length;

  if (sortedOrgs.length === 0 && Object.keys(userOrgStats).length === 0) {
    return null;
  }

  return (
    <Card className="bg-cyan-500/10 border border-cyan-500/50 md:border-2">
      <CardContent className="p-2 md:p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-1.5 md:gap-2">
            <Icon name="Building2" size={16} className="text-cyan-400 md:w-5 md:h-5" />
            <span className="font-semibold text-slate-100 text-xs md:text-base">
              Организации для рекомендаций
            </span>
            <span className="text-[10px] md:text-sm text-cyan-400">
              ({actualSelectedCount} из {sortedOrgs.length})
            </span>
          </div>
          <Icon 
            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
            size={18} 
            className="text-cyan-400 md:w-5 md:h-5" 
          />
        </div>

        {isExpanded && (
          <div className="mt-2 md:mt-4 space-y-2 md:space-y-3">
            <div className="flex gap-1.5 md:gap-2 flex-wrap">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAll();
                }}
                variant="outline"
                size="sm"
                className="text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3 bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700/50"
              >
                <Icon name="CheckSquare" size={12} className="mr-1 md:w-[14px] md:h-[14px]" />
                Выбрать все
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAll();
                }}
                variant="outline"
                size="sm"
                className="text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3 bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700/50"
              >
                <Icon name="Square" size={12} className="mr-1 md:w-[14px] md:h-[14px]" />
                Снять все
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
                disabled={isSaving}
                size="sm"
                className="text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSaving ? (
                  <Icon name="Loader2" size={12} className="mr-1 animate-spin md:w-[14px] md:h-[14px]" />
                ) : (
                  <Icon name="Save" size={12} className="mr-1 md:w-[14px] md:h-[14px]" />
                )}
                Сохранить
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 md:gap-2">
              {sortedOrgs.map(org => {
                const isSelected = orgLimits.has(org);
                const currentLimit = orgLimits.get(org) || 1;
                const isOrgExpanded = expandedOrg === org;

                return (
                  <div key={org} className="space-y-1">
                    <div className="p-1.5 md:p-2 rounded bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 transition-colors border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-1.5 md:gap-2 flex-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOrgToggle(org);
                          }}
                        >
                          <div className={`w-3.5 h-3.5 md:w-4 md:h-4 border-2 rounded flex items-center justify-center ${
                            isSelected ? 'border-emerald-500 bg-slate-800/50' : 'border-slate-600 bg-slate-800/50'
                          }`}>
                            {isSelected && (
                              <Icon name="Check" size={10} className="text-emerald-400 md:w-3 md:h-3" />
                            )}
                          </div>
                          <span className="text-xs md:text-sm">{org}</span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="text-[10px] md:text-xs text-slate-400">
                              {currentLimit}x в неделю
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedOrg(isOrgExpanded ? null : org);
                              }}
                              className="p-0.5 md:p-1 hover:bg-slate-700/50 rounded"
                            >
                              <Icon 
                                name={isOrgExpanded ? "ChevronUp" : "ChevronDown"} 
                                size={12} 
                                className="md:w-[14px] md:h-[14px]"
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && isOrgExpanded && (
                      <div className="bg-slate-800/50 p-2 md:p-3 rounded border border-cyan-500/50 md:border-2 ml-4 md:ml-6">
                        <div className="space-y-1.5 md:space-y-2">
                          <p className="text-[10px] md:text-xs text-slate-400 mb-1.5 md:mb-2">
                            Максимум использований в неделю:
                          </p>
                          <div className="flex gap-1.5 md:gap-2 flex-wrap">
                            {[1, 2, 3, 4, 5].map(limit => (
                              <button
                                key={limit}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOrgLimitChange(org, limit);
                                }}
                                className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm transition-colors ${
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