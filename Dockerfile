# First stage: build the react app
# FROM tiangolo/node-frontend:10 as build-stage
FROM node:20.0.0
WORKDIR /server
COPY ./ ./
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start"]