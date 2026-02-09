import Icon from '@/components/ui/icon';
import PhotoCapture from './PhotoCapture';

interface EndShiftSectionProps {
  endShiftPhotoOpen: boolean;
  setEndShiftPhotoOpen: (open: boolean) => void;
  onShiftEnd?: () => void;
  organizationId: number | null;
}

export default function EndShiftSection({
  endShiftPhotoOpen,
  setEndShiftPhotoOpen,
  onShiftEnd,
  organizationId
}: EndShiftSectionProps) {
  return (
    <>
      <div className="flex justify-center">
        <button
          onClick={() => setEndShiftPhotoOpen(true)}
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

      {organizationId && (
        <PhotoCapture
          open={endShiftPhotoOpen}
          onOpenChange={setEndShiftPhotoOpen}
          type="end"
          organizationId={organizationId}
          onSuccess={(contactsCount) => {
            onShiftEnd?.();
          }}
        />
      )}


    </>
  );
}