import api from './axiosInstance';

export const sessionApi = {
  start: (context) => api.post('/session/start', context),

  sendMessage: (formData) =>
    api.post('/session/message', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  sendTextMessage: (sessionId, transcribedText) =>
    api.post('/session/message', { sessionId, transcribedText }),

  end: (sessionId) => api.post('/session/end', { sessionId }),

  getSession: (sessionId) => api.get(`/session/${sessionId}`),
};
