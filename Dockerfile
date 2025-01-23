# Use official Node.js image as the base
FROM node:18

# Set working directory in the container
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the application code into the container
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["node", "src/app.js"]
