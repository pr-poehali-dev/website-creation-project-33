import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface BlockedUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BlockedUserModal({ open, onOpenChange }: BlockedUserModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
          >
            Понятно
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
