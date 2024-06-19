import { Router } from "express";
import { ClienteController } from "../controllers/clientes.controller.js";

const router = Router();

router.get('/', ClienteController.get);
router.get('/add', ClienteController.renderCreate);
router.post('/add', ClienteController.create);
router.get('/get/:id', ClienteController.getById);
router.get('/edit/:id', ClienteController.renderEdit);
router.post('/edit/:id', ClienteController.edit);
router.get('/delete/:id', ClienteController.delete);

export default router;
