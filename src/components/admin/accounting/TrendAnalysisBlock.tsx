import Icon from '@/components/ui/icon';
import { TrendAnalysis } from './useTrendAnalysis';

type Period = 'day' | 'week' | 'month' | 'year';

interface TrendAnalysisBlockProps {
  trendAnalysis: TrendAnalysis | null;
  period: Period;
  formatCurrency: (value: number) => string;
}

export default function TrendAnalysisBlock({ trendAnalysis, period, formatCurrency }: TrendAnalysisBlockProps) {
  if (!trendAnalysis) return null;

  const getPeriodName = () => {
    switch (period) {
      case 'day': return 'день';
      case 'week': return 'неделю';
      case 'month': return 'месяц';
      case 'year': return 'год';
    }
  };

  return (
    <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white shadow-sm">
          <Icon name={trendAnalysis.trendIcon} size={20} className={trendAnalysis.trendColor} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            {trendAnalysis.trendText}
            {trendAnalysis.changePerPeriod !== 0 && (
              <span className={`text-sm font-normal ${trendAnalysis.trendColor}`}>
                ({trendAnalysis.changePerPeriod > 0 ? '+' : ''}{formatCurrency(trendAnalysis.changePerPeriod)} ₽/{getPeriodName()})
              </span>
            )}
          </h4>
          
          <div className={`grid grid-cols-1 ${(period === 'month' || period === 'week') ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3 mt-3`}>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-600 mb-1">Средний доход</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(trendAnalysis.avgRevenue)} ₽</div>
            </div>
            
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-600 mb-1">
                {period === 'week' ? 'Прогноз на неделю' : 'Прогноз на ноябрь'}
              </div>
              <div className={`text-lg font-bold ${trendAnalysis.novemberForecast >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(trendAnalysis.novemberForecast)} ₽
              </div>
            </div>
            
            {period !== 'month' && period !== 'week' && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-600 mb-1">Прогноз на декабрь</div>
                <div className={`text-lg font-bold ${trendAnalysis.decemberForecast >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(trendAnalysis.decemberForecast)} ₽
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}