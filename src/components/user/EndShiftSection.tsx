import PhotoCapture from './PhotoCapture';

interface EndShiftSectionProps {
  endShiftPhotoOpen: boolean;
  setEndShiftPhotoOpen: (open: boolean) => void;
  onShiftEnd?: () => void;
  organizationId: number | null;
  hideButton?: boolean;
}

export default function EndShiftSection({
  endShiftPhotoOpen,
  setEndShiftPhotoOpen,
  onShiftEnd,
  organizationId,
  hideButton = false,
}: EndShiftSectionProps) {
  return (
    <>
      {organizationId && (
        <PhotoCapture
          open={endShiftPhotoOpen}
          onOpenChange={setEndShiftPhotoOpen}
          type="end"
          organizationId={organizationId}
          onSuccess={() => { onShiftEnd?.(); }}
        />
      )}
    </>
  );
}
