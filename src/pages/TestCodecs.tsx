import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TestCodecs() {
  const [supportedCodecs, setSupportedCodecs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    const codecs = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm',
      'video/mp4;codecs=h264',
      'video/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
    ];

    const supported = codecs.filter(codec => MediaRecorder.isTypeSupported(codec));
    setSupportedCodecs(supported);
  }, []);

  const testRecording = async () => {
    try {
      setTestResult('🎥 Запрашиваю доступ к камере...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'environment' }
      });

      setTestResult('✅ Доступ получен. Начинаю запись на 3 секунды...');

      const mimeType = supportedCodecs[0] || 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setTestResult(`✅ Записано ${blob.size} байт с кодеком: ${mimeType}`);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 3000);

    } catch (error) {
      setTestResult(`❌ Ошибка: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Тест кодеков для видео</h1>
        
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Поддерживаемые кодеки:</h2>
          {supportedCodecs.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {supportedCodecs.map(codec => (
                <li key={codec} className="text-sm font-mono">{codec}</li>
              ))}
            </ul>
          ) : (
            <p className="text-red-500">Нет поддерживаемых кодеков!</p>
          )}
        </div>

        <Button onClick={testRecording} className="w-full mb-4">
          Протестировать запись видео
        </Button>

        {testResult && (
          <div className="p-4 bg-gray-100 rounded text-sm">
            {testResult}
          </div>
        )}
      </Card>
    </div>
  );
}
