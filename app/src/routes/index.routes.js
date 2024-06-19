import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

import { renderIndex } from "../controllers/index.controller.js";

const router = Router();

router.get("/", isLoggedIn, renderIndex);

export default router;
