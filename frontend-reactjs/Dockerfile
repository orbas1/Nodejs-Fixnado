FROM node:20.11.1-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application in dev mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
