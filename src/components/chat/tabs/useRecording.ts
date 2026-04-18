import { useState, useRef, useCallback } from 'react';

const MAX_RECORDING_TIME = 120; // 120 секунд (2 минуты)

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async (onRecordingComplete: (file: File) => void) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // iOS Safari supports only audio/mp4, Chrome/Firefox prefer audio/webm
      const mimeTypes = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
      const supportedMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
      const recorderOptions = supportedMime ? { mimeType: supportedMime } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || supportedMime || 'audio/mp4';
        const ext = mime.includes('mp4') || mime.includes('aac') ? 'mp4' : mime.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(chunks, { type: mime });
        const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: mime });
        onRecordingComplete(file);
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_TIME * 1000);

    } catch (error) {
      console.error('Start recording error:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
    }
  }, [mediaRecorder, isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      const stream = mediaRecorder.stream;
      mediaRecorder.stop();
      stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
    }
  }, [mediaRecorder, isRecording]);

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}