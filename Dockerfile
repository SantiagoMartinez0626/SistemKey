FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src
COPY test ./test
COPY scripts ./scripts

CMD ["node", "--test"]
