import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface ArchiveImportProps {
  sessionToken: string;
}

export default function ArchiveImport({ sessionToken }: ArchiveImportProps) {
  const [csvData, setCsvData] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Вставьте CSV данные',
        variant: 'destructive'
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const lines = csvData.trim().split('\n');
      
      const data = lines.map(line => {
        const parts = line.split('\t');
        if (parts.length < 4) return null;
        
        return {
          datetime: parts[0].trim(),
          organization: parts[1].trim(),
          user: parts[2].trim(),
          count: parts[3].trim()
        };
      }).filter(Boolean);

      const response = await fetch('https://functions.poehali.dev/94c5eb5a-9182-4dc0-82f0-b4ddbb44acaf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': sessionToken
        },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка импорта');
      }

      const importResult = await response.json();
      setResult(importResult);

      toast({
        title: 'Успешно!',
        description: `Импортировано ${importResult.imported} записей`
      });

      setCsvData('');
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
    <Card className="bg-white border-gray-200 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-gray-900">
          <div className="p-2 rounded-lg bg-blue-100">
            <Icon name="Upload" size={20} className="text-blue-600" />
          </div>
          Импорт архивных данных
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CSV данные (формат: дата\tорганизация\tпользователь\tколичество)
          </label>
          <Textarea
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="15.03.2025 18:09:53	Кид Форс Выхино	Вероника	3
18.03.2025 22:19:14	ШИЯ Солнцево	Арсен	15"
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Вставьте данные из Excel/таблицы. Столбцы должны быть разделены табуляцией.
          </p>
        </div>

        <Button
          onClick={handleImport}
          disabled={importing || !csvData.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {importing ? (
            <>
              <Icon name="Loader2" size={16} className="animate-spin mr-2" />
              Импортируем...
            </>
          ) : (
            <>
              <Icon name="Upload" size={16} className="mr-2" />
              Импортировать данные
            </>
          )}
        </Button>

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-semibold text-green-800">
              ✅ Импортировано: {result.imported} записей
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-orange-800 mb-2">
                  ⚠️ Ошибки ({result.errors.length}):
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((err: string, idx: number) => (
                    <p key={idx} className="text-xs text-gray-600 font-mono">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
