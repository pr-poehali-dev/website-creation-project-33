import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from './types';
import { formatLastSeen } from '@/utils/timeFormat';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';

interface UserCardProps {
  user: User;
  isSelected: boolean;
  isEditing: boolean;
  editName: string;
  onUserClick: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdateName: () => void;
  onDeleteUser: () => void;
  onEditNameChange: (name: string) => void;
  seniors?: { id: number; name: string }[];
  onSetSenior?: (userId: number, seniorId: number | null) => void;
  onSetMetro?: (userId: number, metro: string | null) => void;
}

export default function UserCard({
  user,
  isSelected,
  isEditing,
  editName,
  onUserClick,
  onStartEdit,
  onCancelEdit,
  onUpdateName,
  onDeleteUser,
  onEditNameChange,
  seniors = [],
  onSetSenior,
  onSetMetro,
}: UserCardProps) {
  const { user: authUser } = useAuth();
  const [uploadingQR, setUploadingQR] = useState(false);
  const [blockingUser, setBlockingUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showSeniorDropdown, setShowSeniorDropdown] = useState(false);
  const [showMetroDropdown, setShowMetroDropdown] = useState(false);
  const [metroSearch, setMetroSearch] = useState('');
  const [savingMetro, setSavingMetro] = useState(false);

const MOSCOW_METRO_STATIONS = [
  'Авиамоторная','Автозаводская','Академическая','Александровский сад','Алексеевская',
  'Алма-Атинская','Алтуфьево','Аннино','Арбатская (АПЛ)','Арбатская (ФЛ)',
  'Аэропорт','Бабушкинская','Багратионовская','Беговая','Беломорская',
  'Белорусская (КЛ)','Белорусская (ЗЛ)','Беляево','Бибирево','Библиотека им. Ленина',
  'Битцевский парк','Борисово','Боровицкая','Боровское шоссе','Братиславская',
  'Бульвар адмирала Ушакова','Бульвар Дмитрия Донского','Бульвар Рокоссовского',
  'Бунинская аллея','Бутово','Бутырская','Варшавская','ВДНХ','Верхние Котлы',
  'Верхние Лихоборы','Владыкино','Волгоградский проспект','Волжская','Волоколамская',
  'Воробьёвы горы','Выставочная','Выхино','Говорово','Давыдково',
  'Деловой центр (АПЛ)','Деловой центр (БКЛ)','Дмитровская','Добрынинская',
  'Домодедовская','Донской бульвар','Достоевская','Дубровка','Дунайская',
  'Жулебино','Зорге','Зябликово','Измайловская','Измайлово','Калужская',
  'Каховская','Каширская (КЛ)','Каширская (ЗЛ)','Киевская (АПЛ)','Киевская (КЛ)',
  'Киевская (ФЛ)','Китай-город','Кленовый бульвар','Кожуховская','Коломенская',
  'Коммунарка','Комсомольская (КЛ)','Комсомольская (СЛ)','Коньково','Коптево',
  'Косино','Котельники','Красногвардейская','Краснопресненская','Красносельская',
  'Красные Ворота','Крестьянская застава','Кропоткинская','Крылатское','Крымская',
  'Кузнецкий мост','Кузьминки','Кунцевская (АПЛ)','Кунцевская (ФЛ)',
  'Курская (КЛ)','Курская (ЦЛ)','Кутузовская','Ленинский проспект','Лесопарковая',
  'Лихоборы','Локомотив','Ломоносовский проспект','Лубянка','Лужники',
  'Лухмановская','Люблино','Марксистская','Марьина роща','Марьино','Маяковская',
  'Медведково','Менделеевская','Минская','Митино','Мичуринский проспект','Молодёжная',
  'Нагатинская','Нагатинский затон','Нагорная','Нахимовский проспект','Некрасовка',
  'Нижегородская','Нижние Мнёвники','Новогиреево','Новокосино','Новокузнецкая',
  'Новослободская','Новохохловская','Новоясеневская','Новые Черёмушки',
  'Октябрьская (КЛ)','Октябрьская (ЦЛ)','Октябрьское поле','Орехово','Отрадное',
  'Охотный ряд','Павелецкая (КЛ)','Павелецкая (ЦЛ)','Парк культуры (КЛ)',
  'Парк культуры (СЛ)','Парк Победы','Партизанская','Первомайская','Перово',
  'Петровско-Разумовская','Печатники','Пионерская','Планерная','Площадь Ильича',
  'Площадь Революции','Полежаевская','Полянка','Пражская','Преображенская площадь',
  'Прокшино','Проспект Вернадского','Проспект Мира (КЛ)','Проспект Мира (ЦЛ)',
  'Профсоюзная','Пушкинская','Пятницкое шоссе','Раменки','Речной вокзал',
  'Рижская','Римская','Ростокино','Румянцево','Рязанский проспект',
  'Савёловская (СЛ)','Савёловская (БКЛ)','Саларьево','Свиблово','Севастопольская',
  'Селигерская','Семёновская','Серпуховская','Сколково','Славянский бульвар',
  'Смоленская (АПЛ)','Смоленская (ФЛ)','Сокол','Сокольники','Спартак',
  'Спортивная','Сретенский бульвар','Стрешнево','Строгино','Студенческая',
  'Сухаревская','Сходненская','Таганская (КЛ)','Таганская (ЦЛ)','Тверская',
  'Текстильщики','Теплый стан','Технопарк','Тимирязевская','Третьяковская (КЛ)',
  'Третьяковская (ЦЛ)','Тропарёво','Трубная','Тульская','Тургеневская',
  'Тушинская','Угрешская','Улица 1905 года','Улица академика Янгеля',
  'Улица Горчакова','Улица Дмитриевского','Улица Скобелевская','Улица Старокачаловская',
  'Университет','Филатов луг','Филёвский парк','Фили','Фонвизинская',
  'Фрунзенская','Ховрино','Хорошёво','Хорошёвская','Цветной бульвар',
  'Черкизовская','Чертановская','Чеховская','Чистые пруды','Чкаловская',
  'Шаболовская','Шипиловская','Шоссе Энтузиастов','Щёлковская','Щукинская',
  'Электрозаводская','Юго-Западная','Южная','Ясенево',
];

  const handleSetMetro = async (metro: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavingMetro(true);
    try {
      await onSetMetro?.(user.id, metro);
    } finally {
      setSavingMetro(false);
      setShowMetroDropdown(false);
      setMetroSearch('');
    }
  };

  const handleAssignSenior = (seniorId: number | null, seniorName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSetSenior?.(user.id, seniorId);
    setShowSeniorDropdown(false);
    toast({ title: seniorName ? `Старший назначен: ${seniorName}` : 'Старший снят' });
  };

  const handleQRUpload = async (file: File) => {
    setUploadingQR(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        const response = await fetch('https://functions.poehali.dev/07269a27-0500-4f53-8cb2-a718a9fc7c85', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'upload',
            user_id: user.id,
            qr_image: base64Image,
            admin_id: authUser?.id
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: 'Успешно!',
            description: 'QR-код загружен'
          });
        } else {
          throw new Error(data.error || 'Ошибка загрузки');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('QR upload error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить QR-код',
        variant: 'destructive'
      });
    } finally {
      setUploadingQR(false);
    }
  };

  const handleBlockUser = async () => {
    setBlockingUser(true);
    try {
      const response = await fetch('https://functions.poehali.dev/4fd575d9-3eab-46f6-8648-120ba9fb667d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Промоутер заблокирован',
          description: `${user.name} выкинут на страницу входа`
        });
      } else {
        throw new Error(data.error || 'Ошибка блокировки');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось заблокировать промоутера',
        variant: 'destructive'
      });
    } finally {
      setBlockingUser(false);
    }
  };

  return (
    <div 
      className="border border-gray-100 rounded-xl p-3 md:p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer bg-white shadow-sm hover:shadow-md"
      onClick={onUserClick}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {user.is_online ? (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
            ) : (
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            )}
            {user.is_admin && (
              <Badge className="bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 text-xs">
                <Icon name="Shield" size={10} className="mr-1" />
                <span className="hidden sm:inline">Админ</span>
                <span className="sm:hidden">А</span>
              </Badge>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => onEditNameChange(e.target.value)}
                  className="w-full max-w-48 border border-blue-300 bg-white text-gray-800 focus:border-blue-400 focus:ring-blue-100 text-sm md:text-base"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      onUpdateName();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="font-medium text-gray-800 text-base md:text-lg truncate">{user.name}</span>
              )}
            </div>
            {user.email && (
              <p className="text-gray-400 text-xs">{user.email}</p>
            )}
            {user.nearest_metro && (
              <p className="text-gray-400 text-xs mt-0.5">{user.nearest_metro}</p>
            )}
            {user.registration_ip && (
              <p className="text-gray-400 text-xs">IP: {user.registration_ip}</p>
            )}
            {user.senior_name && (
              <p className="text-gray-400 text-xs mt-0.5">Старший: {user.senior_name}</p>
            )}
            {user.employee_status && !user.is_admin && (
              user.employee_status === 'intern' ? (
                <>
                  <p className="text-amber-600 text-xs mt-0.5 font-medium">
                    Стажёр · {user.internship_shifts_completed ?? 0}/3 смены
                  </p>
                  {user.internship_shifts_data && user.internship_shifts_data.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {user.internship_shifts_data.map((s, i) => (
                        <p key={i} className="text-gray-400 text-xs">
                          {new Date(s.work_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} · {s.org_name} · {s.contacts} контактов
                        </p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-green-600 text-xs mt-0.5 font-medium">
                  Сотрудник
                </p>
              )
            )}
            {!user.is_online && user.last_seen && (
              <p className="text-gray-400 text-xs mt-0.5">Был в сети: {formatLastSeen(user.last_seen)}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 flex-shrink-0">
          {isSelected && (
            <Icon name="ChevronDown" size={16} className="text-gray-400 md:mr-2" />
          )}
          
          <div className="flex gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <>
                <Button 
                  size="sm" 
                  onClick={onUpdateName}
                  disabled={!editName.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 md:px-3 py-1 h-8 transition-all duration-200"
                >
                  <Icon name="Check" size={12} className="md:w-[14px] md:h-[14px]" />
                </Button>
                <Button 
                  size="sm" 
                  onClick={onCancelEdit}
                  className="border border-gray-200 text-gray-500 hover:bg-gray-100 px-2 md:px-3 py-1 h-8 transition-all duration-200"
                  variant="ghost"
                >
                  <Icon name="X" size={12} className="md:w-[14px] md:h-[14px]" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleBlockUser}
                  disabled={blockingUser || user.is_admin}
                  className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 px-2 md:px-3 py-1 h-8 transition-all duration-200"
                  title="Заблокировать промоутера"
                >
                  {blockingUser ? (
                    <Icon name="Loader2" size={12} className="md:w-[14px] md:h-[14px] animate-spin" />
                  ) : (
                    <Icon name="AlertCircle" size={12} className="md:w-[14px] md:h-[14px]" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingQR}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-500 border border-blue-100 px-2 md:px-3 py-1 h-8 transition-all duration-200"
                  title="Загрузить QR-код"
                >
                  {uploadingQR ? (
                    <Icon name="Loader2" size={12} className="md:w-[14px] md:h-[14px] animate-spin" />
                  ) : (
                    <Icon name="Plus" size={12} className="md:w-[14px] md:h-[14px]" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleQRUpload(file);
                    }
                    e.target.value = '';
                  }}
                />
                <div className="relative">
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setShowMetroDropdown(p => !p); setShowSeniorDropdown(false); setMetroSearch(''); }}
                    disabled={savingMetro}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 px-2 md:px-3 py-1 h-8 transition-all duration-200"
                    title="Ближайшее метро"
                  >
                    {savingMetro ? (
                      <Icon name="Loader2" size={12} className="md:w-[14px] md:h-[14px] animate-spin" />
                    ) : (
                      <span className="text-xs leading-none">🚇</span>
                    )}
                  </Button>
                  {showMetroDropdown && (
                    <div
                      className="absolute right-0 top-10 z-50 bg-white border border-gray-100 rounded-xl shadow-lg w-56 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-2 py-1.5 border-b border-gray-100">
                        <input
                          autoFocus
                          value={metroSearch}
                          onChange={(e) => setMetroSearch(e.target.value)}
                          placeholder="Поиск станции..."
                          className="w-full text-xs px-2 py-1 border border-gray-200 rounded-lg outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto scrollbar-light">
                        {MOSCOW_METRO_STATIONS.filter(s => s.toLowerCase().includes(metroSearch.toLowerCase())).map(s => (
                          <button
                            key={s}
                            onClick={(e) => handleSetMetro(s, e)}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${user.nearest_metro === s ? 'text-emerald-600 font-medium' : 'text-gray-700'}`}
                          >
                            {user.nearest_metro === s && <Icon name="Check" size={10} className="inline mr-1" />}
                            {s}
                          </button>
                        ))}
                      </div>
                      {user.nearest_metro && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={(e) => handleSetMetro(null, e)}
                            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-50 transition-colors"
                          >
                            Убрать метро
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setShowSeniorDropdown(p => !p); setShowMetroDropdown(false); }}
                    className="bg-violet-50 hover:bg-violet-100 text-violet-500 border border-violet-100 px-2 md:px-3 py-1 h-8 transition-all duration-200"
                    title="Назначить старшего"
                  >
                    <Icon name="Star" size={12} className="md:w-[14px] md:h-[14px]" />
                  </Button>
                  {showSeniorDropdown && (
                    <div
                      className="absolute right-0 top-10 z-50 bg-white border border-gray-100 rounded-xl shadow-lg min-w-[180px] py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {seniors.length === 0 ? (
                        <div className="px-3 py-2 text-gray-400 text-xs">Загрузка старших...</div>
                      ) : (
                        seniors.map((s) => (
                          <button
                            key={s.id}
                            onClick={(e) => handleAssignSenior(s.id, s.name, e)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${user.senior_id === s.id ? 'text-blue-500 font-medium' : 'text-gray-700'}`}
                          >
                            {user.senior_id === s.id && <Icon name="Check" size={12} className="inline mr-1" />}
                            {s.name}
                          </button>
                        ))
                      )}
                      {user.senior_id && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={(e) => handleAssignSenior(null, '', e)}
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-50 transition-colors"
                          >
                            Снять старшего
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  size="sm" 
                  onClick={onStartEdit}
                  disabled={user.is_admin}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 px-2 md:px-3 py-1 h-8 transition-all duration-200"
                >
                  <Icon name="Edit" size={12} className="md:w-[14px] md:h-[14px]" />
                </Button>
                {!user.is_admin && (
                  <Button 
                    size="sm" 
                    onClick={onDeleteUser}
                    className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 px-2 md:px-3 py-1 h-8 transition-all duration-200"
                  >
                    <Icon name="Trash2" size={12} className="md:w-[14px] md:h-[14px]" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}