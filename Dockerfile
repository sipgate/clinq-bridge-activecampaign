FROM node:16-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
COPY index.js .
RUN npm ci --quiet
USER node
EXPOSE 8080
ENTRYPOINT ["node", "index.js"]
