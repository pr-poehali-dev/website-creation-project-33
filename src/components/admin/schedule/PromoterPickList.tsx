import { PromoterOption } from './promoterAssignTypes';
import { getMetroDistance, extractMetroFromOrgName } from './metroUtils';

interface PromoterPickListProps {
  availablePromoters: PromoterOption[];
  organizationName: string;
  onPick: (p: PromoterOption, slotKey?: string) => void;
}

export default function PromoterPickList({ availablePromoters, organizationName, onPick }: PromoterPickListProps) {
  const orgMetro = extractMetroFromOrgName(organizationName);

  if (availablePromoters.length === 0) {
    return <p className="text-center text-xs text-gray-400 py-4">Нет промоутеров со сменами на этот день</p>;
  }

  return (
    <div className="space-y-1.5">
      {availablePromoters.map(p => {
        const allBusy = p.slots.filter(s => !s.used).length === 0;
        const promoterMetro = p.nearest_metro;
        const dist = (orgMetro && promoterMetro) ? getMetroDistance(promoterMetro, orgMetro) : null;

        return (
          <div
            key={p.id}
            onClick={() => !allBusy && onPick(p)}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${
              allBusy
                ? 'opacity-40 border-gray-100 bg-gray-50 cursor-not-allowed'
                : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 cursor-pointer shadow-sm'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${allBusy ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
              {p.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${allBusy ? 'text-gray-400' : 'text-gray-700'}`}>{p.name}</span>
              {promoterMetro && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-gray-400">🚇 {promoterMetro}</span>
                  {dist !== null && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      dist === 0 ? 'bg-green-50 text-green-600' :
                      dist <= 3 ? 'bg-blue-50 text-blue-600' :
                      dist <= 6 ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-500'
                    }`}>
                      {dist === 0 ? 'та же' : `${dist} ст.`}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
              {p.slots.map(s => (
                s.used ? (
                  <span key={s.key} className="text-[10px] text-gray-300 bg-gray-100 px-2 py-1 rounded-lg line-through">
                    {s.label}
                  </span>
                ) : (
                  <button
                    key={s.key}
                    onClick={() => onPick(p, s.key)}
                    className="text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition-all font-semibold"
                  >
                    {s.label}
                  </button>
                )
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
