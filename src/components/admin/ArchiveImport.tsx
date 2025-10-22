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

export default function ArchiveImport({ sessionToken, onImportSuccess }: ArchiveImportProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [dates, setDates] = useState('');
  const [organizations, setOrganizations] = useState('');
  const [users, setUsers] = useState('');
  const [counts, setCounts] = useState('');
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<any>(null);

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

  const handleNextStep = () => {
    const currentData = step === 1 ? dates : step === 2 ? organizations : step === 3 ? users : counts;
    const lines = currentData.trim().split('\n').filter(l => l.trim());
    
    if (lines.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Вставьте данные',
        variant: 'destructive'
      });
      return;
    }

    if (step === 1) {
      toast({
        title: 'Шаг 1 готов',
        description: `${lines.length} дат сохранено`
      });
      setStep(2);
    } else if (step === 2) {
      const dateLines = dates.trim().split('\n').filter(l => l.trim());
      if (lines.length !== dateLines.length) {
        toast({
          title: 'Ошибка',
          description: `Количество организаций (${lines.length}) не совпадает с количеством дат (${dateLines.length})`,
          variant: 'destructive'
        });
        return;
      }
      toast({
        title: 'Шаг 2 готов',
        description: `${lines.length} организаций сохранено`
      });
      setStep(3);
    } else if (step === 3) {
      const dateLines = dates.trim().split('\n').filter(l => l.trim());
      if (lines.length !== dateLines.length) {
        toast({
          title: 'Ошибка',
          description: `Количество промоутеров (${lines.length}) не совпадает с количеством дат (${dateLines.length})`,
          variant: 'destructive'
        });
        return;
      }
      toast({
        title: 'Шаг 3 готов',
        description: `${lines.length} промоутеров сохранено`
      });
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      const dateLines = dates.trim().split('\n').filter(l => l.trim());
      const orgLines = organizations.trim().split('\n').filter(l => l.trim());
      const userLines = users.trim().split('\n').filter(l => l.trim());
      const countLines = counts.trim().split('\n').filter(l => l.trim());

      if (dateLines.length !== orgLines.length || 
          dateLines.length !== userLines.length || 
          dateLines.length !== countLines.length) {
        throw new Error('Количество строк не совпадает во всех полях');
      }

      const data = dateLines.map((date, index) => ({
        datetime: date.trim(),
        organization: orgLines[index].trim(),
        user: userLines[index].trim(),
        count: parseInt(countLines[index].trim(), 10) || 1
      }));

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

      setDates('');
      setOrganizations('');
      setUsers('');
      setCounts('');
      setStep(1);
      
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

  const getStepInfo = () => {
    switch (step) {
      case 1:
        return {
          title: 'Шаг 1: Даты',
          placeholder: '15.03.2025 18:09:53\n18.03.2025 22:19:14\n22.03.2025 10:30:00',
          description: 'Вставьте все даты, каждая на новой строке',
          value: dates,
          onChange: setDates
        };
      case 2:
        return {
          title: 'Шаг 2: Организации',
          placeholder: 'Кид Форс Выхино\nШИЯ Солнцево\nВоркаут Щербинка',
          description: 'Вставьте организации в том же порядке (можно оставить пустую строку)',
          value: organizations,
          onChange: setOrganizations
        };
      case 3:
        return {
          title: 'Шаг 3: Промоутеры',
          placeholder: 'Вероника\nАрсен\nНаталья',
          description: 'Вставьте имена промоутеров в том же порядке',
          value: users,
          onChange: setUsers
        };
      case 4:
        return {
          title: 'Шаг 4: Количество контактов',
          placeholder: '3\n15\n7',
          description: 'Вставьте количество контактов в том же порядке',
          value: counts,
          onChange: setCounts
        };
    }
  };

  const stepInfo = getStepInfo();
  const dateCount = dates.trim().split('\n').filter(l => l.trim()).length;

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
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === s 
                  ? 'bg-blue-600 text-white' 
                  : step > s 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {dateCount > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Всего записей: {dateCount}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {stepInfo.title}
          </label>
          <Textarea
            value={stepInfo.value}
            onChange={(e) => stepInfo.onChange(e.target.value)}
            placeholder={stepInfo.placeholder}
            rows={15}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            {stepInfo.description}
          </p>
        </div>

        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handlePrevStep}
              className="flex-1"
            >
              <Icon name="ChevronLeft" size={16} className="mr-2" />
              Назад
            </Button>
          )}
          
          {step < 4 ? (
            <Button
              onClick={handleNextStep}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Далее
              <Icon name="ChevronRight" size={16} className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={importing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
          )}
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
