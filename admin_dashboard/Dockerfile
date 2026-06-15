# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Install static file server 'serve'
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

# Serve the build folder on port 3000 with SPA routing enabled (-s flag)
CMD ["serve", "-s", "dist", "-l", "3000"]
