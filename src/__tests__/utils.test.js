const { checkForWorkers, checkForBusyWorkers, checkForFailedTasks, error, log, getPriorityValue } = require('../utils');
const Task = require('../models/taskModel');
const Worker = require('../models/workerModel');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const app = require('../app');

beforeAll(async () => {
    mongoose.connect('mongodb://localhost/taskdb')
    .then(() => {
        log('Connected to MongoDB');
    })
    .catch((err) => {
        error(err);
    });
});

afterEach(async () => {
    await Task.deleteMany();
    await Worker.deleteMany();
})

const createBusyWorker = async (workerId, lastHeartbeat = moment(), taskId) => {
    const worker = new Worker({ workerId, status: "busy", lastHeartbeat: lastHeartbeat });
    taskId && (worker.currentTaskId = taskId);
    await worker.save()
}

const createLowTask = async (taskId, creationTime = moment(), status = "pending", retries = 0) => {
    const task = new Task({ status, lastHeartbeat: new Date(), taskId, priority: "LOW", estimatedRenderTime: 3600, creationTime, retries });
    await task.save()
}

const createRushTask = async (taskId, creationTime = moment()) => {
    const task = new Task({ status: "pending", lastHeartbeat: new Date(), taskId, priority: "RUSH", estimatedRenderTime: 3600, creationTime });
    await task.save()
}

const createMediumTask = async (taskId, creationTime = moment()) => {
    const task = new Task({ status: "pending", lastHeartbeat: new Date(), taskId, priority: "MEDIUM", estimatedRenderTime: 3600, creationTime, });
    await task.save()
}

const createHighTask = async (taskId, creationTime = moment()) => {
    const task = new Task({ status: "pending", lastHeartbeat: new Date(), taskId, priority: "HIGH", estimatedRenderTime: 3600, creationTime, });
    await task.save()
}

// describe('MongoDB Connection', () => {
//     it('should handle connection error', async () => {
//       const OLD_ENV = process.env;
//       process.env.MONGO_URL = 'mongodb://nonexistenthost:27017/testdb';
  
//       await expect(app).rejects.toThrow('failed to connect to server');
//     });
// });

