import { useRef, useState, useCallback } from 'react';

const MIME_TYPE = 'audio/webm;codecs=opus';
const FALLBACK_MIME = 'audio/webm';

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported(MIME_TYPE) ? MIME_TYPE : FALLBACK_MIME;
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250); // collect every 250ms
      setIsRecording(true);
    } catch (err) {
      setError(err.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone access.'
        : 'Failed to start recording.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        reject(new Error('Recorder not active'));
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || FALLBACK_MIME;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        // Stop all tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        resolve({ blob, mimeType });
      };

      recorder.stop();
    });
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    isProcessing,
    setIsProcessing,
    error,
    setError,
    startRecording,
    stopRecording,
    stopStream,
  };
}
