import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

interface ShiftDetailsModalProps {
  workerName: string;
  workerEmail: string;
  orgName: string;
  onClose: () => void;
}

interface ShiftDetail {
  date: string;
  contacts: number;
}

export default function ShiftDetailsModal({ workerName, workerEmail, orgName, onClose }: ShiftDetailsModalProps) {
  const [shiftDetails, setShiftDetails] = useState<ShiftDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShiftDetails();
  }, [workerEmail, orgName]);

  const loadShiftDetails = async () => {
    try {
      const response = await fetch(
        'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': localStorage.getItem('session_token') || '',
          },
          body: JSON.stringify({
            action: 'get_user_org_shift_details',
            email: workerEmail,
            org_name: orgName
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        setShiftDetails(data.shift_details || []);
      }
    } catch (error) {
      console.error('Error loading shift details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border-2 border-slate-700 rounded-xl p-4 md:p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-bold text-slate-100 flex items-center gap-2">
            <Icon name="History" size={20} className="text-cyan-400 md:w-6 md:h-6" />
            История смен
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        
        <div className="mb-3">
          <p className="text-xs md:text-sm text-slate-400 flex items-center gap-1.5">
            <Icon name="User" size={14} className="text-cyan-400" />
            {workerName}
          </p>
          <p className="text-xs md:text-sm font-medium text-slate-200 flex items-center gap-1.5 mt-1">
            <Icon name="Building2" size={14} className="text-cyan-400" />
            {orgName}
          </p>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
          {loading ? (
            <div className="text-center py-8">
              <Icon name="Loader2" size={36} className="mx-auto mb-2 text-cyan-400 animate-spin" />
              <p className="text-xs md:text-sm text-slate-500 italic">Загрузка...</p>
            </div>
          ) : shiftDetails.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="Inbox" size={36} className="mx-auto mb-2 text-slate-600" />
              <p className="text-xs md:text-sm text-slate-500 italic">Нет данных по сменам</p>
            </div>
          ) : (
            shiftDetails.map((shift, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg"
              >
                <span className="text-xs md:text-sm text-slate-300 flex items-center gap-2">
                  <Icon name="Calendar" size={14} className="text-cyan-400" />
                  {formatDate(shift.date)}
                </span>
                <span className="text-lg font-bold text-emerald-400">
                  {shift.contacts}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

<style>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgb(30 41 59 / 0.5);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgb(71 85 105);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgb(100 116 139);
  }
`}</style>