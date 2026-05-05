import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { AssignedPromoter, PromoterOption, inputCls } from './promoterAssignTypes';
import { useOrganizations } from '@/hooks/useAdminData';

interface PromoterFormProps {
  assigned: AssignedPromoter;
  availablePromoters: PromoterOption[];
  onSave: (data: Partial<AssignedPromoter>) => void;
  onRemove: () => void;
  isSaving: boolean;
  isNew?: boolean;
}

export default function PromoterForm({
  assigned, availablePromoters, onSave, onRemove, isSaving, isNew,
}: PromoterFormProps) {
  const { data: allOrganizations = [] } = useOrganizations();
  const [promoterId, setPromoterId] = useState(assigned.promoter_id);
  const [orgName, setOrgName] = useState(assigned.org_name ?? '');
  const [address, setAddress] = useState(assigned.address ?? '');
  const [leaflets, setLeaflets] = useState(assigned.leaflets ?? '');

  // Подставляем flyer_location когда загрузились организации и листовки ещё не заданы
  useEffect(() => {
    if (!leaflets && orgName && allOrganizations.length > 0) {
      const org = allOrganizations.find((o: { name: string; flyer_location?: string }) => o.name === orgName);
      if (org?.flyer_location) setLeaflets(org.flyer_location);
    }
  }, [allOrganizations]);

  const handleOrgNameChange = (value: string) => {
    setOrgName(value);
    const org = allOrganizations.find((o: { name: string; flyer_location?: string }) => o.name === value);
    setLeaflets(org?.flyer_location ?? '');
  };

  const isDirty =
    promoterId !== assigned.promoter_id ||
    orgName !== (assigned.org_name ?? '') ||
    address !== (assigned.address ?? '') ||
    leaflets !== (assigned.leaflets ?? '');

  const handleSave = () => {
    onSave({
      promoter_id: promoterId,
      org_name: orgName || null,
      place_type: assigned.place_type,
      address: address || null,
      leaflets: leaflets || null,
      time_slot: assigned.time_slot,
    });
  };

  const choices = availablePromoters.filter(p => p.available || p.id === assigned.promoter_id);

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={promoterId}
          onChange={e => setPromoterId(Number(e.target.value))}
          className="flex-1 h-9 pl-3 pr-8 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-400 appearance-none"
        >
          {choices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          {!choices.find(p => p.id === assigned.promoter_id) && (
            <option value={assigned.promoter_id}>{assigned.promoter_name}</option>
          )}
        </select>
        <button onClick={onRemove} className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center flex-shrink-0 transition-all">
          <Icon name="Trash2" size={13} className="text-red-400" />
        </button>
      </div>

      <div className="relative">
        <input value={orgName} onChange={e => handleOrgNameChange(e.target.value)} placeholder="Организация" className={inputCls} list="org-suggestions" />
        <datalist id="org-suggestions">
          {allOrganizations.map((o: { id: number; name: string }) => (
            <option key={o.id} value={o.name} />
          ))}
        </datalist>
        <Icon name="Building2" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
      </div>

      <div className="relative">
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Где собирать контакты" className={inputCls} />
        <Icon name="Navigation" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
      </div>

      <div className="relative">
        <input value={leaflets} onChange={e => setLeaflets(e.target.value)} placeholder="Где взять листовки" className={inputCls} />
        <Icon name="FileText" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
      </div>

      {(isDirty || isNew) && (
        <button onClick={handleSave} disabled={isSaving}
          className="w-full h-9 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-all">
          {isSaving ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Check" size={13} />}
          {isNew ? 'Добавить' : 'Сохранить'}
        </button>
      )}
    </div>
  );
}