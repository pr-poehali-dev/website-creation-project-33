import { useEffect, useState } from 'react';

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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            История смен
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-2">
          <p className="text-sm text-gray-600">{workerName}</p>
          <p className="text-sm font-medium text-gray-900">{orgName}</p>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-500 italic text-center py-4">Загрузка...</p>
          ) : shiftDetails.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-4">Нет данных по сменам</p>
          ) : (
            shiftDetails.map((shift, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-700">
                  {formatDate(shift.date)}
                </span>
                <span className="text-lg font-bold text-green-600">
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
