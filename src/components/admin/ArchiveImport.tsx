import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface ArchiveImportProps {
  sessionToken: string;
  onImportSuccess?: () => void;
}

export default function ArchiveImport({ sessionToken, onImportSuccess }: ArchiveImportProps) {
  const [date, setDate] = useState('');
  const [organization, setOrganization] = useState('');
  const [promoter, setPromoter] = useState('');
  const [quantity, setQuantity] = useState('');
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [pasteData, setPasteData] = useState('');

  const clearForm = () => {
    setDate('');
    setOrganization('');
    setPromoter('');
    setQuantity('');
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

  const parseCsvText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
      
    if (lines.length === 0) {
      throw new Error('Данные пустые');
    }

    const headers = lines[0].split('\t').length > 1 
      ? lines[0].split('\t').map(h => h.trim().toLowerCase())
      : lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const separator = lines[0].split('\t').length > 1 ? '\t' : ',';
    
    const data = lines.slice(1).map(line => {
      const values = line.split(separator).map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, i) => {
        if (header.includes('дата') || header === 'datetime') {
          row.datetime = values[i];
        } else if (header.includes('организ') || header === 'organization') {
          row.organization = values[i];
        } else if (header.includes('промоутер') || header === 'user') {
          row.user = values[i];
        } else if (header.includes('контакт') || header.includes('количеств') || header === 'count') {
          row.count = parseInt(values[i], 10) || 1;
        }
      });
      
      return row;
    }).filter(row => row.datetime && row.user);

    return data;
  };

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
    setResult(null);

    try {
      const data = parseCsvText(pasteData);

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
      setResult(importResult);

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

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setImporting(true);
    setResult(null);

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
        } catch (e) {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const importResult = await response.json();
      console.log('Import result:', importResult);
      setResult(importResult);

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
      setCsvFile(null);
      e.target.value = '';
    }
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
    setResult(null);

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
      setResult(importResult);

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
    <Card className="bg-white border-gray-200 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-gray-900">
          <div className="p-2 rounded-lg bg-blue-100">
            <Icon name="Upload" size={20} className="text-blue-600" />
          </div>
          Импорт архивных данных
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-blue-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-blue-50 px-2 text-blue-600">или</span>
            </div>
          </div>

          <label className="block">
            <div className="flex items-center justify-center gap-3 cursor-pointer">
              <Icon name="FileUp" size={24} className="text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Загрузить CSV файл</p>
                <p className="text-sm text-blue-700">Для массового импорта</p>
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
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">или добавьте вручную</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата
            </label>
            <Input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="15.03.2025 или 15.03.2025 18:30"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Организация
            </label>
            <Input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Кид Форс Выхино"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Промоутер
            </label>
            <Input
              type="text"
              value={promoter}
              onChange={(e) => setPromoter(e.target.value)}
              placeholder="Вероника"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Количество
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="3"
              min="1"
              className="w-full"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={importing || !date.trim() || !promoter.trim() || !quantity.trim()}
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
                Добавить запись
              </>
            )}
          </Button>
          
          <Button
            onClick={clearForm}
            variant="outline"
            className="border-gray-300"
          >
            <Icon name="X" size={16} className="mr-2" />
            Очистить
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