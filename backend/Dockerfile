FROM node:18-alpine

# Create user
RUN adduser -D -u 1000 user

WORKDIR /app

# Copy package.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Create uploads dir and set permissions
RUN mkdir -p /app/uploads && chown -R user:user /app

USER user

EXPOSE 7860
ENV PORT=7860

CMD ["npm", "start"]
