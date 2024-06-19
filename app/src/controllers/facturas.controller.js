import stream from 'stream';
import { generateInvoicePDF } from "../lib/pdfkit.js";
import { FacturasModel } from "../models/mysql/facturas.model.js";

export class FacturasController {

    // Devuelve un json con un array {sugerencias: []}
    static async search(tipo, req, res, next) {
        try{
            const search_query = req.query.search_query || null;
            const search_field = req.query.search_field || null;

            if(!await FacturasController.isValidField(tipo, search_field)) {
                res.status(400).send('Bad Request');
                return;
            }

            const sugerencias = await FacturasModel.search({ tipo, search_field, search_query });
            const tiposSugerencias = sugerencias.map(sugerencia => sugerencia[search_field]);
            tiposSugerencias.sort((a, b) => a - b);
            res.json({ sugerencias: tiposSugerencias });
        } catch (e) {
            console.error('Error al buscar sugerencias:', e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async get(tipo, req, res, next) {
        // Params
        const search_query = req.query.search_query || null;
        const search_field = req.query.search_field || null;

        // Definimos sólo las columnas que interesan para la vista, en ese orden...
        const columns = ['num_factura', 'fecha', 'cliente_nombre'];
        if(tipo == 'A' || tipo=='B') columns.push('buque_nombre');
        columns.push('iva');
        columns.push('total_sin_iva');
        columns.push('total_con_iva');

        // Filtrar search_field (en caso de no ser null)
        if (search_field !== null && !columns.includes(search_field)) {
            res.status(400).send('Bad Request');
            return;
        }

        let page = (parseInt(req.query.page, 10) > 0) ? parseInt(req.query.page, 10) : 1;
        const view = (parseInt(req.query.view, 10) > 0) ? parseInt(req.query.view, 10) : 5;
        try {
            const total = await FacturasModel.total({tipo, search_query, search_field});
            const total_pages = Math.ceil(total/view);
            if(page !== 1 && page>total_pages) page=total_pages;

            const facturas = await FacturasModel.get({tipo, search_query, search_field, page, view});

            // Obtener sólo los campos que interesan para la vista (basado en columns)
            const facturas_view = [];
            for (const factura of facturas){
                const factura_view = {};
                factura_view.id = factura.id;
                for (const column of columns) {
                    // console.log(column);
                    factura_view[column] = factura[column];
                }
                facturas_view.push(factura_view);
            }

            // console.log(facturas_view);

            var title = 'Facturas de Cuenta de Escala';
            var button = 'Alta de Factura de Cuenta de Escala';
            var api = '/api/facturas/cuentas-escala';
            if(tipo == 'B') {
                title = 'Facturas Complementarias';
                button = 'Alta de Factura Complementaria';
                api = '/api/facturas/complementarias';
            } else if (tipo == 'C') {
                title = 'Facturas de Carga';
                button = 'Alta de Factura de Carga';
                api = '/api/facturas/carga';
            } else if (tipo =='AQH') {
                title = 'Factura Genéricas';
                button = 'Alta de Factura Genérica';
                api = '/api/facturas/genericas';
            }

            // const columns = Object.keys(facturas[0]);
            const target = req.baseUrl + req.path;

            res.render('list', {
                title,
                button,
                factura: true,
                search_field_options: columns,
                columns: columns,
                data: facturas_view,
                search_field,
                search_query,
                target,
                page,
                view,
                api,
                total: total_pages,
        });

        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    static async renderCreate(tipo, req, res, next) {

        var title = 'Datos de Factura de Cuenta de Escala';
        if(tipo == 'B') title = 'Datos de Factura Complementaria';
        else if (tipo == 'C') title = 'Datos de Factura de Carga';
        else if (tipo =='AQH') title = 'Datos de Factura Genérica';

        const target = req.baseUrl + req.path.substring(0, req.path.lastIndexOf('/'));

        const data = req.session.formData ? req.session.formData : null;
        const invalid_fields = req.session.invalidFields ? req.session.invalidFields : null;

        delete req.session.formData;
        delete req.session.invalidFields;

        var sugerencia_num_factura = '';
        try{
            sugerencia_num_factura = await FacturasModel.nextInvoiceNumber({tipo});
        } catch (e) {
            // No se realiza ninguna accion adicional si falla ese método
        }

        try {
            res.render('datos/factura', {
                tipo,
                title,
                create: true,
                data,
                sugerencia_num_factura,
                target,
                api_cliente: '/api/cliente',
                api_buque: '/api/buque',
            })

        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async create(tipo, req, res, next) {
        const {
            num_factura,
            fecha,
            iva,
            cliente_nombre,
            buque_nombre,
            fecha_entrada,
            fecha_salida,
            precio,
            concepto,
            dia,
        } = req.body;

        const input = {
            tipo,
            num_factura,
            fecha,
            iva,
            cliente_nombre,
            buque_nombre,
            fecha_entrada,
            fecha_salida,
            precio,
            concepto,
            dia,
        }; 

        const redirect_on_success = req.baseUrl + req.path.split('/').slice(0, -1).join('/');
        const redirect_on_failure = req.baseUrl + req.path;
        try {
            await FacturasModel.create({input});
            await req.setFlash("success", "Factura creada correctamente.");
            res.redirect(redirect_on_success);
        } catch (err) {
            req.session.formData = req.body;
            if(err.errorType === 'DB_DUPLICATE_ENTRY') {
                req.session.invalidFields = [err.errorField]; 
                await req.setFlash("error", `Ya existe un registro con ese número de factura (${err.errorField.replace(/^\w/, c => c.toUpperCase())} = ${input[err.errorField]}).`);
            } else if(err.errorType === 'DB_FOREIGN_KEY_CONSTRAINT' && err.errorField === 'cliente_nombre') {
                req.session.invalidFields = [err.errorField]; 
                await req.setFlash("error", `No existe ningún cliente con nombre "${input[err.errorField]}".`);
            } else if(err.errorType === 'DB_FOREIGN_KEY_CONSTRAINT' && err.errorField === 'buque_nombre') {
                req.session.invalidFields = [err.errorField]; 
                await req.setFlash("error", `No existe ningún buque con nombre "${input[err.errorField]}".`);
            } else {
                delete req.session.formData;
                delete req.session.invalidFields;
                await req.setFlash("error", `No pudo crearse la factura.`);
                res.redirect(redirect_on_success);
                return;
            }

            res.redirect(redirect_on_failure);
        }
    }

    static async getById(tipo, req, res, next) {
        const {id} = req.params;        
        const target = req.baseUrl + req.path.split('/').slice(0, -2).join('/');

        try {
            var title = 'Datos de Factura de Cuenta de Escala';
            if(tipo == 'B') title = 'Datos de Factura Complementaria';
            else if (tipo == 'C') title = 'Datos de Factura de Carga';
            else if (tipo =='AQH') title = 'Datos de Factura Genérica';

            const factura = await FacturasModel.getById({tipo, id});

            res.render('datos/factura', {
                title,
                tipo,
                edit: false,
                data: factura,
                target,
                print_target: target + `/pdf/${id}`,
                api_cliente: '/api/cliente',
                api_buque: '/api/buque',
                ruta_clientes: '/clientes',
                ruta_buques: '/buques'
            });

        } catch (e) {
            await req.setFlash("error", `No se ha encontrado la factura de tipo ${tipo.toUpperCase()} con ID = ${id}`);
            res.redirect(target);
        }
    }

    static async renderEdit(tipo, req, res, next) {
        const {id} = req.params;        
        const target = req.baseUrl + req.path.split('/').slice(0, -2).join('/');

        const data = req.session.formData ? req.session.formData : null;
        const invalid_fields = req.session.invalidFields ? req.session.invalidFields : null;
        delete req.session.formData;
        delete req.session.invalidFields;
        
        try {
            var title = 'Datos de Factura de Cuenta de Escala';
            if(tipo == 'B') title = 'Datos de Factura Complementaria';
            else if (tipo == 'C') title = 'Datos de Factura de Carga';
            else if (tipo =='AQH') title = 'Datos de Factura Genérica';

            const factura = await FacturasModel.getById({tipo, id});

            res.render('datos/factura', {
                title,
                tipo,
                edit: true,
                data: data || factura,
                target,
                print_target: target + `/pdf/${id}`,
                api_cliente: '/api/cliente',
                api_buque: '/api/buque',
            });

        } catch (e) {
            await req.setFlash("error", `No se ha encontrado la factura de tipo ${tipo.toUpperCase()} con ID = ${id}`);
            res.redirect(target);
        }
    }

    static async edit(tipo, req, res, next) {
        const {id} = req.params;    

        const {
            num_factura,
            fecha,
            iva,
            cliente_nombre,
            buque_nombre,
            fecha_entrada,
            fecha_salida,
            precio,
            concepto,
            dia,
        } = req.body;

        const input = {
            id,
            tipo,
            num_factura,
            fecha,
            iva,
            cliente_nombre,
            buque_nombre,
            fecha_entrada,
            fecha_salida,
            precio,
            concepto,
            dia,
        }; 

        const redirect_on_success = req.baseUrl + req.path.split('/').slice(0, -2).join('/');
        const redirect_on_failure = req.baseUrl + req.path;
        try {
            await FacturasModel.edit({input});
            await req.setFlash("success", "Factura editada correctamente.");
            res.redirect(redirect_on_success);
        } catch (err) {
            req.session.formData = req.body;
            req.session.formData.id = id;
            if(err.errorType === 'DB_DUPLICATE_ENTRY') {
                req.session.invalidFields = [err.errorField]; 
                await req.setFlash("error", `Ya existe un registro con ese número de factura (${err.errorField.replace(/^\w/, c => c.toUpperCase())} = ${input[err.errorField]}).`);
            } else if(err.errorType === 'DB_FOREIGN_KEY_CONSTRAINT' && err.errorField === 'cliente_nombre') {
                req.session.invalidFields = [err.errorField]; 
                await req.setFlash("error", `No existe ningún cliente con nombre "${input[err.errorField]}".`);
            } else if(err.errorType === 'DB_FOREIGN_KEY_CONSTRAINT' && err.errorField === 'buque_nombre') {
                req.session.invalidFields = [err.errorField]; 
                await req.setFlash("error", `No existe ningún buque con nombre "${input[err.errorField]}".`);
            } else {
                delete req.session.formData;
                delete req.session.invalidFields;
                await req.setFlash("error", `No se pudo editar la factura.`);
                res.redirect(redirect_on_success);
                return;
            }

            res.redirect(redirect_on_failure);
        }
    }

    static async getPDF (tipo, req, res, next) {
        const {id} = req.params;
        try {        
            const factura = await FacturasModel.getById({tipo, id});

            // Set the response headers for a PDF file
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=${factura.num_factura}.pdf`);
        
            // Crear un stream PassThrough
            const bufferStream = new stream.PassThrough();
        
            // Crea el pdf
            await generateInvoicePDF(bufferStream, factura);
        
            // Pipe el contenido del stream PassThrough a la respuesta
            res.status(201);
            bufferStream.pipe(res); 
        } catch (e) {
            if(e.errorType==='DB_NO_RESULT') {
                res.status(404).send(`No existe la factura con id = ${id}`);
                return;
            }
            console.log(e),
            next(e);
        }
    }

    // Comprueba si search_field es válido, previene inyecciones SQL
    static async isValidField (tipo, search_field) {
        if (search_field && search_field.trim() !== '') {
            const columns = await FacturasModel.describe(tipo);
            if(columns.includes(search_field.toLowerCase())) {
                return true;
            } else {
                return false;
            }
        } else return true;
    }

    static async delete(tipo, req, res, next) {
        const {id} = req.params;
        const target = req.baseUrl + req.path.split('/').slice(0, -2).join('/');
        try {
            await FacturasModel.delete({tipo, id});
            await req.setFlash("success", "Factura eliminada correctamente.");
            res.redirect(target);
        } catch(err) {
            await req.setFlash("error", `No se ha podido eliminar la factura con id ${id}.`);
            res.redirect(target);
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
            const numero_filter = req.query.numero_filter || null;
            const tipo_filter = req.query.tipo_filter || null;
            const cliente_filter = req.query.cliente_filter || null;
            const buque_filter = req.query.buque_filter || null;
            const min_date_filter = req.query.min_date_filter || null;
            const max_date_filter = req.query.max_date_filter || null;

            const filters = {
                numero_filter,
                tipo_filter,
                cliente_filter,
                buque_filter,
                min_date_filter,
                max_date_filter
            };

            // console.log(fields);
            // console.log(filters);
            const result = await FacturasModel.customGet({fields, filters});
            // console.log(result);
            res.json( result );
        } catch (e) {
            console.error(e);
            // console.error('Error al buscar sugerencias:', e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }


}