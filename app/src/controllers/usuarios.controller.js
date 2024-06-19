import { UsuarioModel } from "../models/mysql/usuarios.model.js";

export class UsuarioController {

    /// Admin functionality
    static async get(req, res, next) {
        const target = req.baseUrl + req.path;
        try {
            const usuarios = await UsuarioModel.get();
            res.render('usuarios/list', {
                usuarios,
                target
            });
        } catch (err) {
            next(err);
            return;
        }
    }

    static renderCreate(req, res, next) {
        const target = req.baseUrl + req.path.split('/').slice(0, -1).join('/');
        
        const data = req.session.formData ? req.session.formData : null;
        delete req.session.formData;

        res.render('usuarios/add', {target, data});
    }

    static async create(req, res, next) {
        const redirectOnSuccess = req.baseUrl + req.path.split('/').slice(0, -1).join('/');
        const redirectOnFailure = req.baseUrl + req.path;

        const input = {
            fullname: req.body.fullname,
            username: req.body.username,
            password: req.body.password,
            admin: req.body.admin === 'si' ? true : false
        };
       
        try {
            await UsuarioModel.create({input});
            await req.setFlash("success", "Usuario creado correctamente.");
            res.redirect(redirectOnSuccess);
        } catch (err) {
            console.log(err);
            if(err.errorType === 'DB_DUPLICATE_ENTRY') {
                req.session.formData = input;
                await req.setFlash('error', `Ya existe un usuario con nombre de usuario "${input.username}".`);
                res.redirect(redirectOnFailure);
                return;
            }
            await req.setFlash('error', `No se pudo crear el usuario.`);
            res.redirect(redirectOnSuccess);
        }
    }

    static async renderEdit(req,res,next) {
        const {id} = req.params;
        const target = req.baseUrl + req.path.split('/').slice(0, -2).join('/');

        // Evita que el administrador se pueda editar a sí mismo
        try {
            if (parseInt(id) === parseInt(req.user.id)) {
                await req.setFlash('error', `Para editar tu perfil, accede a /perfil.`);
                res.redirect(target);
                return;
            }
        } catch (err) {
            console.log('Error... in debug mode');
        }

        try {
            const usuario = await UsuarioModel.getById({id});
            res.render('usuarios/edit', {
                title: 'Editar usuario',
                edit: true,
                target,
                data: usuario 
            });
        } catch (err) {
            await req.setFlash('error', `No se encontró al usuario con ID ${id}.`);
            res.redirect(target);
        }
    }

    static async edit(req,res,next) {
        const {id} = req.params;
        const input = {
            id,
            fullname: req.body.fullname,
            username: req.body.username,
            admin: req.body.admin === 'si' ? true : false
        };

        const redirectOnSuccess = req.baseUrl + req.path.split('/').slice(0, -2).join('/');
        const redirectOnFailure = req.baseUrl + req.path;

        // Evita que el administrador se pueda editar a sí mismo
        try {
            if (parseInt(id) === parseInt(req.user.id)) {
                await req.setFlash('error', `Eres administrador, no puedes editarte a tí mismo.`);
                res.redirect(redirectOnSuccess);
                return;
            }
        } catch (err) {
            console.log('Error... in debug mode');
        }

        try {
            await UsuarioModel.edit({input});
            await req.setFlash('success', 'Usuario modificado correctamente.');
            res.redirect(redirectOnSuccess);     
        } catch (err) {
            if(err.errorType === 'DB_DUPLICATE_ENTRY') {
                // req.session.formData = input;
                await req.setFlash('error', `Ya existe un usuario con nombre de usuario "${input.username}".`);
                res.redirect(redirectOnFailure);
            } else {
                await req.setFlash('error', 'No se pudo editar al usuario.');
                res.redirect(redirectOnSuccess);
            }
        }
    }

