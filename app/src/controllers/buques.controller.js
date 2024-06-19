import { BuqueModel } from "../models/mysql/buques.model.js";

export class BuqueController {

    static ApiBuques = '/api/buque';

    static async isValidField (search_field) {
        if (search_field && search_field.trim() !== '') {
            const columns = await BuqueModel.describe();
            if(columns.includes(search_field.toLowerCase())) {
                return true;
            } else {
                return false;
            }
        } else return true;
    }

    // Devuelve un json con un array {sugerencias: []}
    static async search(req, res, next) {
        try{
            const search_query = req.query.search_query || null;
            const search_field = req.query.search_field || null;

            if(!await BuqueController.isValidField(search_field)) {
                res.status(400).send('Bad Request');
                return;
            }

            const sugerencias = await BuqueModel.search({ search_field, search_query });
            const tiposSugerencias = sugerencias.map(sugerencia => sugerencia[search_field]);
            tiposSugerencias.sort((a, b) => a - b);
            res.json({ sugerencias: tiposSugerencias });
        } catch (e) {
            console.error('Error al buscar sugerencias:', e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async get(req, res, next) {
        
        const search_query = req.query.search_query || null;
        const search_field = req.query.search_field || null;

        if(!await BuqueController.isValidField(search_field)) {
            res.status(400).send('Bad Request');
            return;
        }

        let page = (parseInt(req.query.page, 10) > 0) ? parseInt(req.query.page, 10) : 1;
        const view = (parseInt(req.query.view, 10) > 0) ? parseInt(req.query.view, 10) : 5;
        try {
            const total = await BuqueModel.total({search_query, search_field});
            const total_pages = Math.ceil(total/view);
            if(page !== 1 && page>total_pages) page=total_pages;

            const buques = await BuqueModel.get({search_query, search_field, page, view});
            
            let columns = [];
            if(buques.length>0) {
                columns = Object.keys(buques[0]);
            } else {
                columns = await BuqueModel.describe();
            }
            const target = req.baseUrl;

            res.render('list', {
                    title: 'Buques',
                    search_field_options: columns,
                    columns: columns,
                    data: buques,
                    search_field,
                    search_query,
                    target,
                    page,
                    view,
                    api: BuqueController.ApiBuques,
                    total: total_pages,
                    factura:false,
                    button: 'Alta de Buque',
            });
        } catch (e) {
            console.log(e);
            next(e);
        }
    }

    static async renderCreate(req, res, next) {
        const data = req.session.formData ? req.session.formData : null;
        delete req.session.formData;

        const target = req.baseUrl;

        res.render('datos/buque', {
            create:true, 
            target, 
            api:  BuqueController.ApiBuques,
            data
        });
    }

    static async create(req,res,next) {
        const input = {
            nombre: req.body.nombre,
            matricula: req.body.matricula || null,
            bandera: req.body.bandera || null,
            trb: req.body.trb || null,
            trn: req.body.trn || null,
            eslora: req.body.eslora || null,
            calado: req.body.calado || null,
            manga: req.body.manga || null,
            observaciones: req.body.observaciones || null
        };

        try {
            await BuqueModel.create({input});
            await req.setFlash('success', 'Buque creado correctamente.')
            res.redirect(req.baseUrl);
        } catch (e) {
            req.session.formData = input;
            if(e.errorType === 'DB_DUPLICATE_ENTRY') {
                await req.setFlash(`error`, `Ya existe un registro con el mismo nombre.`)
            } else {
                delete req.session.formData;
                await req.setFlash(`error`, `No se ha podido crear el buque.`)
                res.redirect(req.baseUrl);
                return;
            }
            res.redirect(req.baseUrl + req.path);
        }
    }

    static async getById(req,res,next) {
        const {id} = req.params;

        try {
            const buque = await BuqueModel.getById({id});
            res.render('datos/buque', {
                edit: false, 
                target: req.baseUrl, 
                api: '/api/buque',
                data: buque
            });
        } catch (e) {
            await req.setFlash("error", `No existe el buque con ID ${id}`);
            res.redirect(req.baseUrl);
        }
    }

    static async renderEdit(req,res,next) {
        const {id} = req.params;
        const data = req.session.formData ? req.session.formData : null;
        delete req.session.formData;
        try {
            const buque = await BuqueModel.getById({id});
            res.render('datos/buque', {
                edit: true, 
                target: req.baseUrl, 
                api: '/api/buque',
                data: data || buque
            });
        } catch (e) {
            await req.setFlash("error", `No existe el buque con ID ${id}`);
            res.redirect(req.baseUrl);
        }
    }

    static async edit(req,res,next) {
        const {id} = req.params;
        const input = {
            id,
            nombre: req.body.nombre,
            matricula: req.body.matricula || null,
            bandera: req.body.bandera || null,
            trb: req.body.trb || null,
            trn: req.body.trn || null,
            eslora: req.body.eslora || null,
            calado: req.body.calado || null,
            manga: req.body.manga || null,
            observaciones: req.body.observaciones || null
        };

        try {
            await BuqueModel.edit({input});
            await req.setFlash('success', 'Buque modificado correctamente.')
            res.redirect(`${req.baseUrl}/get/${id}`);
        } catch(e) {
            if (e.errorType === 'DB_DUPLICATE_ENTRY') {
                req.session.formData = input;
                req.session.formData.id = id;
                await req.setFlash(`error`, `Ya existe un registro con el mismo nombre.`)
                res.redirect(`${req.baseUrl}/edit/${id}`);
                return;
            }

            await req.setFlash('error', `No se ha podido modificar el buque con ID ${id}`);
            res.redirect(`${req.baseUrl}/get/${id}`);
        }
    }

    static async delete(req, res, next) {
        const {id} = req.params;
        const target = req.baseUrl;
        
        try {
            await BuqueModel.delete({id});
            await req.setFlash("success", "Buque eliminado correctamente.");
            res.redirect(target);
        } catch(err) {
            if(err.errorType === 'DB_DELETE_REFERENCED_ERROR') {
                await req.setFlash("error", `No se puede eliminar el buque con ID ${id} porque está siendo referenciado en otros registros, como facturas o estancias de buque.`);
                res.redirect(target+'/get/'+id);
                return;
            }
            await req.setFlash("error", `No se ha podido eliminar el buque con ID ${id}.`);
            res.redirect(target);
        }
    }

}