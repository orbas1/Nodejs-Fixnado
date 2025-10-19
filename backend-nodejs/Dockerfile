FROM node:20.11.1-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application files
COPY . .

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "dev"]
