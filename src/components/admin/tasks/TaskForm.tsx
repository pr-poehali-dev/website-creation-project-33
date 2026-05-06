import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TASKS_API, RESPONSIBLES, Category } from './tasksTypes';

interface TaskFormProps {
  visible: boolean;
  categories: Category[];
  onCategoryAdded: (cat: Category) => void;
  onTaskCreated: () => void;
  onClose: () => void;
}

export default function TaskForm({ visible, categories, onCategoryAdded, onTaskCreated, onClose }: TaskFormProps) {
  const [fText, setFText]         = useState('');
  const [fResp, setFResp]         = useState('');
  const [fCat, setFCat]           = useState<number | ''>('');
  const [newCat, setNewCat]       = useState('');
  const [showCat, setShowCat]     = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [saving, setSaving]       = useState(false);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    setAddingCat(true);
    try {
      const d = await (await fetch(TASKS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_category', name: newCat.trim() }) })).json();
      if (d.category) { onCategoryAdded(d.category); setFCat(d.category.id); setNewCat(''); setShowCat(false); }
    } finally { setAddingCat(false); }
  };

  const submit = async () => {
    if (!fText.trim() || !fResp) return;
    setSaving(true);
    try {
      await fetch(TASKS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_task', text: fText.trim(), responsible: fResp, category_id: fCat || null }) });
      setFText(''); setFResp(''); setFCat('');
      onClose();
      onTaskCreated();
    } finally { setSaving(false); }
  };

  return (
    <div className={`overflow-hidden transition-all duration-500 ${visible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Новая задача</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Ответственный *</label>
            <Select value={fResp} onValueChange={setFResp}>
              <SelectTrigger className="h-9 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
                <SelectValue placeholder="— выберите —" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {RESPONSIBLES.map(r => <SelectItem key={r} value={r} className="text-gray-700">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Классификация</label>
            <div className="flex gap-2">
              <Select value={fCat === '' ? '_none' : String(fCat)} onValueChange={v => setFCat(v === '_none' ? '' : Number(v))}>
                <SelectTrigger className="flex-1 h-9 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
                  <SelectValue placeholder="— не указана —" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="_none" className="text-gray-400">— не указана —</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-gray-700">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <button onClick={() => setShowCat(v => !v)} className="h-9 px-3 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 rounded-lg transition-all">
                <Icon name="Plus" size={14} />
              </button>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${showCat ? 'max-h-12 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
              <div className="flex gap-2">
                <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()}
                  placeholder="Название..." className="flex-1 h-8 px-3 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-gray-400 transition-all" />
                <button onClick={addCategory} disabled={addingCat || !newCat.trim()}
                  className="h-8 px-3 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 transition-all">
                  {addingCat ? <Icon name="Loader2" size={12} className="animate-spin" /> : 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Текст задачи *</label>
          <textarea value={fText} onChange={e => setFText(e.target.value)} placeholder="Описание задачи..." rows={3}
            className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none placeholder:text-gray-400" />
        </div>

        <button onClick={submit} disabled={saving || !fText.trim() || !fResp}
          className="w-full h-9 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
          {saving ? <><Icon name="Loader2" size={14} className="animate-spin" /> Сохранение...</> : <><Icon name="Check" size={14} /> Добавить задачу</>}
        </button>
      </div>
    </div>
  );
}
