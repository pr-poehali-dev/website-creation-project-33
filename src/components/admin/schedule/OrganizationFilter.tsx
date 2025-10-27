import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface OrganizationFilterProps {
  userOrgStats: Record<string, Array<{organization_name: string, avg_per_shift: number}>>;
  selectedOrgs: Set<string>;
  onOrgToggle: (org: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export default function OrganizationFilter({
  userOrgStats,
  selectedOrgs,
  onOrgToggle,
  onSelectAll,
  onClearAll
}: OrganizationFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const allOrgs = new Set<string>();
  Object.values(userOrgStats).forEach(stats => {
    stats.forEach(stat => allOrgs.add(stat.organization_name));
  });
  
  const sortedOrgs = Array.from(allOrgs).sort();

  if (sortedOrgs.length === 0) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-2 border-blue-300">
      <CardContent className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Icon name="Building2" size={20} className="text-blue-600" />
            <span className="font-semibold text-blue-900">
              Организации для рекомендаций
            </span>
            <span className="text-sm text-blue-700">
              ({selectedOrgs.size} из {sortedOrgs.length})
            </span>
          </div>
          <Icon 
            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
            size={20} 
            className="text-blue-600" 
          />
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAll();
                }}
                variant="outline"
                size="sm"
                className="text-xs"
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
                className="text-xs"
              >
                <Icon name="Square" size={14} className="mr-1" />
                Снять все
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {sortedOrgs.map(org => (
                <div
                  key={org}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOrgToggle(org);
                  }}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedOrgs.has(org)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon 
                      name={selectedOrgs.has(org) ? "CheckSquare" : "Square"} 
                      size={16} 
                    />
                    <span className="text-sm">{org}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
