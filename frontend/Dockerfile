FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5173

# Run application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]

