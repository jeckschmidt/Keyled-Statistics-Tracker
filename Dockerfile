FROM node:22.19.0

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

EXPOSE 3000

ENTRYPOINT ["npm", "run", "start"]