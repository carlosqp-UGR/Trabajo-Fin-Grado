// To authenticate users (related with login)
import { Router } from "express";
import { isLoggedIn, isNotLoggedIn } from "../middlewares/auth.middleware.js";
import { renderLogin, login, logout} from "../controllers/auth.controller.js";
const router = Router();

router.get('/login', isNotLoggedIn, renderLogin);
router.post('/login', isNotLoggedIn, login);
router.get('/logout', isLoggedIn, logout);

export default router;
