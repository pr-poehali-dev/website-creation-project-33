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
    <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-200">
          <Icon name={trendAnalysis.trendIcon} size={20} className={trendAnalysis.trendColor} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            {trendAnalysis.trendText}
            {trendAnalysis.changePerPeriod !== 0 && (
              <span className="text-sm font-normal text-gray-600">
                ({trendAnalysis.changePerPeriod > 0 ? '+' : ''}{formatCurrency(trendAnalysis.changePerPeriod)} ₽/{getPeriodName()})
              </span>
            )}
          </h4>
          
          <div className={`grid grid-cols-1 ${(period === 'month' || period === 'week') ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3 mt-3`}>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Средний доход</div>
              <div className="text-lg font-bold text-gray-800">{formatCurrency(trendAnalysis.avgRevenue)} ₽</div>
            </div>
            
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">
                {period === 'week' ? 'Прогноз на неделю' : `Прогноз на ${new Date().toLocaleDateString('ru-RU', { month: 'long' })}`}
              </div>
              <div className="text-lg font-bold text-gray-800">
                {formatCurrency(trendAnalysis.novemberForecast)} ₽
              </div>
            </div>
            
            {period !== 'month' && period !== 'week' && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Прогноз на декабрь</div>
                <div className="text-lg font-bold text-gray-800">
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