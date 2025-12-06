import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface OrganizationSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  organizationCount: number;
}

export default function OrganizationSearchBar({
  searchQuery,
  setSearchQuery,
  organizationCount
}: OrganizationSearchBarProps) {
  return (
    <div className="mb-4 relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Icon name="Search" size={16} className="text-slate-400" />
      </div>
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={`Поиск среди ${organizationCount} организаций...`}
        className="pl-10 border-2 border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-slate-600 focus:ring-slate-600 h-10 text-sm"
      />
      {searchQuery && (
        <Button
          onClick={() => setSearchQuery('')}
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
        >
          <Icon name="X" size={14} />
        </Button>
      )}
    </div>
  );
}
