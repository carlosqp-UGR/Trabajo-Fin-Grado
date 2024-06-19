import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { create } from 'express-handlebars';
import handlebarsHelpers from 'handlebars-helpers';
import passport from 'passport';
import {fileURLToPath} from 'url';
import session from "express-session";
import expressMySQLSession from "express-mysql-session";

import { promiseConnectFlash } from 'async-connect-flash';

import routes from './routes/index.js';
import "./lib/passport.js";
// import { pool } from "./database.js";

import { errorHandler } from './middlewares/error.middleware.js';
import { PRODUCTION as production } from './config.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MySQLStore = expressMySQLSession(session);

app.set("views", path.join(__dirname, "views"));
app.engine(
  ".hbs",
  create({
    defaultLayout: "main",
    layoutsDir: path.join(app.get("views"), "layouts"),
    partialsDir: path.join(app.get("views"), "partials"),
    extname: ".hbs",
    helpers: handlebarsHelpers(),
  }).engine
);
app.set("view engine", ".hbs");

// app.use(morgan("dev"));
if(production) {
  app.use(morgan("common"));
} else {
  app.use(morgan("dev"));
}
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// const options = {
//   database: 'session_test',
//   createDatabaseTable: true,
// };

app.use(
  session({
    secret: 'my secret',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 1 día
    }
    // store: new MySQLStore(options, pool),
  })
);


app.use(promiseConnectFlash());
app.use(passport.initialize());

app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

// Utilizar mensajes flash y acceder a la información del usuario
app.use(async (req, res, next) => {
  app.locals.success = await req.getFlash("success");
  app.locals.error = await req.getFlash("error");
  app.locals.user = req.user;
  next();
});

// Mis rutas aqui
app.use(routes);

// Manejador de los distintos casos de error
app.use(errorHandler);

export default app;
  
