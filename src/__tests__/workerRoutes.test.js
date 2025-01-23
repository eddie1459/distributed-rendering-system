const request = require('supertest');
const app = require('../app');
const Task = require('../models/taskModel');
const Worker = require('../models/workerModel');
const { v4: uuidv4 } = require('uuid');

const taskId = uuidv4();
const workerId = uuidv4();

beforeAll(async () => {
    const task = new Task({ workerId: workerId, status: "pending", lastHeartbeat: new Date(), taskId: taskId, priority: "LOW", estimatedRenderTime: 3600000 });
    await task.save()
    const worker = new Worker({ workerId, status: "ready", lastHeartbeat: new Date(), currentTaskId: taskId });
    await worker.save()
});

afterAll(async () => {
    await Task.deleteMany();
    await Worker.deleteMany();
})

describe('POST /', () => {
    it('should get next task with a 200 status code', async () => {
      const response = await request(app)
      .post(`/api/workers/${workerId}/request-task`)
      .send({
        priority: "LOW",
        estimatedRenderTime: 3600000
        })
        .set("Accept", "application/json");
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe("rendering");
    });
    it('should update worker status with a 200 status code', async () => {
        const response = await request(app)
        .post(`/api/workers/${workerId}/status`)
        .send({
            status: "ready",
          })
          .set("Accept", "application/json");
          expect(response.statusCode).toBe(200);
          expect(response.body.status).toBe("ready");
    });
});

describe('GET /', () => {
    it('should get all worker statuses with a 200 status code', async () => {
      const response = await request(app).get('/api/workers');
      expect(response.statusCode).toBe(200);
    });
});