describe('util testing', () => {
    it('checkForWorkers LOW priority', async () => {
        const taskId = uuidv4();
        await createLowTask(taskId);
        await checkForWorkers();
        const updatedTask = await Task.findOne({ taskId })
        expect(updatedTask.status).toBe('rendering');
    }, 20000);

    it('checkForWorkers RUSH priority pre-emption', async () => {
        const lowTaskId = uuidv4();
        const rushTaskId = uuidv4();
        await createLowTask(lowTaskId, moment().subtract(6, 'minutes'));
        await checkForWorkers();
        await createRushTask(rushTaskId);
        await checkForWorkers();
        const rushTask = await Task.findOne({ taskId: rushTaskId })
        expect(rushTask.status).toBe('rendering');
        lowTask = await Task.findOne({ taskId: lowTaskId })
        expect(lowTask.status).toBe('pending');
    }, 20000);

    it('checkForWorkers MEDIUM priority pre-emption', async () => {
        const lowTaskId = uuidv4();
        const mediumTaskId = uuidv4();
        await createLowTask(lowTaskId, moment().subtract(725, 'minutes'));
        await checkForWorkers();
        await createMediumTask(mediumTaskId);
        await checkForWorkers();
        const mediumTask = await Task.findOne({ taskId: mediumTaskId })
        expect(mediumTask.status).toBe('rendering');
        lowTask = await Task.findOne({ taskId: lowTaskId })
        expect(lowTask.status).toBe('pending');
    }, 20000);

    it('checkForWorkers HIGH priority pre-emption', async () => {
        const mediumTaskId = uuidv4();
        const highTaskId = uuidv4();
        await createMediumTask(mediumTaskId, moment().subtract(725, 'minutes'));
        await checkForWorkers();
        await createHighTask(highTaskId);
        await checkForWorkers();
        const highTask = await Task.findOne({ taskId: highTaskId })
        expect(highTask.status).toBe('rendering');
        mediumTask = await Task.findOne({ taskId: mediumTaskId })
        expect(mediumTask.status).toBe('pending');
    }, 20000);

    it('checkForWorkers execute in order, should choose HIGH', async () => {
        const lowTaskId = uuidv4();
        const highTaskId = uuidv4();
        const mediumTaskId = uuidv4();
        await createLowTask(lowTaskId);
        await createHighTask(highTaskId, moment().subtract(32, 'minutes'));
        await createMediumTask(mediumTaskId);
        await checkForWorkers();
        const highTask = await Task.findOne({ taskId: highTaskId })
        expect(highTask.status).toBe('rendering');
    }, 20000);

    // it('checkForWorkers execute in order, should choose MEDIUM', async () => {
    //     const lowTaskId = uuidv4();
    //     const highTaskId = uuidv4();
    //     const mediumTaskId = uuidv4();
    //     await createLowTask(lowTaskId, moment().subtract(720, 'minutes'));
    //     await createHighTask(highTaskId);
    //     await createMediumTask(mediumTaskId);
    //     await checkForWorkers();
    //     // running a second time to check if it chooses the medium task
    //     await checkForWorkers();
    //     const mediumTask = await Task.findOne({ taskId: mediumTaskId })
    //     expect(mediumTask.status).toBe('rendering');
    // }, 20000);

    it('checkForWorkers MEDIUM priority', async () => {
        const mediumTaskId = uuidv4();
        await createMediumTask(mediumTaskId, moment().subtract(722, 'minutes'));
        await checkForWorkers();
        mediumTask = await Task.findOne({ taskId: mediumTaskId })
        expect(mediumTask.status).toBe('rendering');
    }, 20000);

    it('checkForWorkers HIGH priority', async () => {
        const highTaskId = uuidv4();
        await createHighTask(highTaskId, moment().subtract(720, 'minutes'));
        await checkForWorkers();
        highTask = await Task.findOne({ taskId: highTaskId })
        expect(highTask.status).toBe('rendering');
    }, 20000);

    it('checkForWorkers RUSH priority with existing RUSH', async () => {
        const rushTaskId = uuidv4();
        const rushTaskId2 = uuidv4();
        await createRushTask(rushTaskId, moment().subtract(6, 'minutes'));
        await checkForWorkers();
        await createRushTask(rushTaskId2);
        await checkForWorkers();
        rushTask = await Task.findOne({ taskId: rushTaskId })
        expect(rushTask.status).toBe('rendering');
        const rushTask2 = await Task.findOne({ taskId: rushTaskId2 })
        expect(rushTask2.status).toBe('rendering');
    }, 20000);

    it('getPriorityValue', async () => {
        let priorityValue = getPriorityValue('LOW');
        expect(priorityValue).toBe(3);
        priorityValue = getPriorityValue('MEDIUM');
        expect(priorityValue).toBe(2);
        priorityValue = getPriorityValue('HIGH');
        expect(priorityValue).toBe(1);
        priorityValue = getPriorityValue('RUSH');
        expect(priorityValue).toBe(0);
    }, 20000);

    it('checkForBusyWorkers', async () => {
        const lastHeartbeat = moment().subtract(60, 'minutes')
        const taskId = uuidv4();
        const workerId = uuidv4();
        await createBusyWorker(workerId, lastHeartbeat, taskId);
        await createLowTask(taskId, moment(), "rendering");
        await checkForBusyWorkers();
        const worker = await Worker.findOne({ workerId })
        expect(worker.status).toBe('failed');
    }, 20000);

    it('checkForBusyWorkers -- render complete', async () => {
        const taskId = uuidv4();
        const workerId = uuidv4();
        await createBusyWorker(workerId, moment(), taskId);
        await createLowTask(taskId, moment().subtract(65, 'minutes'), "rendering");
        await checkForBusyWorkers();
        const worker = await Worker.findOne({ workerId })
        expect(worker.status).toBe('ready');
        const task = await Task.findOne({ taskId })
        expect(task.status).toBe('completed');
    }, 20000);

    it('checkForFailedTasks with render complete', async () => {
        const taskId = uuidv4();
        await createLowTask(taskId, moment(), "failed");
        await checkForFailedTasks();
        const task = await Task.findOne({ taskId })
        expect(task.status).toBe('pending');
    }, 20000);

    it('checkForFailedTasks with render complete', async () => {
        const taskId = uuidv4();
        await createLowTask(taskId, moment(), "failed");
        await checkForFailedTasks();
        const task = await Task.findOne({ taskId })
        expect(task.status).toBe('pending');
    }, 20000);

    it('checkForFailedTasks with failed task', async () => {
        const taskId = uuidv4();
        await createLowTask(taskId, moment(), "failed", 2);
        await checkForFailedTasks();
        const task = await Task.findOne({ taskId })
        expect(task.status).toBe('failed');
    }, 20000);
});