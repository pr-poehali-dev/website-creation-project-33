import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ArchivePasteImportProps {
  sessionToken: string;
  onImportSuccess?: () => void;
  parseCsvText: (text: string) => any[];
}

export default function ArchivePasteImport({ sessionToken, onImportSuccess, parseCsvText }: ArchivePasteImportProps) {
  const [pasteData, setPasteData] = useState('');
  const [importing, setImporting] = useState(false);

  const handlePasteImport = async () => {
    if (!pasteData.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Вставьте данные из Excel',
        variant: 'destructive'
      });
      return;
    }

    setImporting(true);

    try {
      const data = parseCsvText(pasteData);

      if (!data || data.length === 0) {
        throw new Error('Не удалось распарсить данные. Проверьте формат таблицы.');
      }

      console.log('Sending paste data:', data);

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
        } catch (e) {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const importResult = await response.json();
      console.log('Import result:', importResult);

      toast({
        title: 'Успешно!',
        description: `Импортировано: ${importResult.imported} записей из ${data.length}`
      });

      setPasteData('');
      
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error: any) {
      console.error('Paste import error:', error);
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
    <div>
      <p className="font-semibold text-blue-900 mb-2">Вставить из Excel</p>
      <p className="text-sm text-blue-700 mb-3">Скопируйте таблицу с заголовками: Дата | Организация | Промоутер | Контакты</p>
      <textarea
        value={pasteData}
        onChange={(e) => setPasteData(e.target.value)}
        placeholder="Вставьте данные из Excel (Ctrl+C → Ctrl+V)"
        disabled={importing}
        className="w-full h-32 p-3 border border-blue-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <Button
        onClick={handlePasteImport}
        disabled={importing || !pasteData.trim()}
        className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {importing ? 'Импорт...' : 'Импортировать данные'}
      </Button>
    </div>
  );
}