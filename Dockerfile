# Specify the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (to leverage Docker layer caching)
COPY package*.json ./

# Install all necessary modules, including new ones
RUN npm install --legacy-peer-deps

# Copy the rest of the application into the container
COPY . .

# Expose the port your application runs on
EXPOSE 3000

# Default command to run the application
CMD ["npm", "run", "dev"]
