import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface ArchiveImportProps {
  sessionToken: string;
  onImportSuccess?: () => void;
}

const BULK_DATA = `15.03.2025	Кид Форс Выхино	Вероника	3
18.03.2025	ШИЯ Солнцево	Арсен	15
22.03.2025	Воркаут Царицыно	Наталия	4
23.03.2025	ШИЯ Солнцево	Арсен	5
26.03.2025	ШИЯ Солнцево	Влад	10
26.03.2025	ШИЯ Солнцево	Злата	9
28.03.2025	Топ Беляево	Марина	7
28.03.2025	Воркаут Царицыно 	Дмитрий	5
29.03.2025	Худ.гимн. Люблино	Александр	19
31.03.2025	ШИЯ Солнцево	Влад	17`;

export default function ArchiveImport({ sessionToken, onImportSuccess }: ArchiveImportProps) {
  const [csvData, setCsvData] = useState('');
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');
  const [previewCount, setPreviewCount] = useState<number>(0);
  
  const handleBulkImport = async () => {
    setCsvData(BULK_DATA);
    setPreviewCount(10);
    toast({
      title: 'Данные загружены',
      description: 'Нажмите "Импортировать" для начала'
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast({
        title: 'Ошибка',
        description: 'Выберите CSV или TXT файл',
        variant: 'destructive'
      });
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      
      const lines = text.trim().split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.toLowerCase().startsWith('дата') && !trimmed.toLowerCase().startsWith('date');
      });
      
      setPreviewCount(lines.length);
      
      toast({
        title: 'Файл загружен',
        description: `Найдено ${lines.length} записей для импорта`
      });
    };
    reader.onerror = () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось прочитать файл',
        variant: 'destructive'
      });
    };
    reader.readAsText(file);
  };

  const handleClearArchive = async () => {
    if (!confirm('Удалить ВСЕ архивные данные? Это действие необратимо!')) {
      return;
    }

    setClearing(true);
    setResult(null);

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

      if (onImportSuccess) {
        onImportSuccess();
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

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Вставьте данные',
        variant: 'destructive'
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const lines = csvData.trim().split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.toLowerCase().startsWith('дата') && !trimmed.toLowerCase().startsWith('date');
      });
      
      const data = lines
        .map((line) => {
          const parts = line.split('\t').map(p => p.trim());

          if (parts.length < 3) {
            console.warn('Skipping invalid line:', line);
            return null;
          }
          
          const datetime = parts[0];
          const organization = parts[1] || '';
          const user = parts[2];
          const countStr = parts[3] || '1';
          
          if (!datetime || !user) {
            console.warn('Missing required fields:', { datetime, user });
            return null;
          }
          
          const count = parseInt(countStr, 10);
          if (isNaN(count) || count < 1) {
            console.warn('Invalid count:', countStr);
            return null;
          }
          
          return {
            datetime,
            organization,
            user,
            count
          };
        })
        .filter(Boolean);

      if (data.length === 0) {
        throw new Error('Нет валидных данных для импорта');
      }

      console.log('Sending data:', data);

      const response = await fetch('https://functions.poehali.dev/94c5eb5a-9182-4dc0-82f0-b4ddbb44acaf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
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
      setFileName('');
      setPreviewCount(0);
      
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
        <div className="space-y-4">
          <div className="flex gap-3">
            <label className="flex-1">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-input"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <Icon name="FileUp" size={16} className="mr-2" />
                {fileName || 'Выбрать файл'}
              </Button>
            </label>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">или</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Вставить данные вручную
            </label>
            <Textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="15.03.2025	Кид Форс Выхино	Вероника	3
18.03.2025	ШИЯ Солнцево	Арсен	15
22.03.2025	Воркаут Царицыно	Наталия	4"
              rows={15}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Формат: дата[TAB]организация[TAB]промоутер[TAB]количество
            </p>
          </div>
        </div>

        {previewCount > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Готово к импорту: {previewCount} записей
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={importing || !csvData.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {importing ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Импортирую...
              </>
            ) : (
              <>
                <Icon name="Upload" size={16} className="mr-2" />
                Импортировать
              </>
            )}
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={handleClearArchive}
          disabled={clearing}
          className="w-full border-red-300 text-red-700 hover:bg-red-50"
        >
          {clearing ? (
            <>
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              Очищаю...
            </>
          ) : (
            <>
              <Icon name="Trash2" size={16} className="mr-2" />
              Очистить архив
            </>
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.errors && result.errors.length > 0 
              ? 'bg-yellow-50 border border-yellow-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              <Icon 
                name={result.errors && result.errors.length > 0 ? "AlertTriangle" : "CheckCircle2"} 
                size={20} 
                className={result.errors && result.errors.length > 0 ? "text-yellow-600" : "text-green-600"}
              />
              <div className="flex-1">
                <p className={`font-medium ${
                  result.errors && result.errors.length > 0 ? 'text-yellow-800' : 'text-green-800'
                }`}>
                  Импортировано: {result.imported} записей
                </p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Ошибки ({result.errors.length}):
                    </p>
                    <div className="text-xs text-yellow-700 space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((error: string, index: number) => (
                        <div key={index} className="font-mono">{error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}