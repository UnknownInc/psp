# ARG BUILDID
# ARG COMMITID
FROM node:12.13.0-alpine AS base
RUN apk add --update --no-cache \
    python \
    git \
    make \
    g++

FROM base AS build

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json /psp/

WORKDIR /psp
RUN npm install

COPY . ./

RUN npm run build

RUN rm -rf node_modules

FROM base AS uibuild

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY client/package*.json /client/

WORKDIR /client
RUN npm install

COPY ./client ./

RUN npm run build

# Use the official Node.js 12 image.
# https://hub.docker.com/_/node
FROM node:12.13.0-alpine
RUN apk add --update --no-cache curl

# Create and change to the app directory.
WORKDIR /usr/src/app

COPY --from=build /psp .

ARG BUILDID='000'
ARG COMMITID='XXX'

RUN date > BUILD_DATE
RUN echo ${BUILDID} > BUILD_ID
RUN echo ${COMMITID} > COMMIT_ID

# Install production dependencies.
RUN npm install --only=production

COPY --from=uibuild /client/build ./client/build

RUN addgroup -S nodejs && adduser -G -S nodejs nodejs
USER nodejs

# Run the web service on container startup.
CMD [ "npm", "start" ]