import { useState } from 'react';
import Icon from '@/components/ui/icon';
import NotificationsModal from './NotificationsModal';

const REPORT_URLS = {
  morning: 'https://functions.poehali.dev/5d514447-0fd5-409b-a255-3b0800e93eaf',
  daily: 'https://functions.poehali.dev/109690f5-6a72-42e2-b8ba-3eb705cba518',
};

const BALANCE_URL = 'https://functions.poehali.dev/945a47ed-f216-41cf-876b-d73b6f52586e';

interface AdminHeaderProps {
  onLogout: () => void;
  onOpenGoogleSheets: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
  hideTitle?: boolean;
}

export default function AdminHeader({ onLogout, onOpenGoogleSheets, onGoHome, showHomeButton = false, hideTitle = false }: AdminHeaderProps) {
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingReport, setLoadingReport] = useState<'morning' | 'daily' | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceData, setBalanceData] = useState<{x: number; y: number; y_kms: number; y_salary: number; balance: number} | null>(null);
  const [showBalance, setShowBalance] = useState(false);

  const sendReport = async (type: 'morning' | 'daily') => {
    setLoadingReport(type);
    try {
      await fetch(REPORT_URLS[type]);
    } finally {
      setLoadingReport(null);
    }
  };

  const fetchBalance = async () => {
    if (showBalance) { setShowBalance(false); return; }
    setLoadingBalance(true);
    try {
      const res = await fetch(BALANCE_URL);
      const data = await res.json();
      setBalanceData(data);
      setShowBalance(true);
    } finally {
      setLoadingBalance(false);
    }
  };

  return (
    <>
      <header className="pt-4 mb-5 flex items-center justify-between px-1">
        {!hideTitle ? (
          <div>
            <div className="text-base font-bold text-[#001f54] tracking-wide leading-none">ИМПЕРИЯ ПРОМО</div>
            <div className="text-[11px] text-gray-400 leading-none mt-0.5">рекламное агентство</div>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5">
          {showHomeButton && onGoHome && (
            <button
              onClick={onGoHome}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Icon name="Home" size={16} className="text-gray-600" />
            </button>
          )}
          <div className="flex flex-row gap-1">
            {/* Android — на мобильном только иконка */}
            <button
              onClick={() => setShowAndroidBanner(true)}
              title="Скачать приложение Android v1.0"
              className="h-7 rounded-full overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity sm:w-24 w-7 bg-[#2d2d2d]"
            >
              <img src="https://cdn.poehali.dev/files/ef684050-e178-4f04-abe8-8b8cd6948973.jpg" alt="Download for Android" className="h-full w-full object-cover hidden sm:block" />
              <Icon name="Bot" size={16} className="text-green-400 sm:hidden" />
            </button>
            {/* iOS — на мобильном только иконка */}
            <button
              onClick={() => setShowIosBanner(true)}
              title="Скачать приложение iOS"
              className="h-7 rounded-full overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity sm:w-24 w-7 bg-[#3a3a3a]"
            >
              <img src="https://cdn.poehali.dev/files/8b1a0faa-a0e6-4f3c-b1cd-e29cdb42d670.png" alt="Download for iOS" className="h-full w-full object-cover hidden sm:block" />
              <Icon name="Apple" size={16} className="text-white sm:hidden" />
            </button>
          </div>

          {showAndroidBanner && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowAndroidBanner(false)}>
              <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Smartphone" size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Приложение для Android</h2>
                <p className="text-gray-500 mb-6">Приложение будет доступно для скачивания <span className="font-semibold text-gray-700">01.06.2026</span></p>
                <button onClick={() => setShowAndroidBanner(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors">
                  Понятно
                </button>
              </div>
            </div>
          )}
          {showIosBanner && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowIosBanner(false)}>
              <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Apple" size={32} className="text-gray-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Приложение для iOS</h2>
                <p className="text-gray-500 mb-6">Приложение будет доступно для скачивания <span className="font-semibold text-gray-700">01.06.2026</span></p>
                <button onClick={() => setShowIosBanner(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors">
                  Понятно
                </button>
              </div>
            </div>
          )}
          <div className="relative">
            <button
              onClick={fetchBalance}
              disabled={loadingBalance}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 ${showBalance ? 'bg-emerald-100 hover:bg-emerald-200' : 'bg-gray-100 hover:bg-gray-200'}`}
              title="Баланс X-Y"
            >
              {loadingBalance
                ? <Icon name="Loader2" size={16} className="text-emerald-600 animate-spin" />
                : <Icon name="Scale" size={16} className={showBalance ? 'text-emerald-600' : 'text-gray-600'} />
              }
            </button>
            {showBalance && balanceData && (
              <div className="absolute top-11 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 min-w-[200px] text-xs">
                <div className="text-gray-500 mb-1">X (долг КВВ → КМС)</div>
                <div className="font-bold text-gray-800 mb-2">{balanceData.x.toLocaleString('ru-RU')} ₽</div>
                <div className="text-gray-500 mb-1">Y (долг КМС → КВВ + исполн.)</div>
                <div className="font-bold text-gray-800">{balanceData.y.toLocaleString('ru-RU')} ₽</div>
                <div className="text-gray-400 mb-2">КВВ {balanceData.y_kms.toLocaleString('ru-RU')} ₽ + исполн. {balanceData.y_salary.toLocaleString('ru-RU')} ₽</div>
                <div className="border-t border-gray-100 pt-2 mt-1">
                  <div className="text-gray-500 mb-1">X − Y</div>
                  <div className={`font-bold text-base ${balanceData.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {balanceData.balance >= 0 ? '+' : ''}{balanceData.balance.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => sendReport('morning')}
            disabled={loadingReport !== null}
            className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Утренний отчёт"
          >
            {loadingReport === 'morning' ? <Icon name="Loader2" size={16} className="text-amber-600 animate-spin" /> : <Icon name="Sun" size={16} className="text-amber-600" />}
          </button>
          <button
            onClick={() => sendReport('daily')}
            disabled={loadingReport !== null}
            className="w-9 h-9 rounded-xl bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Вечерний отчёт"
          >
            {loadingReport === 'daily' ? <Icon name="Loader2" size={16} className="text-blue-600 animate-spin" /> : <Icon name="Moon" size={16} className="text-blue-600" />}
          </button>
          <button
            onClick={() => setShowNotifications(true)}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Уведомления"
          >
            <Icon name="Bell" size={16} className="text-gray-600" />
          </button>
          <button
            onClick={onOpenGoogleSheets}
            className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            <Icon name="Sheet" size={15} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-600 hidden sm:inline">Google Таблицы</span>
          </button>
          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors group"
          >
            <Icon name="LogOut" size={16} className="text-gray-500 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </header>

      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </>
  );
}