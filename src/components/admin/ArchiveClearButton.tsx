import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface ArchiveClearButtonProps {
  sessionToken: string;
  onClearSuccess?: () => void;
}

export default function ArchiveClearButton({ sessionToken, onClearSuccess }: ArchiveClearButtonProps) {
  const [clearing, setClearing] = useState(false);

  const handleClearArchive = async () => {
    if (!confirm('Удалить ВСЕ архивные данные? Это действие необратимо!')) {
      return;
    }

    setClearing(true);

    try {
      const response = await fetch('https://functions.poehali.dev/3ec36009-afec-4784-a580-4723897402b3', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка очистки');
      }

      const clearResult = await response.json();

      toast({
        title: 'Архив очищен',
        description: `Удалено ${clearResult.deleted} записей`
      });

      if (onClearSuccess) {
        onClearSuccess();
      }
    } catch (error: any) {
      console.error('Clear error:', error);
      toast({
        title: 'Ошибка очистки',
        description: error.message || 'Не удалось очистить архив',
        variant: 'destructive'
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <Button
      onClick={handleClearArchive}
      disabled={clearing}
      variant="destructive"
      className="w-full flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm h-9 md:h-10"
    >
      <Icon name="Trash2" size={14} className="md:w-[18px] md:h-[18px]" />
      {clearing ? 'Очистка...' : 'Очистить весь архив'}
    </Button>
  );
}