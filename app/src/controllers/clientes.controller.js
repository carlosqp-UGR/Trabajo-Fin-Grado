import { ClienteModel } from "../models/mysql/clientes.model.js";

export class ClienteController {
    static ApiCliente  = '/api/cliente';

    // Devuelve un json con un array {sugerencias: []}
    static async search(req, res, next) {
        try{
            const search_query = req.query.search_query || null;
            const search_field = req.query.search_field || null;

            if(!await ClienteController.isValidField(search_field)) {
                res.status(400).send('Bad Request');
                return;
            }

            const sugerencias = await ClienteModel.search({ search_field, search_query });
            const tiposSugerencias = sugerencias.map(sugerencia => sugerencia[search_field]);
            tiposSugerencias.sort((a, b) => a - b);
            res.json({ sugerencias: tiposSugerencias });
        } catch (e) {
            console.error('Error al buscar sugerencias:', e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async get(req, res, next) {
        // Params
        const search_query = req.query.search_query || null;
        const search_field = req.query.search_field || null;

        // Filtrar search_field
        if(!await ClienteController.isValidField(search_field)) {
            res.status(400).send('Bad Request');
            return;
        }

        let page = (parseInt(req.query.page, 10) > 0) ? parseInt(req.query.page, 10) : 1;
        const view = (parseInt(req.query.view, 10) > 0) ? parseInt(req.query.view, 10) : 5;
        try {
            const total = await ClienteModel.total({search_query, search_field});
            const total_pages = Math.ceil(total/view);
            // Ajustar el valor de page...
            if(page !== 1 && page>total_pages) page=total_pages;

            const clientes = await ClienteModel.get({search_query, search_field, page, view});
            
            let columns = [];
            if(clientes.length>0) {
                columns = Object.keys(clientes[0]);
            } else {
                columns = await ClienteModel.describe();
            }

            const target = req.baseUrl;

            res.render('list', {
                    title: 'Clientes',
                    search_field_options: columns,
                    columns: columns,
                    data: clientes,
                    search_field,
                    search_query,
                    target,
                    page,
                    view,
                    api: ClienteController.ApiCliente,
                    total: total_pages,
                    factura:false,
                    button: 'Alta de Cliente',
            });
        } catch (e) {
            console.log(e);
            next(e);
        }
    }

    static async renderCreate(req, res, next) {
        // Process session data
        const data = req.session.formData ? req.session.formData : null;
        delete req.session.formData;

        const target = req.baseUrl;
        const tipos = ClienteModel.getTipos();

        // render view
        res.render('datos/cliente', {
            create:true, 
            target, 
            data,
            api: ClienteController.ApiCliente,
            tipos,
        });
    }

    static async create (req, res, next) {

        const input = {
            nombre: req.body.nombre,
            tipo: req.body.tipo,
            direccion: req.body.direccion,
            cif: req.body.cif.trim() !== '' ? req.body.cif : null,
            vat: req.body.vat.trim() !== '' ? req.body.vat : null,
            pais: req.body.pais.trim() !== '' ? req.body.pais : null,
            email: req.body.email.trim() !== '' ? req.body.email : null,
            telefono: req.body.telefono.trim() !== '' ? req.body.telefono : null,
            fax: req.body.fax.trim() !== '' ? req.body.fax : null,
            observaciones: req.body.observaciones.trim() !== '' ? req.body.observaciones : null
        }

        try{
            await ClienteModel.create({input});
            await req.setFlash("success", "Cliente creado correctamente.");
            res.redirect(req.baseUrl);
        } catch (err) {
            req.session.formData = input;
            if(err.errorType === 'DB_DUPLICATE_ENTRY') {
                await req.setFlash("error", `Ya existe un registro con ${err.errorField.replace(/^\w/, c => c.toUpperCase())} = ${input[err.errorField]}`);
            } else if(err.errorType === 'DB_INVALID_DATA_TYPE' || err.errorType === 'DB_CHECK_CONSTRAINT') {
                await req.setFlash("error", `Tipo o formato incorrecto del campo ${err.errorField}.`);
            } else {
                delete req.session.formData;
                await req.setFlash("error", "No se ha podido crear el cliente.");
                res.redirect(req.baseUrl);
                return;
            }

            res.redirect(req.baseUrl + req.path);
        }
    }

    static async getById(req, res, next) {
        const {id} = req.params;
        const target = req.baseUrl;

        try {
            const tipos = ClienteModel.getTipos();
            const cliente = await ClienteModel.getById({id});
            res.render('datos/cliente', {
                edit:false, 
                target,
                tipos,
                data: cliente,
            });
        } catch (e) {
            await req.setFlash("error", `No se ha encontrado al cliente con ID = ${id}`);
            res.redirect(target);
        }
    }

    static async renderEdit(req, res, next) {
        const {id} = req.params;
        const target = req.baseUrl;
        const data = req.session.formData ? req.session.formData : null;
        delete req.session.formData;

        try {
            const tipos = ClienteModel.getTipos();
            const cliente = await ClienteModel.getById({id});
            res.render('datos/cliente', {
                edit:true, 
                target, 
                data: data || cliente, 
                tipos,
                api: ClienteModel.ApiCliente
            });
        } catch (e) {
            await req.setFlash("error", `No se ha encontrado al cliente con ID = ${id}`);
            res.redirect(target);
        }
    }

    static async edit(req, res, next) {
        const {id} = req.params;
        const input = {
            id,
            nombre: req.body.nombre,
            tipo: req.body.tipo,
            direccion: req.body.direccion,
            cif: req.body.cif.trim() !== '' ? req.body.cif : null,
            vat: req.body.vat.trim() !== '' ? req.body.vat : null,
            pais: req.body.pais.trim() !== '' ? req.body.pais : null,
            email: req.body.email.trim() !== '' ? req.body.email : null,
            telefono: req.body.telefono.trim() !== '' ? req.body.telefono : null,
            fax: req.body.fax.trim() !== '' ? req.body.fax : null,
            observaciones: req.body.observaciones.trim() !== '' ? req.body.observaciones : null
        };
        
        try {
            await ClienteModel.edit({input});
            await req.setFlash("success", "Cliente editado correctamente.");
            res.redirect(`${req.baseUrl}/get/${id}`);
        } catch(err) {
            req.session.formData = input;
            if(err.errorType === 'DB_DUPLICATE_ENTRY') {
                await req.setFlash("error", `Ya existe un registro con nombre "${input[err.errorField]}".`);
            } else if(err.errorType === 'DB_INVALID_DATA_TYPE' || err.errorType === 'DB_CHECK_CONSTRAINT') {
                await req.setFlash("error", `Tipo o formato incorrecto del campo ${err.errorField}.`);
            } else {
                delete req.session.formData;
                await req.setFlash("error", "No se ha podido modificar el cliente.");
                res.redirect(req.baseUrl);
                return;
            }
            res.redirect(req.baseUrl+req.path);
        }
    }

    static async delete(req, res, next) {
        const {id} = req.params;
        const target = req.baseUrl;
        try {
            await ClienteModel.delete({id});
            await req.setFlash("success", "Cliente eliminado correctamente.");
            res.redirect(target);
        } catch(err) {
            if(err.errorType === 'DB_DELETE_REFERENCED_ERROR') {
                await req.setFlash("error", `No se ha podido eliminar el cliente con id ${id} puesto que aparece referenciado en otro lugar (facturas o estancias de buque).`);
                res.redirect(target+'/get/'+id);
                return;
            }
            await req.setFlash("error", `No se ha podido eliminar el cliente con id ${id}.`);
            res.redirect(target);
        }
    }

    static async isValidField (search_field) {
        if (search_field && search_field.trim() !== '') {
            const columns = await ClienteModel.describe();
            if(columns.includes(search_field.toLowerCase())) {
                return true;
            } else {
                return false;
            }
        } else return true;
    }

}