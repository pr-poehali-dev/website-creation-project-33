import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ConfirmDeleteState } from './types';

interface DeleteConfirmDialogProps {
  confirmDelete: ConfirmDeleteState | null;
  setConfirmDelete: (value: ConfirmDeleteState | null) => void;
  removeSlot: () => void;
}

export default function DeleteConfirmDialog({
  confirmDelete,
  setConfirmDelete,
  removeSlot
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить смену?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить смену <strong>{confirmDelete?.slotLabel}</strong> для <strong>{confirmDelete?.userName}</strong>?
            <br />
            Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={removeSlot} className="bg-red-600 hover:bg-red-700">
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
