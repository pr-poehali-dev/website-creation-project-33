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
        <Icon name="Search" size={16} className="text-gray-400" />
      </div>
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={`Поиск среди ${organizationCount} организаций...`}
        className="pl-10 border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-blue-300 focus:ring-blue-100 h-10 text-sm"
      />
      {searchQuery && (
        <Button
          onClick={() => setSearchQuery('')}
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <Icon name="X" size={14} />
        </Button>
      )}
    </div>
  );
}