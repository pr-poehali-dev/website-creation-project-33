import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import ArchivePasteImport from './ArchivePasteImport';
import ArchiveCsvUpload from './ArchiveCsvUpload';
import ArchiveManualImport from './ArchiveManualImport';
import ArchiveClearButton from './ArchiveClearButton';

interface ArchiveImportProps {
  sessionToken: string;
  onImportSuccess?: () => void;
}

export default function ArchiveImport({ sessionToken, onImportSuccess }: ArchiveImportProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const parseCsvText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
      
    if (lines.length === 0) {
      throw new Error('Данные пустые');
    }

    const headers = lines[0].split('\t').length > 1 
      ? lines[0].split('\t').map(h => h.trim().toLowerCase())
      : lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const separator = lines[0].split('\t').length > 1 ? '\t' : ',';
    
    console.log('Parsed headers:', headers);
    console.log('Separator:', separator === '\t' ? 'TAB' : 'COMMA');
    console.log('Total lines:', lines.length);
    
    const data = lines.slice(1).map((line, lineIndex) => {
      const values = line.split(separator).map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, i) => {
        const value = values[i] || '';
        
        if (header.includes('дата') || header === 'datetime' || i === 0) {
          row.datetime = value;
        } else if (header.includes('организ') || header.includes('топ') || header.includes('шия') || header === 'organization' || i === 1) {
          row.organization = value;
        } else if (header.includes('промоутер') || header.includes('user') || header.includes('имя') || i === 2) {
          row.user = value;
        } else if (header.includes('контакт') || header.includes('количеств') || header === 'count' || !isNaN(parseInt(value, 10))) {
          row.count = parseInt(value, 10) || 1;
        }
      });
      
      if (lineIndex < 3) {
        console.log(`Row ${lineIndex}:`, row);
      }
      
      return row;
    }).filter(row => row.datetime && row.user);

    console.log('Parsed data count:', data.length);

    return data;
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
          <ArchivePasteImport
            sessionToken={sessionToken}
            onImportSuccess={onImportSuccess}
            parseCsvText={parseCsvText}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-blue-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-blue-50 px-2 text-blue-600">или</span>
            </div>
          </div>

          <ArchiveCsvUpload
            sessionToken={sessionToken}
            onImportSuccess={onImportSuccess}
            parseCsvText={parseCsvText}
            importing={importing}
            setImporting={setImporting}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">или добавить вручную</span>
          </div>
        </div>

        <ArchiveManualImport
          sessionToken={sessionToken}
          onImportSuccess={onImportSuccess}
        />

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✅ Импортировано: <strong>{result.imported}</strong> записей
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-700 font-semibold">Ошибки:</p>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {result.errors.slice(0, 5).map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>...и ещё {result.errors.length - 5}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-gray-300">
          <ArchiveClearButton
            sessionToken={sessionToken}
            onClearSuccess={onImportSuccess}
          />
        </div>
      </CardContent>
    </Card>
  );
}