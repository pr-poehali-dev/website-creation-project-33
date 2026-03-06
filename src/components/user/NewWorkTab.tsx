import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import VideoLeadModal from './VideoLeadModal';

export default function NewWorkTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState('video/webm');
  const [modalOpen, setModalOpen] = useState(false);
  const [permissionError, setPermissionError] = useState('');
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

  const requestPermissions = async () => {
    setPermissionError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError('Ваш браузер не поддерживает запись видео. Откройте в Chrome.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: true
      });

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
    } catch (err: unknown) {
      console.error('Camera/mic error:', err);
      const error = err as { name?: string };

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionError('Доступ к камере и микрофону запрещён. Разрешите доступ в настройках браузера и обновите страницу.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setPermissionError('Камера или микрофон не найдены на устройстве.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setPermissionError('Камера занята другим приложением. Закройте его и попробуйте снова.');
      } else if (error.name === 'OverconstrainedError') {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          streamRef.current = fallbackStream;
          const detectedMime = getSupportedMimeType();
          const recorder = detectedMime
            ? new MediaRecorder(fallbackStream, { mimeType: detectedMime })
            : new MediaRecorder(fallbackStream);

          const actualMime = detectedMime || 'video/webm';
          setMimeType(actualMime);
          mediaRecorderRef.current = recorder;
          videoChunksRef.current = [];

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) videoChunksRef.current.push(event.data);
          };
          recorder.onstop = () => {
            const blob = new Blob(videoChunksRef.current, { type: actualMime });
            setVideoBlob(blob);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
          };

          recorder.start(1000);
          setIsRecording(true);
          setModalOpen(true);
          return;
        } catch {
          setPermissionError('Не удалось запустить камеру.');
        }
      } else {
        setPermissionError('Не удалось получить доступ к камере. Попробуйте обновить страницу.');
      }
      toast({ title: 'Ошибка камеры', description: permissionError || 'Проверьте разрешения', variant: 'destructive' });
    }
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
          onClick={requestPermissions}
          className="w-36 h-36 rounded-full bg-blue-500 hover:bg-blue-600 shadow-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Icon name="Video" size={32} className="text-white" />
          <span className="text-sm font-semibold text-white">Начать запись</span>
        </Button>

        {permissionError && (
          <div className="max-w-sm bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <Icon name="AlertCircle" size={20} className="text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">{permissionError}</p>
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
