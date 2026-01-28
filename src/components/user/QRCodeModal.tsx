import { Dialog, DialogContent } from '@/components/ui/dialog';

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QRCodeModal({ open, onOpenChange }: QRCodeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white !border-0 shadow-2xl rounded-2xl p-8">
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-2xl font-bold text-gray-900">QR-код</h2>
          <div 
            onClick={() => onOpenChange(false)}
            className="p-4 bg-gray-50 rounded-2xl shadow-lg cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <img
              src="https://cdn.poehali.dev/files/image-fotor-20260117124937.jpg"
              alt="QR Code"
              className="w-64 h-64"
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Нажмите на QR-код чтобы закрыть
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}