    static async renderChangePassword(req,res,next) {
        const {id} = req.params;
        const target = req.baseUrl + req.path.split('/').slice(0, -2).join('/');
        try {
            const usuario = await UsuarioModel.getById({id});
            res.render('usuarios/change-password', {
                perfil: false,
                data: usuario,
                target
            });
        } catch (err) {
            await req.setFlash('error', `No se encontró al usuario con ID ${id}.`);
            res.redirect(target);
        }
    }

    static async changePassword(req,res,next) {
        const target = req.baseUrl + req.path.split('/').slice(0, -2).join('/');

        try {
            const {id} = req.params;
            const passwd = req.body.password;
            await UsuarioModel.changePassword({id, newPassword: passwd});
            await req.setFlash('success', 'Contraseña cambiada correctamente.');
            res.redirect(target);
        } catch (err) {
            await req.setFlash('error', 'No se pudo cambiar la contraseña.');
            res.redirect(target);
        }
    }

    static async delete(req,res,next) {
        const target = req.baseUrl + req.path.split('/').slice(0, -2).join('/');
        const {id} = req.params;

        // Evita que el usuario (administrador) se elimine a sí mismo
        try {
            if (parseInt(id) === parseInt(req.user.id)) {
                await req.setFlash('error', `No puedes eliminarte a tí mismo.`);
                res.redirect(target);
                return;
            }
        } catch (err) {
            console.log('Error... in debug mode');
        }

        try {
            await UsuarioModel.delete({id});
            await req.setFlash('success', 'Usuario eliminado correctamente.')
        } catch (err) {
            await req.setFlash('error', `No se pudo eliminar al usuario con ID=${id}.`);
        }
        res.redirect(target);
    }

    /// Profile functionality
    static async getProfile(req,res,next) {
        try {
            const data = req.user;
            res.render('usuarios/profile', {
                edit: false,
                target: req.baseUrl + req.path,
                data
            });
        } catch(e) {
            // console.log(e);
            await req.setFlash('error', 'Para acceder al perfil debes iniciar sesión antes.');
            res.redirect('/login');
        }
    }

    static async renderEditProfile(req,res,next) {
        const target = req.baseUrl + req.path.split('/').slice(0, -1).join('/');
        try {
            res.render('usuarios/profile', {
                edit: true,
                target, 
                data: req.user,
            })
        } catch(e) {
            // console.log(e);
            await req.setFlash('error', 'Para acceder al perfil debes iniciar sesión antes.');
            res.redirect('/login');
        }
    }

    static async editProfile(req,res,next) {
        const target = req.baseUrl + req.path.split('/').slice(0, -1).join('/');
        const input = {
            id: req.user.id,
            username: req.body.username,
            fullname: req.body.fullname
        };

        try {
            await UsuarioModel.editProfile({input});
            await req.setFlash('success', 'Perfil editado correctamente.');
            res.redirect(target);
        } catch (err) {
            console.log(err);
            if(err.errorType === 'DB_DUPLICATE_ENTRY') {
                await req.setFlash('error', `Ya existe un usuario con nombre de usuario "${input.username}".`);
                res.redirect(`${target}/edit`);
            } else {
                await req.setFlash('error', 'No se ha podido modificar tu perfil.');
                res.redirect(target);
            }
        }
    }

    static async renderChangePasswordProfile(req,res,next) {
        const target = req.baseUrl + req.path.split('/').slice(0, -1).join('/');
        res.render('usuarios/change-password', {
            perfil: true,
            data: req.user,
            target,
        });
    }

    static async changePasswordProfile (req,res,next) {
        const target = req.baseUrl + req.path.split('/').slice(0, -1).join('/');
        try {
            const id = req.user.id;
            const passwd = req.body.password;
            await UsuarioModel.changePassword({id, newPassword: passwd});
            await req.setFlash('success', 'Contraseña cambiada correctamente.');
            res.redirect(target);
        } catch (err) {
            await req.setFlash('error', 'No se pudo cambiar la contraseña.');
            console.log(err);
            res.redirect(target);    
        }
    }

}
