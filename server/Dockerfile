FROM node:20-alpine

# Install sqlite3 dependencies natively required by alpine
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Source code is bind-mounted at runtime for hot reload
# Expose port
EXPOSE 3001

# Command to run tsx in watch mode
CMD ["npx", "tsx", "watch", "src/index.ts"]
