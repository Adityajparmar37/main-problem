import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionApi } from '../api/sessionApi';
import { useSessionStore } from '../store/sessionStore';

export function useSession() {
  const navigate = useNavigate();
  const {
    sessionId, messages, questionNumber, maxQuestions, sessionEnded, report, isLoading, error,
    setSession, addMessage, setQuestionNumber, setSessionEnded, setReport, setLoading, setError, reset,
  } = useSessionStore();

  const startSession = useCallback(async (context) => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionApi.start(context);
      const { sessionId: sid, question, questionNumber: qn, maxQuestions: mq, audioBase64 } = res.data;
      setSession(sid, context, question, qn, mq);
      return { audioBase64 };
    } catch (err) {
      const msg = err.message || 'Failed to start session';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setSession, setLoading, setError]);

  const sendAudioMessage = useCallback(async (audioBlob, mimeType) => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording.webm`);
      formData.append('sessionId', sessionId);

      const res = await sessionApi.sendMessage(formData);
      const { response, transcribedText, questionNumber: qn, sessionEnded: ended, audioBase64 } = res.data;

      addMessage('user', transcribedText);
      addMessage('assistant', response);
      setQuestionNumber(qn);

      if (ended) {
        setSessionEnded(true);
      }
      return { audioBase64, sessionEnded: ended };
    } catch (err) {
      const msg = err.message || 'Failed to send message';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, addMessage, setQuestionNumber, setSessionEnded, setLoading, setError]);

  const sendTextMessage = useCallback(async (text) => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sessionApi.sendTextMessage(sessionId, text);
      const { response, questionNumber: qn, sessionEnded: ended, audioBase64 } = res.data;

      addMessage('user', text);
      addMessage('assistant', response);
      setQuestionNumber(qn);

      if (ended) setSessionEnded(true);
      return { audioBase64, sessionEnded: ended };
    } catch (err) {
      setError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, addMessage, setQuestionNumber, setSessionEnded, setLoading, setError]);

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sessionApi.end(sessionId);
      setReport(res.data.report);
      navigate(`/voice/report/${sessionId}`);
    } catch (err) {
      setError(err.message || 'Failed to end session');
    } finally {
      setLoading(false);
    }
  }, [sessionId, setReport, setLoading, setError, navigate]);

  const resetSession = useCallback(() => {
    reset();
    navigate('/voice/setup');
  }, [reset, navigate]);

  return {
    sessionId, messages, questionNumber, maxQuestions, sessionEnded, report, isLoading, error,
    startSession, sendAudioMessage, sendTextMessage, endSession, resetSession,
  };
}
