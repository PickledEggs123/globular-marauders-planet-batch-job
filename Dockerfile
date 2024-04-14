FROM node:16-alpine as builder

WORKDIR /app

COPY . .

ARG _GITHUB_ACCESS_TOKEN

RUN echo "always-auth=true" > ~/.npmrc
RUN echo "//npm.pkg.github.com/:_authToken=${_GITHUB_ACCESS_TOKEN}" >> ~/.npmrc
RUN npm install --legacy-peer-deps --only=dev
RUN npx tsc
RUN rm -f ~/.npmrc

FROM node:16-alpine

WORKDIR /app

RUN rm -rf ./*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENTRYPOINT ["node", "./dist/index.js"]