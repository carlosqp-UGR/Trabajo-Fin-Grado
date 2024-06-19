import { Router } from "express";
import { EstadisticasController } from "../controllers/estadisticas.controller.js";
const router = Router();

router.get('/', (req,res,next) => res.redirect('/estadisticas/buques'));
router.get('/clientes', EstadisticasController.renderClientStatistics);
router.get('/buques', EstadisticasController.renderVesselStatistics);

export default router;
