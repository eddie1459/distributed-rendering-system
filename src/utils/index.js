const moment = require('moment');
const Task = require('../models/taskModel');
const Worker = require('../models/workerModel');
const { v4: uuidv4 } = require('uuid');

const isRenderComplete = async (taskId) => {
    const task = await Task.findOne({ taskId });
    const now = moment();
    
    if (!task) return false
    const renderTime = now.diff(task.creationTime, 'seconds')
    if (renderTime > task.estimatedRenderTime) {
        return true
    } 
    return false
}

const preemptWorker = async (priority, taskId) => {
    const workers = await Worker.find({ status: 'busy' });
    const renderingTasks = await Task.find({ status: 'rendering' });
    const task = await Task.findOne({ taskId });
    const now = moment();
    let worker
    if (workers.length > 0 && renderingTasks.length > 0) {
        worker = workers[0];
        const renderTime = now.diff(renderingTasks[0].creationTime, 'seconds')
        switch (priority) {
            case "RUSH":
                if (renderTime < 300) return
                if (renderingTasks[0].priority === "RUSH") {
                    await createNewWorker(worker, taskId, task);
                } else {
                    await updateWorkerAndTasks(renderingTasks, worker, task);
                }
                break
            case "HIGH":
                if (renderTime < 1800) return
                if (renderingTasks[0].priority === "HIGH") {
                    await createNewWorker(worker, taskId, task);
                } else {
                    await updateWorkerAndTasks(renderingTasks, worker, task);
                }
                break
            case "MEDIUM":
                if (renderTime < 43200) return
                if (renderingTasks[0].priority === "MEDIUM") {
                    await createNewWorker(worker, taskId, task);
                } else {
                    await updateWorkerAndTasks(renderingTasks, worker, task);
                }
                break
        }
    } else {
        const workers = await Worker.find({ status: 'ready' || 'busy'});
        if (workers.length === 0) {
            worker = await createNewWorker(worker, taskId, task);
        }
    }
}

module.exports = {
    log: (message) => {
        console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
    },
    error: (message) => {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    },
    getPriorityValue: (priority) => {
        switch (priority) {
            case "RUSH":
                return 0
            case "HIGH":
                return 1
            case "MEDIUM":
                return 2
            case "LOW":
                return 3
        }
    },
    checkForFailedTasks: async () => {
        const failedTasks = await Task.find({ status: 'failed' });
        for (let i = 0; i < failedTasks.length; i++) {
            const task = failedTasks[i];
            if (task.retries < 1) {
                task.status = 'pending';
                task.retries++;
                await task.save();
            } else {
                task.status = 'failed';
                await task.save();
            }
        }
    },
    checkForBusyWorkers: async () => {
        const busyWorkers = await Worker.find({ status: 'busy' });
        for (let i = 0; i < busyWorkers.length; i++) {
            const worker = busyWorkers[i];
            const task = await Task.findOne({taskId: worker.currentTaskId});
            if (Date.now() - worker.lastHeartbeat > 1800000) { // 30 minute timeout
                if (task && task.status === 'rendering') {
                    // Mark task as failed and retry
                    task.status = 'failed'; // Retry task automatically
                    task.workerId = worker.workerId;
                    task.errorMessage = 'Worker timeout';
                    task.retries = 0;
                    await task.save();
                }

                // Mark worker as failed
                worker.status = 'failed';
                await worker.save();
            }
            const renderComplete = await isRenderComplete(worker.currentTaskId);
            if (renderComplete) {
                task.status = 'completed';
                await task.save();
                worker.status = 'ready';
                worker.lastHeartbeat = new Date();
                await worker.save();
            }
        }
    },
    checkForWorkers: async () => {
        // RUSH Task preempting
        const rushTasks = await Task.find({ status: 'pending', priority: "RUSH" });
        if (rushTasks.length > 0) {
            await preemptWorker("RUSH", rushTasks[0].taskId);
            return;
        }

        // HIGH Task preempting
        const highTasks = await Task.find({ status: 'pending', priority: "HIGH" });
        if (highTasks.length > 0) {
            await preemptWorker("HIGH", highTasks[0].taskId);
            return;
        }

        // MEDIUM Task preempting
        const mediumTasks = await Task.find({ status: 'pending', priority: "MEDIUM" });
        if (mediumTasks.length > 0) {
            await preemptWorker("MEDIUM", mediumTasks[0].taskId);
            return;
        }

        // LOW Task processing
        const lowTasks = await Task.find({ status: 'pending', priority: "LOW" });
        if (lowTasks.length > 0) {
            await preemptWorker("LOW", lowTasks[0].taskId);
        }
    }
};


const createNewWorker = async (worker, taskId, task) => {
    worker = new Worker({ workerId: uuidv4() });
    worker.currentTaskId = taskId;
    worker.status = 'busy';
    await worker.save();
    task.status = 'rendering';
    task.workerId = worker.workerId;
    await task.save();
    return worker;
}

const updateWorkerAndTasks = async (renderingTasks, worker, task) => {
    renderingTasks[0].status = 'pending';
    renderingTasks[0].workerId = worker.workerId;
    await renderingTasks[0].save();
    worker.status = 'busy';
    worker.lastHeartbeat = new Date();
    worker.currentTaskId = task.taskId;
    await worker.save();
    task.status = 'rendering';
    task.workerId = worker.workerId;
    await task.save();
}