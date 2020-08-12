FROM node:lts-alpine
RUN apk add --no-cache git tzdata ; mkdir -p /usr/node_app

COPY . /usr/node_app
WORKDIR /usr/node_app
RUN apk add --no-cache git
RUN npm install --production

CMD ["npm", "start"]
