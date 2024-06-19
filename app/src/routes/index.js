import { Router } from "express";
import { isLoggedIn, isAPILoggedIn } from "../middlewares/auth.middleware.js";

import index from "./index.routes.js";
import auth from "./auth.routes.js";
import clientes from "./clientes.routes.js";
import usuarios from "./usuarios.routes.js";
import api from "./api.routes.js";
import edb from "./edb.routes.js";
import facturas from "./facturas.routes.js";
import buques from "./buques.routes.js";
import estadisticas from "./estadisticas.routes.js";
import listados from "./listados.routes.js";

const router = Router();

router.use(auth);
router.use(index);
router.use(usuarios);
router.use('/api', isAPILoggedIn, api);
router.use('/clientes', isLoggedIn, clientes);
router.use('/buques', isLoggedIn, buques);
router.use('/estancias-de-buques', isLoggedIn, edb);
router.use('/facturas', isLoggedIn, facturas);
router.use('/listados', isLoggedIn, listados);
router.use('/estadisticas', isLoggedIn, estadisticas);


export default router;
