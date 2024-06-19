import { Router } from "express";
import { UsuarioController } from "../controllers/usuarios.controller.js";
import {isLoggedIn, isAdminLoggedIn} from "../middlewares/auth.middleware.js";

const router = Router();

/// Rutas de administración
router.get('/admin/usuarios', isAdminLoggedIn, UsuarioController.get);
router.get('/admin/usuarios/add', isAdminLoggedIn, UsuarioController.renderCreate);
router.post('/admin/usuarios/add', isAdminLoggedIn, UsuarioController.create);
router.get('/admin/usuarios/edit/:id', isAdminLoggedIn, UsuarioController.renderEdit);
router.post('/admin/usuarios/edit/:id', isAdminLoggedIn, UsuarioController.edit);
router.get('/admin/usuarios/change-password/:id', isAdminLoggedIn, UsuarioController.renderChangePassword);
router.post('/admin/usuarios/change-password/:id', isAdminLoggedIn, UsuarioController.changePassword);
router.get('/admin/usuarios/delete/:id', isAdminLoggedIn, UsuarioController.delete);

/// Rutas de perfil (genérico)
router.get('/perfil', isLoggedIn, UsuarioController.getProfile);
router.get('/perfil/edit', isLoggedIn, UsuarioController.renderEditProfile);
router.post('/perfil/edit', isLoggedIn, UsuarioController.editProfile);
router.get('/perfil/change-password', isLoggedIn, UsuarioController.renderChangePasswordProfile);
router.post('/perfil/change-password', isLoggedIn, UsuarioController.changePasswordProfile);

export default router;