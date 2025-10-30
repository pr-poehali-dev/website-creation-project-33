import Icon from '@/components/ui/icon';

interface AddOrganizationFormProps {
  selectedDate: string;
  newOrg: string;
  newNotes: string;
  onNewOrgChange: (value: string) => void;
  onNewNotesChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function AddOrganizationForm({
  selectedDate,
  newOrg,
  newNotes,
  onNewOrgChange,
  onNewNotesChange,
  onSubmit,
  onCancel
}: AddOrganizationFormProps) {
  return (
    <div className="bg-white rounded-lg border-2 border-purple-500 p-3 md:p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base md:text-lg font-semibold text-gray-800">
          Добавить организацию на {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <Icon name="X" size={20} className="text-gray-600" />
        </button>
      </div>
      
      <div className="space-y-3">
        <input
          type="text"
          value={newOrg}
          onChange={(e) => onNewOrgChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSubmit()}
          placeholder="Название организации..."
          className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
          autoFocus
        />
        
        <textarea
          value={newNotes}
          onChange={(e) => onNewNotesChange(e.target.value)}
          placeholder="Примечания (необязательно)..."
          className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base resize-none"
          rows={2}
        />
        
        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={!newOrg.trim()}
            className="flex-1 md:flex-none px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm md:text-base"
          >
            Добавить
          </button>
          <button
            onClick={onCancel}
            className="flex-1 md:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm md:text-base"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}