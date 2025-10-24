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
  const [showAll, setShowAll] = useState(false);

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
      <Card className="bg-white border-gray-200 rounded-xl md:rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-gray-600">
            <Icon name="AlertCircle" size={20} className="md:w-7 md:h-7 mx-auto mb-2 md:mb-3 opacity-60" />
            <div className="text-sm md:text-lg font-medium">Нет данных для отображения</div>
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
    <Card className="bg-white border-gray-200 rounded-xl md:rounded-2xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-900 text-base md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-purple-100">
            <Icon name="Building2" size={16} className="md:w-5 md:h-5 text-purple-600" />
          </div>
          Статистика по организациям
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
          <div className="relative">
            <Icon
              name="Search"
              size={16}
              className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 md:w-[18px] md:h-[18px]"
            />
            <Input
              placeholder="Поиск организации..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 md:pl-10 h-9 md:h-11 text-sm md:text-base"
            />
          </div>

          <div className="flex gap-1.5 md:gap-2">
            <button
              onClick={() => setSortBy('contacts')}
              className={`flex-1 px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                sortBy === 'contacts'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              По контактам
            </button>
            <button
              onClick={() => setSortBy('promoters')}
              className={`flex-1 px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                sortBy === 'promoters'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              По промоутерам
            </button>
          </div>
        </div>

        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-purple-50 rounded-lg">
          <div className="grid grid-cols-2 gap-3 md:gap-4 text-center">
            <div>
              <p className="text-lg md:text-2xl font-bold text-purple-600">{data.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Организаций</p>
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-purple-600">{totalContacts}</p>
              <p className="text-xs md:text-sm text-gray-600">Всего контактов</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 md:space-y-3">
          {(showAll ? sortedData : sortedData.slice(0, 10)).map((org, index) => {
            const isExpanded = expandedOrg === org.organization;
            const details = promotersDetails[org.organization];

            return (
              <div
                key={org.organization}
                className={`rounded-lg md:rounded-xl border transition-all duration-300 ${
                  index < 3
                    ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50'
                    : 'border-gray-200 hover:border-purple-200'
                } ${isExpanded ? 'shadow-lg' : 'hover:shadow-lg'}`}
              >
                <div
                  className="p-2.5 md:p-4 cursor-pointer"
                  onClick={() => toggleOrganization(org.organization)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                      <div
                        className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0 ${
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
                        <p className="font-semibold text-gray-900 text-xs md:text-base truncate">
                          {org.organization}
                        </p>
                        <p className="text-[10px] md:text-sm text-gray-600">
                          {org.promoters} промоутер(ов)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 md:gap-3 items-center flex-shrink-0">
                      <div className="text-right">
                        <div className="px-1.5 py-1 md:px-3 md:py-1.5 rounded-lg bg-green-100">
                          <p className="text-sm md:text-lg font-bold text-green-800">
                            {org.contacts}
                          </p>
                          <p className="text-[9px] md:text-xs text-green-600">контактов</p>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="px-1.5 py-1 md:px-3 md:py-1.5 rounded-lg bg-blue-100">
                          <p className="text-sm md:text-lg font-bold text-blue-800">
                            {Math.round(org.contacts / org.promoters)}
                          </p>
                          <p className="text-[9px] md:text-xs text-blue-600">средн.</p>
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
                            className="flex items-center justify-between p-2 md:p-2 bg-white rounded-lg border border-gray-100 hover:border-purple-200 transition-colors gap-2"
                          >
                            <span className="text-xs md:text-sm text-gray-800 truncate">{promoter.name}</span>
                            <span className="text-xs md:text-sm font-semibold text-purple-600 flex-shrink-0">
                              {promoter.contacts} контактов
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 md:py-4 text-gray-500 text-xs md:text-sm">
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
          <div className="text-center py-6 md:py-8 text-gray-600">
            <Icon name="Search" size={24} className="md:w-8 md:h-8 mx-auto mb-2 md:mb-3 opacity-40" />
            <p className="text-sm md:text-base">Организация не найдена</p>
          </div>
        )}

        {!searchTerm && sortedData.length > 10 && (
          <div className="mt-4 md:mt-6 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-4 md:px-6 py-2 md:py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm md:text-base transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              {showAll ? (
                <>
                  <Icon name="ChevronUp" size={18} />
                  Скрыть
                </>
              ) : (
                <>
                  <Icon name="ChevronDown" size={18} />
                  Показать все ({sortedData.length})
                </>
              )}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}