import { Router } from "express";
import { FacturasController } from "../controllers/facturas.controller.js";

const router = Router();

// Redirigir a factura generica
router.get('/', (req,res,next) => res.redirect('/facturas/genericas'));

// Facturas de escala
router.get('/cuentas-escala', (req, res, next) => FacturasController.get('A', req, res, next));
router.get('/cuentas-escala/add', (req, res, next) => FacturasController.renderCreate('A', req, res, next));
router.post('/cuentas-escala/add', (req, res, next) => FacturasController.create('A', req, res, next));
router.get('/cuentas-escala/get/:id', (req, res, next) => FacturasController.getById('A', req, res, next));
router.get('/cuentas-escala/edit/:id', (req, res, next) => FacturasController.renderEdit('A', req, res, next));
router.post('/cuentas-escala/edit/:id', (req, res, next) => FacturasController.edit('A', req, res, next));
router.get('/cuentas-escala/pdf/:id', (req, res, next) => FacturasController.getPDF('A', req, res, next));
router.get('/cuentas-escala/delete/:id', (req, res, next) => FacturasController.delete('A', req, res, next));

// Facturas complementarias
router.get('/complementarias', (req, res, next) => FacturasController.get('B', req, res, next));
router.get('/complementarias/add', (req, res, next) => FacturasController.renderCreate('B', req, res, next));
router.post('/complementarias/add', (req, res, next) => FacturasController.create('B', req, res, next));
router.get('/complementarias/get/:id', (req, res, next) => FacturasController.getById('B', req, res, next));
router.get('/complementarias/edit/:id', (req, res, next) => FacturasController.renderEdit('B', req, res, next));
router.post('/complementarias/edit/:id', (req, res, next) => FacturasController.edit('B', req, res, next));
router.get('/complementarias/pdf/:id', (req, res, next) => FacturasController.getPDF('B', req, res, next));
router.get('/complementarias/delete/:id', (req, res, next) => FacturasController.delete('B', req, res, next));

// Facturas de carga
router.get('/carga', (req, res, next) => FacturasController.get('C', req, res, next));
router.get('/carga/add', (req, res, next) => FacturasController.renderCreate('C', req, res, next));
router.post('/carga/add', (req, res, next) => FacturasController.create('C', req, res, next));
router.get('/carga/get/:id', (req, res, next) => FacturasController.getById('C', req, res, next));
router.get('/carga/edit/:id', (req, res, next) => FacturasController.renderEdit('C', req, res, next));
router.post('/carga/edit/:id', (req, res, next) => FacturasController.edit('C', req, res, next));
router.get('/carga/pdf/:id', (req, res, next) => FacturasController.getPDF('C', req, res, next));
router.get('/carga/delete/:id', (req, res, next) => FacturasController.delete('C', req, res, next));

// Facturas genericas
router.get('/genericas', (req, res, next) => FacturasController.get('AQH', req, res, next));
router.get('/genericas/add', (req, res, next) => FacturasController.renderCreate('AQH', req, res, next));
router.post('/genericas/add', (req, res, next) => FacturasController.create('AQH', req, res, next));
router.get('/genericas/get/:id', (req, res, next) => FacturasController.getById('AQH', req, res, next));
router.get('/genericas/edit/:id', (req, res, next) => FacturasController.renderEdit('AQH', req, res, next));
router.post('/genericas/edit/:id', (req, res, next) => FacturasController.edit('AQH', req, res, next));
router.get('/genericas/pdf/:id', (req, res, next) => FacturasController.getPDF('AQH', req, res, next));
router.get('/genericas/delete/:id', (req, res, next) => FacturasController.delete('AQH', req, res, next));


export default router;
