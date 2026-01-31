# Start from the official Go image
FROM golang:1.23-alpine

# Install necessary build tools
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN go build -o main ./cmd/server/main.go

# Create a non-root user (Required for Hugging Face Spaces)
RUN adduser -D -u 1000 user

# Fix permissions for /app (so user can write logs/db if needed)
RUN chown -R user:user /app

USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Expose port 7860 (Hugging Face Default)
EXPOSE 7860
ENV PORT=7860

# Command to run the executable
CMD ["./main"]
