import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import VideoLeadModal from './VideoLeadModal';

export default function NewWorkTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      setModalOpen(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      });

      streamRef.current = stream;

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/mp4' });
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) videoChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/mp4' });
        setVideoBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      alert('Не удалось получить доступ к камере. Проверьте разрешения.');
      setModalOpen(false);
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
      <div className="flex justify-start pt-2">
        <Button
          onClick={startRecording}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md flex items-center gap-2 text-base font-semibold"
        >
          <Icon name="Video" size={20} className="text-white" />
          Начать запись
        </Button>
      </div>

      <VideoLeadModal
        open={modalOpen}
        onClose={handleClose}
        videoBlob={videoBlob}
        isRecording={isRecording}
        onStopRecording={stopRecording}
      />
    </div>
  );
}