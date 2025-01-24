const request = require('supertest');
const app = require('../app');
const Task = require('../models/taskModel');
const mockingoose = require('mockingoose');

describe('POST /', () => {
    it('should fail to create a task with a 500 status code', async () => {
      mockingoose(Task).toReturn(new Error(), 'save');
      const response = await request(app)
      .post('/api/renders')
      .send({
        priority: "LOW",
        estimatedRenderTime: 3600000
        })
        .set("Accept", "application/json");
        expect(response.statusCode).toBe(500);
    });

    it('should fail to update task status with a 500 status code', async () => {
      mockingoose(Task).toReturn(new Error(), 'findOne');
      const response = await request(app)
      .post(`/api/renders/undefined/status`)
      .send({
          workerId: "1",
          status: "rendering"
        })
        .set("Accept", "application/json");
        expect(response.statusCode).toBe(500);
    });

    it('should throw 404 when task not found', async () => {
      mockingoose(Task).toReturn(null, 'findOne');
      const response = await request(app)
      .post(`/api/renders/undefined/status`)
      .send({
          workerId: "1",
          status: "rendering"
        })
        .set("Accept", "application/json");
        expect(response.statusCode).toBe(404);
    });

    it('should update task status to completed with a 200 status code', async () => {
      mockingoose(Task).toReturn(new Error(), 'findOne');
      const response = await request(app)
      .post(`/api/renders/undefined/complete`)
        .set("Accept", "application/json");
        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe("Failed to complete task");
    });

    it('should throw 404 when task not found', async () => {
      mockingoose(Task).toReturn(null, 'findOne');
      const response = await request(app)
      .post(`/api/renders/undefined/complete`)
        .set("Accept", "application/json");
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("Task not found");
    });
});

describe('GET /', () => {
  it('should fail to get tasks with a 500 status code', async () => {
    mockingoose(Task).toReturn(new Error(), 'find');
    const response = await request(app).get('/api/renders');
    expect(response.statusCode).toBe(500);
  });

  it('should throw a 404 when task not found', async () => {
    mockingoose(Task).toReturn(null, 'findOne');
    const response = await request(app).get('/api/renders/undefined');
    expect(response.statusCode).toBe(404);
  });

  it('should fail to get a task with a 500 status code', async () => {
    mockingoose(Task).toReturn(new Error(), 'findOne');
    const response = await request(app).get(`/api/renders/undefined`);
    expect(response.statusCode).toBe(500);
  });

  it('should handle invalid route', async () => {
    const response = await request(app).get('/error');
    expect(response.status).toBe(404);
  });
});