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
 */

const express = require('express');
const Task = require('../models/taskModel');
const { error, getPriorityValue } = require('../utils/index');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

/**
 * @swagger
 * /api/renders:
 *   post:
 *     summary: Creates a task
 *     tags: 
 *      - Tasks
 *     responses:
 *       201:
 *         description: The created task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
router.post('/', async (req, res) => {
    try {
        const { priority, estimatedRenderTime } = req.body;
        const task = new Task({ taskId: uuidv4(), priority, estimatedRenderTime, priorityValue: getPriorityValue(priority) });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        error(err);
        res.status(500).json({ message: 'Failed to create task' });
    }
});

// Get status of all render tasks
/**
 * @swagger
 * /api/renders:
 *   get:
 *     summary: Gets render tasks
 *     tags: [Tasks]
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
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (err) {
        error(err);
        res.status(500).json({ message: 'Failed to retrieve tasks' });
    }
});

// Get detailed status of a specific render task
/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: The tasks managing API
 * /api/renders/{id}:
 *   get:
 *     summary: Gets a specific render task
 *     tags: [Tasks]
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
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({ taskId: req.params.id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(task);
    } catch (err) {
        error(err);
        res.status(500).json({ message: 'Failed to retrieve task' });
    }
});

// Update render task status (e.g., for preemption or progress updates)
/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: The tasks managing API
 * /api/renders/:id/status:
 *   post:
 *     summary: updates a task
 *     tags: [Tasks]
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
 *          workerId:
 *              type: string
 *              description: The worker Id
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
 *                 $ref: '#/components/schemas/Task'
 */
router.post('/:id/status', async (req, res) => {
    try {
        const { status, workerId, errorMessage } = req.body;
        const task = await Task.findOne({ taskId: req.params.id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        task.status = status;
        task.workerId = workerId || task.workerId;
        task.errorMessage = errorMessage || task.errorMessage;
        await task.save();

        res.status(200).json(task);
    } catch (err) {
        error(err);
        res.status(500).json({ message: 'Failed to update task status' });
    }
});

// Mark task as completed
/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: The tasks managing API
 * /api/renders/:id/complete:
 *   post:
 *     summary: completes a task
 *     tags: [Tasks]
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
 *                 $ref: '#/components/schemas/Task'
 */
router.post('/:id/complete', async (req, res) => {
    try {
        const task = await Task.findOne({ taskId: req.params.id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        task.status = 'completed';
        await task.save();
        const now = moment();
        const completedTask = {
            status: task.status,
            outputPath: `/renders/${task.filePath}/final.png`,
            outputSize: Math.random() * 1000,
            finalRenderTime: now.diff(task.creationTime, 'seconds')
        };

        res.status(200).json(completedTask);
    } catch (err) {
        error(err);
        res.status(500).json({ message: 'Failed to complete task' });
    }
});

module.exports = router;
