FROM node:24-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


FROM node:24-alpine AS build

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build


FROM node:24-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

USER node

EXPOSE 4000

CMD ["node", "dist/server.js"]