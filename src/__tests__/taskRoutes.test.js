const request = require('supertest');
const app = require('../app');
const Task = require('../models/taskModel');
const Worker = require('../models/workerModel');

afterAll(async () => {
    await Task.deleteMany();
    await Worker.deleteMany();
})

describe('POST /', () => {
    it('should create a task with a 201 status code', async () => {
      const response = await request(app)
      .post('/api/renders')
      .send({
        priority: "LOW",
        estimatedRenderTime: 3600000
        })
        .set("Accept", "application/json");
        Worker.create({ workerId: "1", status: "ready", lastHeartbeat: new Date(), currentTaskId: response.body.taskId });
        expect(response.statusCode).toBe(201);
    });

    it('should update task status with a 200 status code', async () => {
      const task = await Task.findOne({ status: 'pending' });
      const response = await request(app)
      .post(`/api/renders/${task.taskId}/status`)
      .send({
          workerId: "1",
          status: "rendering"
        })
        .set("Accept", "application/json");
        expect(response.statusCode).toBe(200);
    });

    it('should update task status to completed with a 200 status code', async () => {
      const task = await Task.findOne({ status: 'rendering' });
      const response = await request(app)
      .post(`/api/renders/${task.taskId}/complete`)
        .set("Accept", "application/json");
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe("completed");
    });
});

describe('GET /', () => {
  it('should get a tasks with a 200 status code', async () => {
    const response = await request(app).get('/api/renders');
    expect(response.statusCode).toBe(200);
  });

  it('should get a task with a 200 status code', async () => {
    const task = await Task.findOne();
    const response = await request(app).get(`/api/renders/${task.taskId}`)
    expect(response.statusCode).toBe(200);
  });

  it('should handle invalid route', async () => {
    const response = await request(app).get('/error');
    expect(response.status).toBe(404);
  });
});