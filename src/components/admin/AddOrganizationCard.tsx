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
    <Card className="bg-slate-900 border-slate-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-100 text-lg md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-slate-800">
            <Icon name="Building2" size={18} className="text-cyan-400 md:w-5 md:h-5" />
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
            className="flex-1 border-2 border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-slate-600 focus:ring-slate-600 h-10 md:h-auto text-sm md:text-base"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addOrganization();
              }
            }}
          />
          <Button
            onClick={addOrganization}
            disabled={!newOrgName.trim() || adding}
            className="glass-button bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-105 h-10 md:h-auto text-sm md:text-base"
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
