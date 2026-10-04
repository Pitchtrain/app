FROM node:24-alpine AS deps
COPY package.json package-lock.json .npmrc* /app/
WORKDIR /app
RUN npm ci

FROM node:24-alpine AS build
# Public URL incl. base path (e.g. https://example.org/); enables canonical
# links, social previews and sitemap.xml. Leave empty for private instances.
ARG SITE_URL=""
ENV VITE_SITE_URL=$SITE_URL
COPY . /app/
COPY --from=deps /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build/client /usr/share/nginx/html
EXPOSE 80
