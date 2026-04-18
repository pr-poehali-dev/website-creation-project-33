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
      <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">Завершить смену</p>
          <p className="text-xs text-gray-400 mt-0.5">Сделайте фото для отчёта</p>
        </div>
        <button
          onClick={() => setEndShiftPhotoOpen(true)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          <Icon name="LogOut" size={16} />
          Завершить
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