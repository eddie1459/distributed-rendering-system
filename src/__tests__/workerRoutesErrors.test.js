const request = require('supertest');
const app = require('../app');
const mockingoose = require('mockingoose');
const Worker = require('../models/workerModel');

describe('POST /', () => {
    it('should get next task with a 500 status code', async () => {
      mockingoose(Worker).toReturn(new Error(), 'findOne');
      const response = await request(app)
      .post(`/api/workers/undefined/request-task`)
      .send({
        priority: "LOW",
        estimatedRenderTime: 3600000
        })
        .set("Accept", "application/json");
        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe("Failed to assign task");
    });
    it('should fail update worker status with a 500 status code', async () => {
        mockingoose(Worker).toReturn(new Error(), 'findOne');
        const response = await request(app)
        .post(`/api/workers/undefined/status`)
        .send({
            status: "ready",
          })
          .set("Accept", "application/json");
          expect(response.statusCode).toBe(500);
          expect(response.body.message).toBe("Failed to update worker status");
    });
});

describe('GET /', () => {
    it('should return 500 for GET', async () => {
        mockingoose(Worker).toReturn(new Error(), 'find');
        await request(app)
          .get('/api/workers')
          .expect(500)
          .expect((res) => {
            expect(res.body.message).toEqual('Failed to retrieve workers'); 
          });
      });
});