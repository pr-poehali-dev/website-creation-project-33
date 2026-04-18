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
    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${visible ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="bg-slate-900/80 ring-1 ring-slate-700/60 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Icon name="PlusCircle" size={15} className="text-cyan-400" />
          Новая задача
        </h3>

        {/* Ответственный */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Ответственный *</label>
          <select
            value={formResponsible}
            onChange={e => setFormResponsible(e.target.value)}
            className="w-full h-10 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-cyan-500/50 focus:ring-2 transition-all"
          >
            <option value="">— выберите —</option>
            {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Текст задачи */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Текст задачи *</label>
          <textarea
            value={formText}
            onChange={e => setFormText(e.target.value)}
            placeholder="Описание задачи..."
            rows={3}
            className="w-full px-3 py-2.5 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none placeholder:text-slate-600"
          />
        </div>

        {/* Классификация */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Классификация</label>
          <div className="flex gap-2">
            <select
              value={formCategoryId}
              onChange={e => setFormCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="flex-1 h-10 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-cyan-500/50 focus:ring-2 transition-all"
            >
              <option value="">— не указана —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              onClick={() => setShowNewCat(v => !v)}
              className="h-10 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-400 hover:text-cyan-400 rounded-xl transition-all hover:ring-cyan-500/30"
              title="Создать классификацию"
            >
              <Icon name="Plus" size={15} />
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-300 ${showNewCat ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="flex gap-2">
              <input
                value={newCatInput}
                onChange={e => setNewCatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                placeholder="Название классификации..."
                className="flex-1 h-9 px-3 bg-slate-800/60 ring-1 ring-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
              />
              <button
                onClick={handleAddCategory}
                disabled={addingCat || !newCatInput.trim()}
                className="h-9 px-3 bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30 rounded-xl text-xs font-semibold hover:bg-cyan-500/30 transition-all disabled:opacity-50"
              >
                {addingCat ? <Icon name="Loader2" size={13} className="animate-spin" /> : 'Добавить'}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || !formText.trim() || !formResponsible}
          className="w-full h-10 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
        >
          {saving
            ? <><Icon name="Loader2" size={15} className="animate-spin" /> Сохранение...</>
            : <><Icon name="Check" size={15} /> Добавить задачу</>
          }
        </button>
      </div>
    </div>
  );
}