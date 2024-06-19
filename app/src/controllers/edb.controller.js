import { EDBModel } from "../models/mysql/edb.model.js";

// EDB: Estancia De Buque
export class EDBController {


    static async renderCreate(req, res, next) {
        const data = req.session.formData ? req.session.formData : null;
        delete req.session.formData;

        const target = req.baseUrl;

        let sugerencia_numero = '';
        try {
            sugerencia_numero = await EDBModel.nextNumberEDB();
        } catch (e) {}

        const puertos = EDBModel.getPuertos();
        const materiales = EDBModel.getMateriales();

        res.render('datos/edb', {
            create: true,
            api_clientes: '/api/cliente',
            api_buques: '/api/buque',
            api_edb: '/api/estancia-de-buque',
            target,
            sugerencia_numero,
            puertos,
            materiales,
            data
        });

    }

    static async create(req, res, next) {

        const input = {
            numero: req.body.numero,
            puerto: req.body.puerto,
            buque_nombre: req.body.buque_nombre,
            entrada: req.body.entrada || null,
            salida: req.body.salida || null,
            t2l: req.body.t2l || null,
            dua: req.body.dua || null,
            origen: req.body.origen || null,
            destino: req.body.destino || null,
            armador_nombre: req.body.armador_nombre,
            capitan: req.body.capitan || null,
            material: req.body.material,
            carga: req.body.carga || null,
            cargador_nombre: req.body.cargador_nombre,
            arrival_on_the_road: req.body.arrival_on_the_road || null,
            entrada_fondeadero: req.body.entrada_fondeadero || null,
            salida_fondeadero: req.body.salida_fondeadero || null,
            atraque_puerto: req.body.atraque_puerto || null,
            inicio_carga: req.body.inicio_carga || null,
            fin_carga: req.body.fin_carga || null,
            salida_puerto: req.body.salida_puerto || null,
            observaciones: req.body.observaciones || null
        };

        try {
            await EDBModel.create({input});
            await req.setFlash('success', 'Escala registrada correctamente.');
            res.redirect(req.baseUrl);
        } catch(err) {
            req.session.formData = input;
            if(err.errorType === 'DB_DUPLICATE_ENTRY') {
                await req.setFlash("error", `Ya existe un registro con número ${input[err.errorField]}.`);
            } else if(err.errorType === 'DB_FOREIGN_KEY_CONSTRAINT' && err.errorField === 'armador_nombre') {
                await req.setFlash("error", `No existe ningún cliente con nombre "${input[err.errorField]} (Armador)".`);
            } else if(err.errorType === 'DB_FOREIGN_KEY_CONSTRAINT' && err.errorField === 'buque_nombre') {
                await req.setFlash("error", `No existe ningún buque con nombre "${input[err.errorField]}".`);
            } else if(err.errorType === 'DB_FOREIGN_KEY_CONSTRAINT' && err.errorField === 'cargador_nombre') {
                await req.setFlash("error", `No existe ningún cliente con nombre "${input[err.errorField]}" (Cargador).`);
            } else {
                console.log(err);
                delete req.session.formData;
                await req.setFlash("error", `No pudo registrarse la escala.`);
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
            const materiales = EDBModel.getMateriales();
            const puertos = EDBModel.getPuertos();
            const escala = await EDBModel.getById({id});
            res.render('datos/edb', {
                edit: false,
                api_clientes: '/api/cliente',
                api_buques: '/api/buque',
                ruta_buques: '/buques',
                ruta_clientes: '/clientes',
                target,
                materiales,
                puertos,
                data: escala
            });
        } catch (e) {
            await req.setFlash("error", `No se ha encontrado la escala con ID = ${id}`);
            res.redirect(target);
        }
    }

    static async renderEdit(req, res, next) {
        const {id} = req.params;
        const target = req.baseUrl;
        const data = req.session.formData ? req.session.formData : null;
        delete req.session.formData;

        try {
            const materiales = EDBModel.getMateriales();
            const puertos = EDBModel.getPuertos();
            const estancia = await EDBModel.getById({id});
            res.render('datos/edb', {
                edit: true,
                api_clientes: '/api/cliente',
                api_buques: '/api/buque',
                ruta_buques: '/buques',
                ruta_clientes: '/clientes',
                target,
                materiales,
                puertos,
                data: data || estancia
            });
        } catch (e) {
            await req.setFlash("error", `No se ha encontrado la escala con ID = ${id}`);
            res.redirect(target);
        }
    }

    static async edit (req, res, next) {
        const {id} = req.params;
        const input = {
            id,
            numero: req.body.numero,
            puerto: req.body.puerto,
            buque_nombre: req.body.buque_nombre,
            entrada: req.body.entrada || null,
            salida: req.body.salida || null,
            t2l: req.body.t2l || null,
            dua: req.body.dua || null,
            origen: req.body.origen || null,
            destino: req.body.destino || null,
            armador_nombre: req.body.armador_nombre,
            capitan: req.body.capitan || null,
            material: req.body.material,
            carga: req.body.carga || null,
            cargador_nombre: req.body.cargador_nombre,
            arrival_on_the_road: req.body.arrival_on_the_road || null,
            entrada_fondeadero: req.body.entrada_fondeadero || null,
            salida_fondeadero: req.body.salida_fondeadero || null,
            atraque_puerto: req.body.atraque_puerto || null,
            inicio_carga: req.body.inicio_carga || null,
            fin_carga: req.body.fin_carga || null,
            salida_puerto: req.body.salida_puerto || null,
            observaciones: req.body.observaciones || null
        };

        try {
            await EDBModel.edit({input});
            await req.setFlash('success', 'Escala editada correctamente.');
            res.redirect(`${req.baseUrl}/get/${id}`);
        } catch(err) {
            req.session.formData = input;
            if(err.errorType === 'DB_DUPLICATE_ENTRY') {
                await req.setFlash("error", `Ya existe un registro con número ${input[err.errorField]}.`);
            } else if(err.errorType === 'DB_FOREIGN_KEY_CONSTRAINT' && err.errorField === 'armador_nombre') {
                await req.setFlash("error", `No existe ningún cliente con nombre "${input[err.errorField]} (Armador)".`);
            } else if(err.errorType === 'DB_FOREIGN_KEY_CONSTRAINT' && err.errorField === 'buque_nombre') {
                await req.setFlash("error", `No existe ningún buque con nombre "${input[err.errorField]}".`);
            } else if(err.errorType === 'DB_FOREIGN_KEY_CONSTRAINT' && err.errorField === 'cargador_nombre') {
                await req.setFlash("error", `No existe ningún cliente con nombre "${input[err.errorField]}" (Cargador).`);
            } else {
                console.log(err);
                delete req.session.formData;
                await req.setFlash("error", `No se pudo editar el registro de escala.`);
                res.redirect(req.baseUrl);
                return;
            }
            res.redirect(req.baseUrl + req.path);
        }
    }

    static async search(req,res,next) {
        try{
            const search_query = req.query.search_query || null;
            const search_field = req.query.search_field || null;

            if(!await EDBController.isValidField(search_field)) {
                res.status(400).send('Bad Request');
                return;
            }

            const sugerencias = await EDBModel.search({ search_field, search_query });
            const tiposSugerencias = sugerencias.map(sugerencia => sugerencia[search_field]);
            tiposSugerencias.sort((a, b) => a - b);
            res.json({ sugerencias: tiposSugerencias });
        } catch (e) {
            console.error('Error al buscar sugerencias:', e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async isValidField (search_field) {
        if (search_field && search_field.trim() !== '') {
            const columns = await EDBModel.describe();
            if(columns.includes(search_field.toLowerCase())) {
                return true;
            } else {
                return false;
            }
        } else return true;
    }

    static async delete(req, res, next) {
        const {id} = req.params;
        const target = req.baseUrl;
        try {
            await EDBModel.delete({id});
            await req.setFlash("success", "Registro de escala eliminado correctamente.");
            res.redirect(target);
        } catch(err) {
            await req.setFlash("error", `No se ha podido eliminar el registro de escala con id ${id}.`);
            res.redirect(target);
        }
    }

    static async get(req, res, next) {
        
        const search_query = req.query.search_query || null;
        const search_field = req.query.search_field || null;

        // Definimos sólo las columnas que interesan para la vista, en ese orden...
        const columns = ['numero', 'buque_nombre', 'entrada', 'salida', 't2l', 'dua', 'armador_nombre', 'puerto', 'carga', 'material']
        // Filtrar search_field (en caso de no ser null)
        if (search_field !== null && !columns.includes(search_field)) {
            res.status(400).send('Bad Request');
            return;
        }

        let page = (parseInt(req.query.page, 10) > 0) ? parseInt(req.query.page, 10) : 1;
        const view = (parseInt(req.query.view, 10) > 0) ? parseInt(req.query.view, 10) : 5;
        try {
            const total = await EDBModel.total({search_query, search_field});
            const total_pages = Math.ceil(total/view);
            if(page !== 1 && page>total_pages) page=total_pages;

            const estancias = await EDBModel.get({search_query, search_field, page, view});
            
            // Obtener sólo los campos que interesan para la vista (basado en columns)
            const estancias_view = [];
            for (const estancia of estancias){
                const estancia_view = {};
                estancia_view.id = estancia.id;
                for (const column of columns) {
                    estancia_view[column] = estancia[column];
                }
                estancias_view.push(estancia_view);
            }

            const target = req.baseUrl;
            const api = '/api/estancia-de-buque';

            res.render('list', {
                    title: 'Escalas',
                    search_field_options: columns,
                    columns: columns,
                    data: estancias_view,
                    search_field,
                    search_query,
                    target,
                    page,
                    view,
                    api,
                    total: total_pages,
                    factura:false,
                    button: 'Alta de Escala',
            });
        } catch (e) {
            console.log(e);
            next(e);
        }
    }

    // Custom list
    static async customGet(req, res, next) {
        try{
            // Fields es un checkbox, por lo que son todos aquellos parametros cuyo value es = on (es el nombre del param, no el valor, el que se debe de insertar a fields);
            const fields = [];
            // console.log(req.query);
            for (const param in req.query) {
                // console.log(`param['${param}']=${req.query[param]}`);
                if (req.query[param] === 'on') {
                    fields.push(param);
                }
            }

            // Construir filtros, manualmente...
            const armador_filter = req.query.armador_filter || null;
            const cargador_filter = req.query.cargador_filter || null;
            const capitan_filter = req.query.capitan_filter || null;
            const buque_filter = req.query.buque_filter || null;
            const puerto_filter = req.query.puerto_filter || null;
            const material_filter = req.query.material_filter || null;
            const origen_filter = req.query.origen_filter || null;
            const destino_filter = req.query.destino_filter || null;
            const min_date_filter = req.query.min_date_filter || null;
            const max_date_filter = req.query.max_date_filter || null;

            const filters = {
                armador_filter,
                cargador_filter,
                capitan_filter,
                buque_filter,
                puerto_filter,
                material_filter,
                origen_filter,
                destino_filter,
                min_date_filter,
                max_date_filter
            };

            // console.log(fields);
            // console.log(filters);
            const result = await EDBModel.customGet({fields, filters});
            res.json( result );
        } catch (e) {
            console.error(e);
            // console.error('Error al buscar sugerencias:', e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

}