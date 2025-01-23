# Distributed Rendering System

This project is a REST API service that manages a distributed rendering system with multiple worker nodes. It allows for task management and worker management through a set of defined endpoints.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Docker](#docker)
- [Architecture Decisions](#architecture-decisions)
- [Distribution Algorithm Description](#distribution-algorithm-description)
- [Failure Handling Approach](#failure-handling-approach)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/distributed-rendering-system.git
   ```
2. Navigate to the project directory:
   ```
   cd distributed-rendering-system
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run:
```
npm start
```
The server will start on `http://localhost:3000`.

## API Endpoints

### Task Management
- `POST /renders` - Submit a new task
- `GET /renders` - Retrieve all tasks
- `GET /renders/:id` - Retrieve a specific task by ID
- `PUT /renders/:id/status` - Update the status of a task
- `POST /renders/:id/complete` - Mark a task as complete

### Worker Management
- `GET /workers` - Retrieve all workers
- `POST /workers/:id/request-task` - Request a task for a specific worker
- `PUT /workers/:id/status` - Update the status of a worker

## Docker

To run the application using Docker, follow these steps:

Alternatively, you can use Docker Compose:
```
docker-compose up
```
Once that is up and running you can view the swagger documentation here: http://localhost:3000/api-docs/

You can use the provided POSTMAN collection to test the API and functionality

## Architecture Decisions

I decided to use mongodb as my storage mechanism for the tasks and workers as it is quick and easy to store and retrieve data.  This allowed for easy setup of the models for the data.  Node/express allows easy API routes and associated logic.  The "heartbeat" 30 second logic is achieved via a javascript `setInterval` which easily allows for checking of the available workers and tasks.

## Distribution Algorithm Description

The distribution algorithm is a switch statement `preemptWorker` that looks for `busy` workers and `rendering` tasks and if it finds one and if the time the rendering task has taken is longer than the time allowed for the priority of that task level it will either create a new worker and assign that task to that or prioritize that task over the current rendering one.

## Failure Handling Approach

For failed tasks the `setInterval` check happening every 30 seconds will execute `checkForFailedTasks` and then check the `retries` and if they are less than 1 it will switch the task back to `pending` and increment the `retries` by one.  If the check sees that the `retries` are greater than 1 it will mark the task as `failed` and save the task as that.