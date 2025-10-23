import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface OrganizationStats {
  organization: string;
  promoters: number;
  contacts: number;
}

interface PromoterDetail {
  name: string;
  contacts: number;
}

interface ArchiveOrganizationsStatsProps {
  data: OrganizationStats[];
  loading: boolean;
}

export default function ArchiveOrganizationsStats({
  data,
  loading,
}: ArchiveOrganizationsStatsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'contacts' | 'promoters'>('contacts');
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [promotersDetails, setPromotersDetails] = useState<Record<string, PromoterDetail[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  const toggleOrganization = async (orgName: string) => {
    if (expandedOrg === orgName) {
      setExpandedOrg(null);
      return;
    }

    setExpandedOrg(orgName);

    if (!promotersDetails[orgName]) {
      setLoadingDetails(orgName);
      try {
        const response = await fetch(
          `https://functions.poehali.dev/6e86bd37-d9f4-4dcd-babd-21ff4d9b8a6f?action=organization_promoters&organization=${encodeURIComponent(orgName)}`,
          {
            headers: {
              'X-Session-Token': localStorage.getItem('session_token') || '',
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          setPromotersDetails((prev) => ({
            ...prev,
            [orgName]: result.data,
          }));
        }
      } catch (error) {
        console.error('Error loading promoters details:', error);
      } finally {
        setLoadingDetails(null);
      }
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base">
            <Icon name="Loader2" size={16} className="md:w-5 md:h-5 animate-spin" />
            Загрузка статистики...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center text-gray-600">
            <Icon name="AlertCircle" size={28} className="mx-auto mb-3 opacity-60" />
            <div className="text-lg font-medium">Нет данных для отображения</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredData = searchTerm
    ? data.filter((org) =>
        org.organization.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'contacts') {
      return b.contacts - a.contacts;
    }
    return b.promoters - a.promoters;
  });

  const totalContacts = data.reduce((sum, org) => sum + org.contacts, 0);

  return (
    <Card className="bg-white border-gray-200 rounded-2xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
          <div className="p-2 rounded-lg bg-purple-100">
            <Icon name="Building2" size={20} className="text-purple-600" />
          </div>
          Статистика по организациям
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Icon
              name="Search"
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Поиск организации..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('contacts')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                sortBy === 'contacts'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              По контактам
            </button>
            <button
              onClick={() => setSortBy('promoters')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                sortBy === 'promoters'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              По промоутерам
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">{data.length}</p>
              <p className="text-sm text-gray-600">Организаций</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{totalContacts}</p>
              <p className="text-sm text-gray-600">Всего контактов</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {sortedData.map((org, index) => {
            const isExpanded = expandedOrg === org.organization;
            const details = promotersDetails[org.organization];

            return (
              <div
                key={org.organization}
                className={`rounded-xl border transition-all duration-300 ${
                  index < 3
                    ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50'
                    : 'border-gray-200 hover:border-purple-200'
                } ${isExpanded ? 'shadow-lg' : 'hover:shadow-lg'}`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleOrganization(org.organization)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
                            : index === 1
                            ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
                            : index === 2
                            ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-base truncate">
                          {org.organization}
                        </p>
                        <p className="text-sm text-gray-600">
                          {org.promoters} промоутер(ов)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="text-right">
                        <div className="px-3 py-1.5 rounded-lg bg-green-100">
                          <p className="text-lg font-bold text-green-800">
                            {org.contacts}
                          </p>
                          <p className="text-xs text-green-600">контактов</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="px-3 py-1.5 rounded-lg bg-blue-100">
                          <p className="text-lg font-bold text-blue-800">
                            {Math.round(org.contacts / org.promoters)}
                          </p>
                          <p className="text-xs text-blue-600">средн./чел.</p>
                        </div>
                      </div>
                      <Icon
                        name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                        size={20}
                        className="text-gray-600"
                      />
                    </div>
                  </div>

                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(org.contacts / totalContacts) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                    {loadingDetails === org.organization ? (
                      <div className="text-center py-4 text-gray-600">
                        <Icon name="Loader2" size={20} className="animate-spin mx-auto" />
                      </div>
                    ) : details && details.length > 0 ? (
                      <div className="space-y-2 mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Промоутеры ({details.length}):
                        </p>
                        {details.map((promoter) => (
                          <div
                            key={promoter.name}
                            className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 hover:border-purple-200 transition-colors"
                          >
                            <span className="text-sm text-gray-800">{promoter.name}</span>
                            <span className="text-sm font-semibold text-purple-600">
                              {promoter.contacts} контактов
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        Нет данных по промоутерам
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sortedData.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <Icon name="Search" size={32} className="mx-auto mb-3 opacity-40" />
            <p>Организация не найдена</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}