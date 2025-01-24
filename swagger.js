const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Distributed Rendering System',
      version: '1.0.0',
      description: 'An API for a distributed rendering system',
    },
  },
  apis: ['./src/routes/*.js'],
  servers: [{
    url: 'http://localhost:3000',
    description: 'Development server',
  }]
};

const specs = swaggerJsdoc(options);

module.exports = specs;