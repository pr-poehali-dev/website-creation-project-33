import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import PhotoCapture from './PhotoCapture';
import DayResultsDialog from './DayResultsDialog';

interface EndShiftSectionProps {
  endShiftPhotoOpen: boolean;
  setEndShiftPhotoOpen: (open: boolean) => void;
  dayResultsOpen: boolean;
  setDayResultsOpen: (open: boolean) => void;
  onEndShift: (photoUrl: string) => Promise<void>;
  todayContactsCount: number;
}

export default function EndShiftSection({
  endShiftPhotoOpen,
  setEndShiftPhotoOpen,
  dayResultsOpen,
  setDayResultsOpen,
  onEndShift,
  todayContactsCount
}: EndShiftSectionProps) {
  return (
    <>
      <div className="flex justify-center">
        <button
          onClick={async () => {
            await onEndShift('');
            setDayResultsOpen(true);
          }}
          className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2 sm:gap-3"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Icon name="LogOut" size={22} className="sm:w-[24px] sm:h-[24px]" />
          <span>Завершить смену</span>
        </button>
      </div>

      <DayResultsDialog
        open={dayResultsOpen}
        onClose={() => setDayResultsOpen(false)}
        contactsCount={todayContactsCount}
      />

      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent className="max-w-md bg-white !border-0 shadow-2xl rounded-2xl p-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-red-100">
                <Icon name="AlertCircle" size={48} className="text-red-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900">Доступ ограничен</h3>
            <p className="text-center text-gray-600">
              Для получения доступа к этой функции свяжитесь с Максимом
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {}}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
            >
              Понятно
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}