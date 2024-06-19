import { Router } from "express";
import { BuqueController } from "../controllers/buques.controller.js";

const router = Router();

router.get('/', BuqueController.get);
router.get('/add', BuqueController.renderCreate);
router.post('/add', BuqueController.create);
router.get('/get/:id', BuqueController.getById);
router.get('/edit/:id', BuqueController.renderEdit);
router.post('/edit/:id', BuqueController.edit);
router.get('/delete/:id', BuqueController.delete);


export default router;