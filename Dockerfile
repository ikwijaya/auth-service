FROM alpine:latest as stage

# SET ENV
ENV BUILD_DIR="/build"
ENV APP_DIR="/app"

# ARG
ARG NODE_OPTIONS=--openssl-legacy-provider

# INSTALL NODEJS and NPM
RUN apk add --update nodejs npm bash jq && \
    npm install -g depcheck  # Install depcheck globally

# SET WORK DIRECTORY
RUN mkdir -p ${BUILD_DIR}
WORKDIR ${BUILD_DIR}
COPY . ${BUILD_DIR}

# Debug
RUN ls -l ${BUILD_DIR}

# PREPARE INSTALL AND BUILDING
RUN rm -rf .git
RUN node -v
RUN npm run clean:build

# Ensure the script is executable
RUN chmod +x ${BUILD_DIR}/uninstall.sh
RUN ${BUILD_DIR}/uninstall.sh
RUN npm run build

# PRODUCTION
FROM alpine:latest

# INSTALL NODEJS and NPM
RUN apk --no-cache add curl busybox
RUN apk add --update nodejs npm

# CREATE USER NON ROOT
RUN adduser -D -u 1001 default
USER 1001

RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}
COPY --from=stage ${APP_DIR}/dist ${APP_DIR}/dist
COPY --from=stage ${APP_DIR}/node_modules ${APP_DIR}/node_modules
COPY --from=stage ${APP_DIR}/public ${APP_DIR}/public
COPY --from=stage ${APP_DIR}/package.json ${APP_DIR}/package.json
COPY --from=stage ${APP_DIR}/package-lock.json ${APP_DIR}/package-lock.json

RUN chmod +x ${APP_DIR}
RUN du -sh *
RUN rm -Rf ${BUILD_DIR}

# EXPOSE FOR ACCESS FROM ANY
EXPOSE 8080
CMD ["npm","run","start"]
