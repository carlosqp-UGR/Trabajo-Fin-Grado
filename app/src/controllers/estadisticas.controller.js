import { EstadisticasModel } from "../models/mysql/estadisticas.model.js";

export class EstadisticasController {

    /// Render views
    static async renderClientStatistics(req,res,next) {
        const printUrl = '/listados/gen-pdf-list';
        const apiClienteTipo = '/api/stats/cliente/tipo';
        const apiClienteOrigen = '/api/stats/cliente/escalas/origen';
        const apiClienteCargaFecha = '/api/stats/cliente/escalas/carga-fecha';
        const apiClienteEscalas = '/api/stats/cliente/escalas/carga-visitas';
        const apiClienteDestino = '/api/stats/cliente/escalas/carga-destinos';
        const apiClienteTiempo = '/api/stats/cliente/escalas/tiempo';
        const apiClienteFacturacionFecha = '/api/stats/cliente/facturas/fecha';
        const apiClienteFacturacion = '/api/stats/cliente/facturas/general';

        const apiSugerenciasCliente = '/api/cliente';
        const apiSugerenciasEscala = '/api/estancia-de-buque';
        const apiSugerenciasFactura = '/api/facturas';
        
        res.render('estadisticas/clientes', {
            printUrl,
            apiClienteTipo,
            apiClienteOrigen,
            apiClienteCargaFecha,
            apiClienteEscalas,
            apiClienteDestino,
            apiClienteTiempo,
            apiClienteFacturacionFecha,
            apiClienteFacturacion,
            apiSugerenciasCliente,
            apiSugerenciasEscala,
            apiSugerenciasFactura
        });
    }

    static async renderVesselStatistics(req,res,next) {
        const printUrl = '/listados/gen-pdf-list';
        const apiBuqueTecnico = '/api/stats/buque/general';
        const apiBuqueBandera = '/api/stats/buque/bandera';
        const apiBuqueCargaFecha = '/api/stats/buque/escalas/carga-fecha';
        const apiBuqueEscalas = '/api/stats/buque/escalas/carga-visitas';
        const apiBuqueTiempo = '/api/stats/buque/escalas/tiempo';
        const apiBuqueOrigen = '/api/stats/buque/escalas/origen';
        const apiBuqueDestino = '/api/stats/buque/escalas/destino';

        const apiSugerenciasCliente = '/api/cliente';
        const apiSugerenciasBuque = '/api/buque';
        const apiSugerenciasEscala = '/api/estancia-de-buque';
        
        res.render('estadisticas/buques', {
            printUrl,
            apiBuqueTecnico,
            apiBuqueBandera,
            apiBuqueCargaFecha,
            apiBuqueEscalas,
            apiBuqueTiempo,
            apiBuqueOrigen,
            apiBuqueDestino,
            apiSugerenciasCliente,
            apiSugerenciasEscala,
            apiSugerenciasBuque
        });
    }
    
    /// API Client estatistics

