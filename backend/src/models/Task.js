const mongoose = require('mongoose');

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: STATUSES, default: 'todo', index: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium', index: true },
    dueDate: { type: Date, default: null, index: true },

    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    deletedAt: { type: Date, default: null, index: true }
  },
  { timestamps: true }
);

taskSchema.index({ title: 'text', description: 'text' });

taskSchema.statics.notDeleted = function notDeleted() {
  return { deletedAt: null };
};

const Task = mongoose.model('Task', taskSchema);

module.exports = { Task, STATUSES, PRIORITIES };
