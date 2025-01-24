require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('../swagger');
const mongoose = require('mongoose');
const { log, error, checkForBusyWorkers, checkForWorkers, checkForFailedTasks } = require('./utils/index');

const app = express();
app.use(express.json());

const rendersRoutes = require('./routes/taskRoutes');
const workersRoutes = require('./routes/workerRoutes');

let port = process.env.PORT || 3000;

if(process.env.NODE_ENV == 'test') {
    port = 0
}

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    log('Connected to MongoDB');
    app.listen(port, () => {
        log('Server is running on port 3000');
    });
})
.catch((err) => {
    error(err);
});

app.use('/api/renders', rendersRoutes);
app.use('/api/workers', workersRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

if (process.env.NODE_ENV !== 'test') {
    setInterval(async () => {
        checkForBusyWorkers();
        checkForWorkers();
        checkForFailedTasks();
    }, 30); // Check every 30 seconds
}

module.exports = app;