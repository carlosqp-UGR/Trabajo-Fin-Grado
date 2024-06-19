import { Router } from "express";
import { ClienteController } from "../controllers/clientes.controller.js";
import { FacturasController } from "../controllers/facturas.controller.js";
import { BuqueController } from "../controllers/buques.controller.js";
import { EDBController } from "../controllers/edb.controller.js";
import { EstadisticasController } from "../controllers/estadisticas.controller.js";

const router = Router();

// Endpoints de búsqueda
router.get('/cliente',  ClienteController.search);
router.get('/buque', BuqueController.search);
router.get('/estancia-de-buque', EDBController.search);

router.get('/facturas', (req, res, next) => FacturasController.search('G', req, res, next));        // Global search
router.get('/facturas/cuentas-escala', (req, res, next) => FacturasController.search('A', req, res, next));
router.get('/facturas/complementarias', (req, res, next) => FacturasController.search('B', req, res, next));
router.get('/facturas/carga', (req, res, next) => FacturasController.search('C', req, res, next));
router.get('/facturas/genericas', (req, res, next) => FacturasController.search('AQH', req, res, next));

// Endpoint para generar listados
router.get('/list/escalas', EDBController.customGet);
router.get('/list/facturas', FacturasController.customGet);

// Endpoints de distintas estadísticas
router.get('/stats/cliente/tipo', EstadisticasController.clientByType);
router.get('/stats/cliente/escalas/origen', EstadisticasController.clientByOrigin);
router.get('/stats/cliente/escalas/tiempo', EstadisticasController.clientScalesTime);
router.get('/stats/cliente/escalas/carga-fecha', EstadisticasController.clientScalesByDate);
router.get('/stats/cliente/escalas/carga-visitas', EstadisticasController.scalesByClients);
router.get('/stats/cliente/escalas/carga-destinos', EstadisticasController.scalesByClientsDestination);

router.get('/stats/cliente/facturas/fecha', EstadisticasController.clientsInvoiceByDate);
router.get('/stats/cliente/facturas/general', EstadisticasController.clientsInvoiceGlobal);

router.get('/stats/buque/general', EstadisticasController.vesselGlobal);
router.get('/stats/buque/bandera', EstadisticasController.vesselByFlag);
router.get('/stats/buque/escalas/carga-fecha', EstadisticasController.vesselScalesByDate);
router.get('/stats/buque/escalas/carga-visitas', EstadisticasController.scalesByVessels);
router.get('/stats/buque/escalas/tiempo', EstadisticasController.vesselScalesTime);
router.get('/stats/buque/escalas/origen', EstadisticasController.vesselScalesOrigin);
router.get('/stats/buque/escalas/destino', EstadisticasController.vesselScalesDestination);

export default router;
