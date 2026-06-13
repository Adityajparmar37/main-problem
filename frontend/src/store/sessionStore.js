import { create } from 'zustand';

export const useSessionStore = create((set, get) => ({
  sessionId: null,
  context: null,
  messages: [],
  questionNumber: 1,
  maxQuestions: 5,
  sessionEnded: false,
  report: null,
  isLoading: false,
  error: null,

  setSession: (sessionId, context, firstQuestion, questionNumber, maxQuestions) =>
    set({
      sessionId,
      context,
      messages: [{ role: 'assistant', content: firstQuestion, timestamp: new Date().toISOString() }],
      questionNumber,
      maxQuestions,
      sessionEnded: false,
      report: null,
      error: null,
    }),

  addMessage: (role, content) =>
    set((state) => ({
      messages: [...state.messages, { role, content, timestamp: new Date().toISOString() }],
    })),

  setQuestionNumber: (n) => set({ questionNumber: n }),

  setSessionEnded: (ended) => set({ sessionEnded: ended }),

  setReport: (report) => set({ report }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      sessionId: null,
      context: null,
      messages: [],
      questionNumber: 1,
      maxQuestions: 5,
      sessionEnded: false,
      report: null,
      isLoading: false,
      error: null,
    }),
}));
