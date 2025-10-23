import React from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface ArchiveCsvUploadProps {
  sessionToken: string;
  onImportSuccess?: () => void;
  parseCsvText: (text: string) => any[];
  importing: boolean;
  setImporting: (value: boolean) => void;
}

export default function ArchiveCsvUpload({ sessionToken, onImportSuccess, parseCsvText, importing, setImporting }: ArchiveCsvUploadProps) {
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const data = parseCsvText(text);

      console.log('Sending CSV data:', data);

      const response = await fetch('https://functions.poehali.dev/94c5eb5a-9182-4dc0-82f0-b4ddbb44acaf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.error || 'Ошибка импорта');
        } catch (err) {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const importResult = await response.json();
      console.log('Import result:', importResult);

      toast({
        title: 'Успешно!',
        description: `Импортировано: ${importResult.imported} записей из ${data.length}`
      });

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error: any) {
      console.error('CSV import error:', error);
      toast({
        title: 'Ошибка импорта CSV',
        description: error.message || 'Не удалось импортировать данные',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <label className="block">
      <div className="flex items-center justify-center gap-2 md:gap-3 cursor-pointer">
        <Icon name="FileUp" size={20} className="md:w-6 md:h-6 text-blue-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-blue-900 text-sm md:text-base">Загрузить CSV файл</p>
          <p className="text-xs md:text-sm text-blue-700">Для массового импорта</p>
        </div>
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={handleCsvUpload}
        disabled={importing}
        className="hidden"
      />
    </label>
  );
}