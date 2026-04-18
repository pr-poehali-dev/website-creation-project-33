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
      <button
        onClick={() => setEndShiftPhotoOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-semibold px-4 py-3 rounded-2xl transition-all"
      >
        <Icon name="LogOut" size={16} />
        Завершить смену
      </button>

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