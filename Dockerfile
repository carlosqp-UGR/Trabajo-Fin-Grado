FROM node:latest

# Define las variables de entorno con valores predeterminados
ENV DATABASE_HOST=localhost \
    DATABASE_USER=app-user \
    DATABASE_PASSWORD=app-passwd \
    DATABASE_NAME=gestion_ansada \
    PORT=3000 \
    SECRET=some_secret_key \
    PRODUCTION=true

WORKDIR /usr/src/app
COPY ./app/ .
RUN npm install
EXPOSE ${PORT}
CMD ["npm", "start"]