/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - taskId
 *       properties:
 *         taskId:
 *           type: string
 *           description: The task Id
 *         priority:
 *           type: enum
 *           description: the priority of the task
 *           enum:
 *             - RUSH
 *             - HIGH
 *             - MEDIUM
 *             - LOW
 *         estimatedRenderTime:
 *           type: string
 *           description: the amount of seconds the task is expected to take
 *         startTime:
 *           type: string
 *           format: date
 *           description: The date the task started
 *         status:
 *          type: enum
 *          description: The status of the task
 *          enum:
 *            - pending
 *            - rendering
 *            - completed
 *            - failed
 *         completionTime:
 *          type: string
 *          format: date
 *          description: The date the task was completed
 *         workerId:
 *          type: string
 *          description: The worker Id
 *         errorMessage:
 *          type: string
 *          escription: The error message
 *         retries:
 *          type: number
 *          description: The number of retries
 *         creationTime:
 *          type: string
 *          format: date
 *          description: The date the task was created
 *       example:
 *         id: 1234
 *         title: The New Turing Omnibus
 *         author: Alexander K. Dewdney
 *         finished: false
 *         createdAt: 2020-03-10T04:05:06.157Z
 * 
 *     Worker:
 *      type: object
 *      required:
 *          - workerId
 *      properties:
 *         workerId:
 *          type: string
 *          description: The worker Id
 *         status:
 *          type: enum
 *          description: The status of the worker
 *          enum:
 *              - ready
 *              - busy
 *              - offline
 *              - failed
 *          lastHeartbeat:
 *           type: string
 *           format: date
 *           description: The date the worker was last active
 *          currentTaskId:
 *           type: string
 */

const express = require('express');
const Worker = require('../models/workerModel');
const Task = require('../models/taskModel');
const logger = require('../utils/index');

const router = express.Router();

// Get all worker statuses
/**
 * @swagger
 * tags:
 *   name: Workers
 *   description: The workers managing API
 * /api/workers:
 *   get:
 *     summary: Gets workers
 *     tags: [Workers]
 *     responses:
 *       200:
 *         description: The Worker statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/Worker'
 */
router.get('/', async (req, res) => {
    try {
        const workers = await Worker.find();
        res.status(200).json(workers);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ message: 'Failed to retrieve workers' });
    }
});

// Get next available task for a worker
/**
 * @swagger
 * tags:
 *   name: Workers
 *   description: The tasks managing API
 * /api/workers/{id}/request-task:
 *   get:
 *     summary: Gets next available render task
 *     tags: [Workers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     responses:
 *       200:
 *         description: The task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
router.post('/:id/request-task', async (req, res) => {
    try {
        const workerId = req.params.id;
        const worker = await Worker.findOne({ workerId });
        if (!worker || worker.status !== 'ready') {
            return res.status(400).json({ message: 'Worker is not ready' });
        }

        const task = await Task.findOne({ status: 'pending' }).sort({ priorityValue: -1 });
        if (!task) {
            return res.status(404).json({ message: 'No tasks available' });
        }

        worker.status = 'busy';
        worker.currentTaskId = task.taskId;
        await worker.save();

        task.status = 'rendering';
        task.workerId = workerId;
        task.startTime = new Date();
        
        await task.save();
       
        res.status(200).json(task);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ message: 'Failed to assign task' });
    }
});

// Update worker status
/**
 * @swagger
 * tags:
 *   name: Workers
 *   description: The tasks managing API
 * /api/workers/:id/status:
 *   post:
 *     summary: updates a worker
 *     tags: [Workers]
 *     requestBody:
 *       required: true
 *       content:
 *        application/json:
 *         schema:
 *          type: object
 *         properties:
 *          status:
 *              type: string
 *              description: The status of the task
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     responses:
 *       200:
 *         description: The updated task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/Worker'
 */
router.post('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const worker = await Worker.findOne({ workerId: req.params.id });
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found' });
        }
        worker.status = status;
        worker.lastHeartbeat = new Date();
        await worker.save();
        res.status(200).json(worker);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ message: 'Failed to update worker status' });
    }
});

module.exports = router;
