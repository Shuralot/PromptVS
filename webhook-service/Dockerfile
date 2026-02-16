FROM node:20-alpine

WORKDIR /app

# Copy the package.json and install dependencies
COPY webhook-service/package*.json ./
RUN npm install

# Copy the prisma schema from the root
COPY prisma ./prisma

# Copy the service code
COPY webhook-service/*.js ./

# Generate the Prisma client
RUN rm -f prisma.config.*
RUN npx prisma generate

EXPOSE 5001

CMD ["npm", "start"]
