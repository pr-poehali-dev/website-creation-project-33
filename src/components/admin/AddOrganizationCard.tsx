import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface AddOrganizationCardProps {
  newOrgName: string;
  setNewOrgName: (name: string) => void;
  addOrganization: () => void;
  adding: boolean;
}

export default function AddOrganizationCard({
  newOrgName,
  setNewOrgName,
  addOrganization,
  adding
}: AddOrganizationCardProps) {
  return (
    <Card className="bg-white border-gray-100 rounded-2xl shadow-sm transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-800 text-lg md:text-xl">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Icon name="Building2" size={18} className="text-blue-500" />
          </div>
          Добавить организацию
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="Название организации"
            className="flex-1 border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-blue-300 focus:ring-blue-100 h-10 md:h-auto text-sm md:text-base"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addOrganization();
              }
            }}
          />
          <Button
            onClick={addOrganization}
            disabled={!newOrgName.trim() || adding}
            className="bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 h-10 md:h-auto text-sm md:text-base"
          >
            {adding ? (
              <Icon name="Loader2" size={14} className="animate-spin md:w-4 md:h-4" />
            ) : (
              <>
                <Icon name="Plus" size={14} className="mr-1.5 md:mr-2 md:w-4 md:h-4" />
                Добавить
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}