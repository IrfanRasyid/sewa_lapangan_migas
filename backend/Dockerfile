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

# Expose port 8080
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
