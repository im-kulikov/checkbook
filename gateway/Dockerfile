# AI gateway: Node 24 on Alpine, no dependencies, no npm install. Tag and digest are pinned; to update deliberately:
#   curl -s 'https://hub.docker.com/v2/repositories/library/node/tags/<tag>' | grep digest
FROM node:24.22.0-alpine3.24@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f
ENV NODE_ENV=production
WORKDIR /app
COPY package.json server.mjs ./
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
