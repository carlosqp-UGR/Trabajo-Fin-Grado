import { Router } from "express";
import { renderInvoiceList, renderScaleList, generateListPDF } from "../controllers/listados.controller.js";

const router = Router();

router.get('/', (req,res,next) => res.redirect('/listados/escalas'));
router.post('/gen-pdf-list', generateListPDF);
router.get('/escalas', renderScaleList);
router.get('/facturas', renderInvoiceList);

export default router;
