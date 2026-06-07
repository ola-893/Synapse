FROM node:20-alpine

# Install sqlite3 dependencies natively required by alpine
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Command to run the compiled application
CMD ["npm", "run", "dev"]
