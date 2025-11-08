import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface TCRow {
  id: number;
  organization: string;
  column2: string;
  column3: string;
}

const TC_STORAGE_KEY = 'tc_table_data_v4';

const topOrganizations = [
  'ТОП (Академическая)',
  'ТОП (Беляево)',
  'ТОП (Бибирево)',
  'ТОП (Домодедовская)',
  'ТОП (Коломенская)',
  'ТОП (Кутузовская)',
  'ТОП (Митино)',
  'ТОП (Перово)',
  'ТОП (Речной Вокзал)',
  'ТОП (Севастопольская)',
  'ТОП (Тушинская)',
  'ТОП (Шаболовская)',
  'ТОП (Щелковская)',
  'ТОП (Юго-Западная)',
  'ТОП Академия (Тимирязевская)',
  'ТОП Школа (Тимирязевская)',
  'ТОП (Балашиха)',
  'ТОП (Воскресенск)',
  'ТОП (Люберцы)',
  'ТОП (Мытищи)',
  'ТОП (Наро-Фоминск)',
  'ТОП (Ногинск)',
  'ТОП (Пушкино)',
  'ТОП (Реутов)',
  'ТОП (Химки)',
  'ТОП (Щелково)',
  'ТОП Колледж (Балашиха)',
  'ТОП Колледж (Пушкино)',
  'ТОП Универ (Перово)',
  'ТОП Школа (Балашиха)',
  'ТОП Школа (Новые Черемушки)'
];

const getInitialData = (): TCRow[] => {
  try {
    const stored = localStorage.getItem(TC_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load TC data:', error);
  }
  
  return topOrganizations.map((org, index) => ({
    id: index + 1,
    organization: org,
    column2: '',
    column3: ''
  }));
};

export default function TCSection() {
  const [data, setData] = useState<TCRow[]>(getInitialData);
  const [editingCell, setEditingCell] = useState<{ id: number; column: 'column2' | 'column3' } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(TC_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save TC data:', error);
    }
  }, [data]);

  const startEdit = (row: TCRow, column: 'column2' | 'column3') => {
    setEditingCell({ id: row.id, column });
    setEditValue(row[column]);
  };

  const saveEdit = () => {
    if (!editingCell) return;
    
    setData(data.map(row => 
      row.id === editingCell.id 
        ? { ...row, [editingCell.column]: editValue }
        : row
    ));
    
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg md:text-xl font-semibold text-gray-700">Таблица ТЦ</h3>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Организация
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                ТЦ
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Дата работы
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                  {row.organization}
                </td>
                <td className="px-4 py-3">
                  {editingCell?.id === row.id && editingCell.column === 'column2' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Icon name="Check" size={18} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Icon name="X" size={18} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEdit(row, 'column2')}
                      className="text-sm text-gray-600 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded min-h-[28px] flex items-center"
                    >
                      {row.column2 || <span className="text-gray-400 italic">Нажмите для ввода</span>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingCell?.id === row.id && editingCell.column === 'column3' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Icon name="Check" size={18} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Icon name="X" size={18} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEdit(row, 'column3')}
                      className="text-sm text-gray-600 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded min-h-[28px] flex items-center"
                    >
                      {row.column3 || <span className="text-gray-400 italic">Нажмите для ввода</span>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}