    static async clientByType(req,res,next) {
        try {
            const result = await EstadisticasModel.clientByType();
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async clientByOrigin(req, res, next) {
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const puerto_filter = (req.query.puerto_filter === null || req.query.puerto_filter === undefined || req.query.puerto_filter === 'any') ? null : req.query.puerto_filter;
        try {
            const result = await EstadisticasModel.clientByOrigin({min_date_filter,max_date_filter,puerto_filter});
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async clientScalesByDate(req, res, next) {
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const date_group_filter = req.query.date_group_filter || 'DAY';
        const cliente_filter = req.query.cliente_filter || null;
        const puerto_filter = (req.query.puerto_filter === null || req.query.puerto_filter === undefined || req.query.puerto_filter === 'any') ? null : req.query.puerto_filter;
        const material_filter = req.query.material_filter || null;

        try {
            const result = await EstadisticasModel.clientScalesByDate({min_date_filter, max_date_filter, date_group_filter, cliente_filter, puerto_filter, material_filter});
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async scalesByClients(req, res, next) {
        
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const puerto_filter = (req.query.puerto_filter === null || req.query.puerto_filter === undefined || req.query.puerto_filter === 'any') ? null : req.query.puerto_filter;
        const material_filter = req.query.material_filter || null;
        const tipo_cliente_filter = req.query.tipo_cliente_filter || null;

        try {
            const result = await EstadisticasModel.scalesByClients({min_date_filter, max_date_filter, material_filter, puerto_filter, tipo_cliente_filter});
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async scalesByClientsDestination(req, res, next) {
        
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const cliente_filter = req.query.cliente_filter || null;
        const puerto_filter = (req.query.puerto_filter === null || req.query.puerto_filter === undefined || req.query.puerto_filter === 'any') ? null : req.query.puerto_filter;
        const material_filter = req.query.material_filter || null;

        try {
            const result = await EstadisticasModel.scalesByClientsDestination({min_date_filter, max_date_filter, puerto_filter, material_filter, cliente_filter});
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async clientScalesTime(req, res, next) {
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const cliente_filter = req.query.cliente_filter || null;
        const puerto_filter = (req.query.puerto_filter === null || req.query.puerto_filter === undefined || req.query.puerto_filter === 'any') ? null : req.query.puerto_filter;
        const material_filter = req.query.material_filter || null;
        const tipo_cliente_filter = req.query.tipo_cliente_filter || null;

        try {
            const result = await EstadisticasModel.clientScalesTime({min_date_filter, max_date_filter, puerto_filter, material_filter, cliente_filter, tipo_cliente_filter});
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async clientsInvoiceByDate(req,res,next) {
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const date_group_filter = req.query.date_group_filter || 'DAY';
        const cliente_filter = req.query.cliente_filter || null;
        const tipo_factura_filter = req.query.tipo_factura_filter || null;

        try {
            const result = await EstadisticasModel.clientsInvoiceByDate({min_date_filter, max_date_filter, date_group_filter, tipo_factura_filter, cliente_filter});
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    // En frontend... group by Tipo de Factura... select view(dia, mes, año) 
    static async clientsInvoiceGlobal(req, res, next) {
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const cliente_filter = req.query.cliente_filter || null;
        const tipo_factura_filter = req.query.tipo_factura_filter || null;

        try {
            const result = await EstadisticasModel.clientsInvoiceGlobal({min_date_filter, max_date_filter, tipo_factura_filter, cliente_filter});
            console.log(result);
            
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    /// API Estadisticas de BUQUES
    static async vesselGlobal(req,res,next) {
        const buque_filter = req.query.buque_filter || null;

        try {
            const result = await EstadisticasModel.vesselGlobal({buque_filter});
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async vesselByFlag(req,res,next) {
        try {
            const result = await EstadisticasModel.vesselByFlag();
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async vesselScalesByDate(req,res,next) {
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const date_group_filter = req.query.date_group_filter || 'DAY';
        const buque_filter = req.query.buque_filter || null;
        const armador_filter = req.query.armador_filter || null;
        const cargador_filter = req.query.cargador_filter || null;
        const puerto_filter = (req.query.puerto_filter === null || req.query.puerto_filter === undefined || req.query.puerto_filter === 'any') ? null : req.query.puerto_filter;
        const material_filter = req.query.material_filter || null;
        try {
            const result = await EstadisticasModel.vesselScalesByDate({
                min_date_filter,
                max_date_filter,
                date_group_filter,
                buque_filter,
                armador_filter,
                cargador_filter,
                puerto_filter,
                material_filter
            });
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async scalesByVessels(req,res,next) {
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const buque_filter = req.query.buque_filter || null;
        const armador_filter = req.query.armador_filter || null;
        const cargador_filter = req.query.cargador_filter || null;
        const puerto_filter = (req.query.puerto_filter === null || req.query.puerto_filter === undefined || req.query.puerto_filter === 'any') ? null : req.query.puerto_filter;
        const material_filter = req.query.material_filter || null;
        try {
            const result = await EstadisticasModel.scalesByVessels({
                min_date_filter,
                max_date_filter,
                buque_filter,
                armador_filter,
                cargador_filter,
                puerto_filter,
                material_filter
            });
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }

    }

    static async vesselScalesTime(req,res,next) {
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const buque_filter = req.query.buque_filter || null;
        const puerto_filter = (req.query.puerto_filter === null || req.query.puerto_filter === undefined || req.query.puerto_filter === 'any') ? null : req.query.puerto_filter;
        const material_filter = req.query.material_filter || null;
        try {
            const result = await EstadisticasModel.vesselScalesTime({
                min_date_filter,
                max_date_filter,
                buque_filter, 
                puerto_filter,
                material_filter
            });
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async vesselScalesOrigin(req,res,next) {
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const buque_filter = req.query.buque_filter || null;
        const puerto_filter = (req.query.puerto_filter === null || req.query.puerto_filter === undefined || req.query.puerto_filter === 'any') ? null : req.query.puerto_filter;
        const material_filter = req.query.material_filter || null;
        try {
            const result = await EstadisticasModel.vesselScalesOrigin({
                min_date_filter,
                max_date_filter,
                buque_filter, 
                puerto_filter,
                material_filter
            });
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }

    static async vesselScalesDestination(req,res,next) {
        const min_date_filter = req.query.min_date_filter || null;
        const max_date_filter = req.query.max_date_filter || null;
        const buque_filter = req.query.buque_filter || null;
        const puerto_filter = (req.query.puerto_filter === null || req.query.puerto_filter === undefined || req.query.puerto_filter === 'any') ? null : req.query.puerto_filter;
        const material_filter = req.query.material_filter || null;
        try {
            const result = await EstadisticasModel.vesselScalesDestination({
                min_date_filter,
                max_date_filter,
                buque_filter, 
                puerto_filter,
                material_filter
            });
            res.json( result );
        } catch (e) {
            console.error(e);
            res.status(500).json({ e: 'Error interno del servidor' });
        }
    }
        
}