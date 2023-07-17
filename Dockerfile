FROM node:16-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

FROM node:16-alpine AS server
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile
COPY --from=builder ./app/public ./public
COPY --from=builder ./app/build ./build

# $PORT is set by Heroku			
ENV PORT=$PORT
ENV NODE_ENV=production

CMD ["yarn", "start"]
