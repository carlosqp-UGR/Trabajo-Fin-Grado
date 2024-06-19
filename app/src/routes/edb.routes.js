import { Router } from "express";
import { EDBController } from "../controllers/edb.controller.js";

const router = Router();

router.get('/', EDBController.get);
router.get('/add', EDBController.renderCreate);
router.post('/add', EDBController.create);
router.get('/get/:id', EDBController.getById);
router.get('/edit/:id', EDBController.renderEdit);
router.post('/edit/:id', EDBController.edit);
router.get('/delete/:id', EDBController.delete);

export default router;
