# server/Dockerfile
FROM node:20-slim

# Install Python and pip
# We need python3 and python3-pip for the fallback script
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Install Python dependencies
# We use --break-system-packages because we are in a container
RUN pip3 install youtube-transcript-api requests --break-system-packages

# Copy app source
COPY . .

# Expose port
EXPOSE 8000

# Start server
CMD ["npm", "start"]
