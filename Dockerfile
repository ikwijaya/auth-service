FROM alpine:latest as stage

# ARG
ARG NODE_OPTIONS=--openssl-legacy-provider

# INSTALL NODEJS and NPM
RUN apk add --update nodejs npm bash jq && \
    npm install -g depcheck  # Install depcheck globally

# SET WORK DIRECTORY
RUN mkdir -p /build
WORKDIR /build
COPY . /build

# Debug
RUN ls -l /build

# PREPARE INSTALL AND BUILDING
RUN rm -rf .git
RUN node -v
RUN npm run clean:build

# Ensure the script is executable
RUN chmod +x /build/uninstall.sh
RUN /build/uninstall.sh
RUN npm run build

# PRODUCTION
FROM alpine:latest

# INSTALL NODEJS and NPM
RUN apk --no-cache add curl busybox
RUN apk add --update nodejs npm
RUN mkdir -p /app

# CREATE USER NON ROOT
RUN adduser -D -u 1001 default
USER 1001

WORKDIR /app
COPY --from=stage /build/dist /app/dist
COPY --from=stage /build/node_modules /app/node_modules
COPY --from=stage /build/public /app/public
COPY --from=stage /build/package.json /app/package.json
COPY --from=stage /build/package-lock.json /app/package-lock.json

RUN chmod +x /app
RUN du -sh *
RUN rm -Rf /build

# EXPOSE FOR ACCESS FROM ANY
EXPOSE 8080
CMD ["npm","run","start"]
