const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const reportSchema = new mongoose.Schema({
  emotion: { type: String },
  trigger: { type: String },
  stressScore: { type: Number, min: 0, max: 10 },
  summary: { type: String },
  recommendations: [{ type: String }],
});

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    context: {
      mood: {
        type: String,
        enum: ['great', 'good', 'okay', 'stressed', 'overwhelmed', 'anxious', 'sad'],
        required: true,
      },
      stress: { type: Number, min: 1, max: 10, required: true },
      sleepHours: { type: Number, min: 0, max: 24, required: true },
      studyHours: { type: Number, min: 0, max: 24, required: true },
      goal: { type: String, maxlength: 300 },
    },
    messages: [messageSchema],
    report: reportSchema,
    questionCount: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics aggregation performance
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ userId: 1, completed: 1 });

module.exports = mongoose.model('Session', sessionSchema);
