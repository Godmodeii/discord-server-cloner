FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install && cd ..

# Build React app
RUN cd client && npm run build && cd ..

# Copy app files
COPY . .

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
