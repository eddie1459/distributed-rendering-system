const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workerSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    workerId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['ready', 'busy', 'offline', 'failed'], default: 'ready' },
    lastHeartbeat: { type: Date, default: Date.now },
    currentTaskId: { type: String, ref: 'Task', default: null }
});

module.exports = mongoose.model('Worker', workerSchema);