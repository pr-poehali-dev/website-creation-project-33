import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ConfirmDeleteState } from './types';

interface DeleteConfirmDialogProps {
  confirmDelete: ConfirmDeleteState | null;
  setConfirmDelete: (value: ConfirmDeleteState | null) => void;
  removeSlot: () => void;
}

const ADMIN_PASSWORD = '955650';

export default function DeleteConfirmDialog({
  confirmDelete,
  setConfirmDelete,
  removeSlot
}: DeleteConfirmDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClose = () => {
    setConfirmDelete(null);
    setPassword('');
    setError(false);
  };

  const handleConfirm = () => {
    if (password === ADMIN_PASSWORD) {
      setPassword('');
      setError(false);
      removeSlot();
    } else {
      setError(true);
    }
  };

  return (
    <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить смену?</AlertDialogTitle>
          <AlertDialogDescription>
            Смена <strong>{confirmDelete?.slotLabel}</strong> для <strong>{confirmDelete?.userName}</strong>.
            Введите пароль для подтверждения.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Пароль администратора"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            className={error ? 'border-red-500 pr-10' : 'pr-10'}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
          </button>
          {error && (
            <p className="text-red-500 text-xs mt-1">Неверный пароль</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Отмена</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={!password}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Удалить
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
