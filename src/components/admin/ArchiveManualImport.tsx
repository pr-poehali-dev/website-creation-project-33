import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface ArchiveManualImportProps {
  sessionToken: string;
  onImportSuccess?: () => void;
}

export default function ArchiveManualImport({ sessionToken, onImportSuccess }: ArchiveManualImportProps) {
  const [date, setDate] = useState('');
  const [organization, setOrganization] = useState('');
  const [promoter, setPromoter] = useState('');
  const [quantity, setQuantity] = useState('');
  const [importing, setImporting] = useState(false);

  const clearForm = () => {
    setDate('');
    setOrganization('');
    setPromoter('');
    setQuantity('');
  };

  const handleImport = async () => {
    if (!date.trim() || !promoter.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните дату и промоутера',
        variant: 'destructive'
      });
      return;
    }

    setImporting(true);

    try {
      const count = parseInt(quantity, 10);
      if (isNaN(count) || count < 1) {
        throw new Error('Количество должно быть числом больше 0');
      }

      const data = [{
        datetime: date.trim(),
        organization: organization.trim() || '',
        user: promoter.trim(),
        count
      }];

      console.log('Sending data:', data);

      const response = await fetch('https://functions.poehali.dev/94c5eb5a-9182-4dc0-82f0-b4ddbb44acaf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({ data })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.error || 'Ошибка импорта');
        } catch (e) {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const importResult = await response.json();
      console.log('Import result:', importResult);

      toast({
        title: 'Успешно!',
        description: `Импортировано: ${importResult.imported} записей`
      });

      clearForm();
      
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Ошибка импорта',
        description: error.message || 'Не удалось импортировать данные',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
          Дата (формат: дд.мм.гггг)
        </label>
        <Input
          type="text"
          placeholder="22.10.2025"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={importing}
          className="w-full text-xs md:text-sm h-9 md:h-10"
        />
      </div>

      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
          Организация (опционально)
        </label>
        <Input
          type="text"
          placeholder="Название организации"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          disabled={importing}
          className="w-full text-xs md:text-sm h-9 md:h-10"
        />
      </div>

      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
          Промоутер *
        </label>
        <Input
          type="text"
          placeholder="Имя промоутера"
          value={promoter}
          onChange={(e) => setPromoter(e.target.value)}
          disabled={importing}
          className="w-full text-xs md:text-sm h-9 md:h-10"
        />
      </div>

      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
          Количество контактов *
        </label>
        <Input
          type="number"
          placeholder="10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={importing}
          min="1"
          className="w-full text-xs md:text-sm h-9 md:h-10"
        />
      </div>

      <Button
        onClick={handleImport}
        disabled={importing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm h-9 md:h-10"
      >
        {importing ? 'Импорт...' : 'Добавить запись'}
      </Button>
    </div>
  );
}