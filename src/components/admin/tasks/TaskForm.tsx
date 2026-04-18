import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { TASKS_API, RESPONSIBLES, Category } from './tasksTypes';

interface TaskFormProps {
  visible: boolean;
  categories: Category[];
  onCategoryAdded: (cat: Category) => void;
  onTaskCreated: () => void;
  onClose: () => void;
}

export default function TaskForm({ visible, categories, onCategoryAdded, onTaskCreated, onClose }: TaskFormProps) {
  const [formText, setFormText] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [newCatInput, setNewCatInput] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddCategory = async () => {
    const name = newCatInput.trim();
    if (!name) return;
    setAddingCat(true);
    try {
      const res = await fetch(TASKS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_category', name })
      });
      const data = await res.json();
      if (data.category) {
        onCategoryAdded(data.category);
        setFormCategoryId(data.category.id);
        setNewCatInput('');
        setShowNewCat(false);
      }
    } finally {
      setAddingCat(false);
    }
  };

  const handleSubmit = async () => {
    if (!formText.trim() || !formResponsible) return;
    setSaving(true);
    try {
      await fetch(TASKS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_task',
          text: formText.trim(),
          responsible: formResponsible,
          category_id: formCategoryId || null
        })
      });
      setFormText(''); setFormResponsible(''); setFormCategoryId('');
      onClose();
      onTaskCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="overflow-hidden transition-all duration-400 ease-in-out"
      style={{ maxHeight: visible ? '600px' : '0', opacity: visible ? 1 : 0 }}
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-gray-800">Новая задача</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ответственный */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ответственный *</label>
            <select
              value={formResponsible}
              onChange={e => setFormResponsible(e.target.value)}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
            >
              <option value="">— выберите —</option>
              {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Классификация */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Классификация</label>
            <div className="flex gap-2">
              <select
                value={formCategoryId}
                onChange={e => setFormCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
              >
                <option value="">— не указана —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                onClick={() => setShowNewCat(v => !v)}
                className="h-10 px-3 bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-700 rounded-xl transition-all hover:bg-gray-100"
                title="Новая классификация"
              >
                <Icon name="Plus" size={15} />
              </button>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${showNewCat ? 'max-h-14 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
              <div className="flex gap-2">
                <input
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Название..."
                  className="flex-1 h-9 px-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 placeholder:text-gray-400 transition-all"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={addingCat || !newCatInput.trim()}
                  className="h-9 px-3 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 disabled:opacity-40 transition-all"
                >
                  {addingCat ? <Icon name="Loader2" size={13} className="animate-spin" /> : 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Текст задачи */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Текст задачи *</label>
          <textarea
            value={formText}
            onChange={e => setFormText(e.target.value)}
            placeholder="Опишите задачу..."
            rows={3}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all resize-none placeholder:text-gray-400"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || !formText.trim() || !formResponsible}
          className="w-full h-11 bg-gray-900 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saving
            ? <><Icon name="Loader2" size={15} className="animate-spin" /> Сохранение...</>
            : <><Icon name="Plus" size={15} /> Добавить задачу</>
          }
        </button>
      </div>
    </div>
  );
}
