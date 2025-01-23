const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const taskSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    taskId: { type: String, required: true, unique: true },
    priority: { type: String, enum: ['RUSH', 'HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
    priorityValue: { type: Number, default: 0 },
    estimatedRenderTime: { type: Number, required: true },
    filePath: { type: String },
    status: { type: String, enum: ['pending', 'rendering', 'completed', 'failed'], default: 'pending' },
    retries: { type: Number, default: 0 },
    creationTime: { type: Date, default: Date.now },
    completionTime: { type: Date },
    startTime: { type: Date },
    workerId: { type: String },
    errorMessage: { type: String }
});

module.exports = mongoose.model('Task', taskSchema);