import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import VideoLeadModal from './VideoLeadModal';

export default function NewWorkTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState('video/webm');
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecordingWithStream = (stream: MediaStream) => {
    streamRef.current = stream;

    const detectedMime = getSupportedMimeType();
    const mediaRecorder = detectedMime
      ? new MediaRecorder(stream, { mimeType: detectedMime })
      : new MediaRecorder(stream);

    const actualMime = detectedMime || 'video/webm';
    setMimeType(actualMime);
    mediaRecorderRef.current = mediaRecorder;
    videoChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) videoChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(videoChunksRef.current, { type: actualMime });
      setVideoBlob(blob);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    mediaRecorder.start(1000);
    setIsRecording(true);
    setModalOpen(true);
    setStatusMsg('');
    setErrorMsg('');
  };

  const handleStart = async () => {
    setErrorMsg('');
    setStatusMsg('Запрашиваю доступ к камере и микрофону...');

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Браузер не поддерживает камеру. Откройте страницу в Google Chrome.');
      setStatusMsg('');
      return;
    }

    // Попытка 1: задняя камера + микрофон
    try {
      setStatusMsg('Подключаю камеру и микрофон...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: true
      });
      startRecordingWithStream(stream);
      return;
    } catch (e1) {
      console.log('Attempt 1 failed:', (e1 as Error).name, (e1 as Error).message);
    }

    // Попытка 2: любая камера + микрофон
    try {
      setStatusMsg('Пробую другую камеру...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      startRecordingWithStream(stream);
      return;
    } catch (e2) {
      console.log('Attempt 2 failed:', (e2 as Error).name, (e2 as Error).message);
    }

    // Попытка 3: только камера без микрофона
    try {
      setStatusMsg('Пробую без микрофона...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      startRecordingWithStream(stream);
      return;
    } catch (e3) {
      const err = e3 as Error & { name: string };
      console.error('All attempts failed:', err.name, err.message);

      if (err.name === 'NotAllowedError') {
        setErrorMsg(
          'Доступ запрещён. Нажмите на значок замка (🔒) слева от адреса сайта → разрешите камеру и микрофон → обновите страницу.'
        );
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('Камера или микрофон не найдены на устройстве.');
      } else if (err.name === 'NotReadableError') {
        setErrorMsg('Камера используется другим приложением. Закройте его и попробуйте снова.');
      } else {
        setErrorMsg(`Ошибка: ${err.name} — ${err.message}. Попробуйте открыть в Google Chrome.`);
      }
    }

    setStatusMsg('');
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClose = () => {
    if (isRecording) stopRecording();
    setModalOpen(false);
    setVideoBlob(null);
    videoChunksRef.current = [];
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  return (
    <div className="bg-white min-h-screen p-4">
      <div className="flex flex-col items-center pt-6 gap-4">
        <Button
          onClick={handleStart}
          className="w-36 h-36 rounded-full bg-blue-500 hover:bg-blue-600 shadow-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Icon name="Video" size={32} className="text-white" />
          <span className="text-sm font-semibold text-white">Начать запись</span>
        </Button>

        {statusMsg && (
          <p className="text-sm text-gray-500 animate-pulse">{statusMsg}</p>
        )}

        {errorMsg && (
          <div className="max-w-sm bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <Icon name="AlertCircle" size={20} className="text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}
      </div>

      <VideoLeadModal
        open={modalOpen}
        onClose={handleClose}
        videoBlob={videoBlob}
        mimeType={mimeType}
        isRecording={isRecording}
        onStopRecording={stopRecording}
      />
    </div>
  );
}
