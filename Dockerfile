FROM node:latest

ARG WORKSPACE="/home/app/"
WORKDIR ${WORKSPACE}

COPY . .

RUN yarn install
RUN yarn build