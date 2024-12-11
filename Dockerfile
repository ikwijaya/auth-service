FROM alpine:latest as stage

# SET ENV
ENV APP_DIR="/app"

# ARG
ARG NODE_OPTIONS=--openssl-legacy-provider

# INSTALL NODEJS and NPM
RUN apk add --update nodejs npm bash jq && \
    npm install -g depcheck  # Install depcheck globally

# SET WORK DIRECTORY
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}
COPY . ${APP_DIR}

# Debug
RUN ls -l /app

# PREPARE INSTALL AND BUILDING
RUN rm -rf .git
RUN node -v
RUN npm run clean:build

# Ensure the script is executable
RUN chmod +x /app/uninstall.sh
RUN /app/uninstall.sh
RUN npm run build

# PRODUCTION
FROM alpine:latest

# INSTALL NODEJS and NPM
RUN apk --no-cache add curl busybox
RUN apk add --update nodejs npm

# CREATE USER NON ROOT
RUN adduser -D -u 1001 default
USER 1001

WORKDIR /app
COPY --from=stage /app/dist /app/dist
COPY --from=stage /app/node_modules /app/node_modules
COPY --from=stage /app/public /app/public
COPY --from=stage /app/prisma /app/prisma
COPY --from=stage /app/package.json /app/package.json
COPY --from=stage /app/package-lock.json /app/package-lock.json

RUN chmod +x /app
RUN du -sh *

# EXPOSE FOR ACCESS FROM ANY
EXPOSE 8080
CMD ["npm","run","start"]
