import { pool } from "../../database.js";

export class EstadisticasModel {

    ///////////////// ESTADISTICAS DE CLIENTES /////////////////
    static async clientByType() {
        // select tipo, count(*) as numero from cliente group by tipo;
        const [data] = await pool.query( `SELECT tipo, count(*) AS numero FROM cliente GROUP BY tipo`);
        return data;
    }

    // On frontend... group by cliente type
    static async clientByOrigin({min_date_filter, max_date_filter, puerto_filter}) {
        // Consultas, si no se aplicaran filtros, directamente sobre la tabla cliente...
        // select pais as origen, count(*) as numero from cliente group by pais;

        // Al aplicar filtros, se debe hacer join con estancia de buque
        // select c.pais as origen, count(*) as numero from cliente c join estancia_de_buque edb on (c.id=edb.cargador_id or c.id=edb.armador_id) where edb.salida >= '0001-01-01' and edb.salida <= '9999-12-12' and upper(edb.puerto) like upper('%') group by pais;
        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        const Puerto = puerto_filter || '%';

        const [data] = await pool.query( 
            `SELECT 
                c.pais, 
                count(*) AS numero_clientes 
            FROM 
                cliente c 
                JOIN estancia_de_buque edb ON (c.id=edb.cargador_id or c.id=edb.armador_id) 
            WHERE 
                edb.salida >= ? AND 
                edb.salida <= ? AND 
                UPPER(edb.puerto) LIKE UPPER(?) 
            GROUP BY pais`,
            [MinDate, MaxDate, Puerto]
        );

        return data;
    }

    static async clientScalesByDate({min_date_filter, max_date_filter, date_group_filter, cliente_filter, puerto_filter, material_filter}) {
        // Aquí es importante el orden, y el parametro date_group_filter para agrupar los datos
        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        const DateGroupBy = date_group_filter || 'DAY';
        const Cliente = cliente_filter || '%';
        const Puerto = puerto_filter || '%';
        const Material = material_filter || '%';

        // New... ordenado
        let auxDateFormat = `salida`;
        let finalDateFormat = `DATE_FORMAT(aux_fecha, '%Y-%m-%d')`;
        if(DateGroupBy.toUpperCase() === 'WEEK') {
            auxDateFormat = `DATE_FORMAT(DATE_SUB(salida, INTERVAL WEEKDAY(salida) DAY), '%Y-%m-%d')`;
            finalDateFormat = `CONCAT(DATE_FORMAT(DATE_SUB(aux_fecha, INTERVAL WEEKDAY(aux_fecha) DAY), '%e %b %Y'),', ',DATE_FORMAT(DATE_ADD(aux_fecha, INTERVAL 6 - WEEKDAY(aux_fecha) DAY), '%e %b %Y'))`;
        } else if (DateGroupBy.toUpperCase() === 'MONTH') {
            auxDateFormat = `DATE_FORMAT(salida, '%Y-%m-01')`;
            finalDateFormat = `DATE_FORMAT(aux_fecha, '%M %Y')`;
        } else if (DateGroupBy.toUpperCase() === 'YEAR') {
            auxDateFormat = `DATE_FORMAT(salida, '%Y-01-01')`;
            finalDateFormat = `DATE_FORMAT(aux_fecha, 'Year %Y')`;
        }

        let sql2 = `
        SELECT
            ${finalDateFormat} AS fecha,
            numero_escalas,
            total_carga,
            promedio_carga_escala
        FROM
            (
                SELECT
                    ${auxDateFormat} AS aux_fecha,
                    COUNT(*) AS numero_escalas,
                    SUM(carga) AS total_carga,
                    ROUND(SUM(carga)/COUNT(*), 2) AS promedio_carga_escala
                FROM 
                    vista_estancia_de_buque
                WHERE
                    salida >= ? AND 
                    salida <= ? AND 
                    (UPPER(armador_nombre) LIKE UPPER(?) OR UPPER(cargador_nombre) LIKE UPPER(?)) AND
                    UPPER(puerto) LIKE UPPER(?) AND
                    UPPER(material) LIKE UPPER(?)
                GROUP BY
                    aux_fecha
                ORDER BY 
                    aux_fecha ASC

            ) AS escalas_ordenadas
        `;

        const [data] = await pool.query(
            sql2,
            [MinDate, MaxDate, Cliente, Cliente, Puerto, Material]
        );

        return data;
    }

    // On frontend... group by cliente_tipo
    static async scalesByClients({min_date_filter, max_date_filter, material_filter, puerto_filter, tipo_cliente_filter}) {
        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        // const Cliente = cliente_filter || '%';
        const Puerto = puerto_filter || '%';
        const Material = material_filter || '%';
        const TipoCliente = tipo_cliente_filter || '%';

        let sql = `
            SELECT 
                c.nombre AS cliente, 
                c.tipo AS tipo,
                COUNT(*) AS numero_escalas, 
                SUM(edb.carga) AS total_carga, 
                ROUND(SUM(edb.carga) / COUNT(*), 2) AS promedio_carga_escala
            FROM 
                cliente c 
                JOIN estancia_de_buque edb ON (c.id=edb.armador_id OR c.id=cargador_id) 
            WHERE 
                edb.salida >= ? AND 
                edb.salida <= ? AND
                UPPER(edb.puerto) LIKE UPPER(?) 
                AND UPPER(edb.material) LIKE UPPER(?) 
                AND UPPER(c.tipo) LIKE UPPER(?)       
            GROUP BY 
                c.nombre
        `;

        const [data] = await pool.query(
            sql,
            [MinDate, MaxDate, Puerto, Material, TipoCliente]
        );

        return data;
    }

    static async scalesByClientsDestination({min_date_filter, max_date_filter, puerto_filter, material_filter, cliente_filter}) {
        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        const Cliente = cliente_filter || '%';
        const Puerto = puerto_filter || '%';
        const Material = material_filter || '%';

        let sql = `
            SELECT 
                destino,
                COUNT(*) AS numero_escalas, 
                SUM(carga) AS total_carga, 
                ROUND(SUM(carga) / COUNT(*), 2) AS promedio_carga_escala 
            FROM 
                vista_estancia_de_buque 
            WHERE 
                destino IS NOT NULL AND
                salida >= ? AND 
                salida <= ? AND
                UPPER(puerto) LIKE UPPER(?) AND
                UPPER(material) LIKE UPPER(?) AND  
                (UPPER(armador_nombre) LIKE UPPER(?) OR UPPER(cargador_nombre) LIKE UPPER(?))    
            GROUP BY 
                destino
        `;

        const [data] = await pool.query(
            sql,
            [MinDate, MaxDate, Puerto, Material, Cliente, Cliente]
        );

        return data;
    }

    // On frontend group by tipo (??)
    static async clientScalesTime({min_date_filter, max_date_filter, material_filter, puerto_filter, cliente_filter, tipo_cliente_filter}) {
        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        const Cliente = cliente_filter || '%';
        const Puerto = puerto_filter || '%';
        const Material = material_filter || '%';
        const TipoCliente = tipo_cliente_filter || '%';

        let sql = `
            SELECT 
                c.nombre AS cliente, 
                c.tipo AS tipo,
                ABS(SUM(TIMESTAMPDIFF(MINUTE, e.arrival_on_the_road, e.salida_puerto))) AS total_minutos_escala,
                ABS(SUM(TIMESTAMPDIFF(MINUTE, e.entrada_fondeadero, e.salida_fondeadero))) AS total_minutos_fondeadero,
                ABS(SUM(TIMESTAMPDIFF(MINUTE, e.atraque_puerto, e.salida_puerto))) AS total_minutos_puerto,
                ABS(SUM(TIMESTAMPDIFF(MINUTE, e.inicio_carga, e.fin_carga))) AS total_minutos_carga,
                ROUND((60 * SUM(e.carga)) / ABS(SUM(TIMESTAMPDIFF(MINUTE, e.inicio_carga, e.fin_carga))),2) AS promedio_velocidad_carga,
                ROUND(ABS(SUM(TIMESTAMPDIFF(MINUTE, e.arrival_on_the_road, e.salida_puerto))) / COUNT(*),2) AS promedio_minutos_escala,
                ROUND(ABS(SUM(TIMESTAMPDIFF(MINUTE, e.entrada_fondeadero, e.salida_fondeadero))) / COUNT(*),2) AS promedio_minutos_fondeadero_escala,
                ROUND(ABS(SUM(TIMESTAMPDIFF(MINUTE, e.atraque_puerto, e.salida_puerto))) / COUNT(*),2) AS promedio_minutos_puerto_escala,
                ROUND(ABS(SUM(TIMESTAMPDIFF(MINUTE, e.inicio_carga, e.fin_carga))) / COUNT(*),2) AS promedio_minutos_carga_escala,
                ROUND(ABS(SUM(TIMESTAMPDIFF(MINUTE, e.atraque_puerto, e.salida_puerto))) / COUNT(*),2) AS promedio_minutos_puerto_escala
            FROM 
                cliente c 
                JOIN estancia_de_buque e ON (c.id=e.armador_id OR c.id=e.cargador_id) 
            WHERE 
                UPPER(c.nombre) LIKE UPPER(?)
                AND e.salida >= ? AND e.salida <= ? 
                AND UPPER(e.puerto) LIKE UPPER(?) 
                AND UPPER(e.material) LIKE UPPER(?) 
                AND UPPER(c.tipo) LIKE UPPER(?)       
            GROUP BY 
                c.nombre
        `;

        const [data] = await pool.query(
            sql,
            [Cliente, MinDate, MaxDate, Puerto, Material, TipoCliente]
        );

        return data;
    }

    // TOTAL CON IVA Y TOTAL SIN IVA
    static async clientsInvoiceByDate({min_date_filter, max_date_filter, date_group_filter, tipo_factura_filter, cliente_filter}) {
        // Aquí es importante el orden, y el parametro date_group_filter para agrupar los datos
        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        const DateGroupBy = date_group_filter || 'DAY';
        const TipoFactura = tipo_factura_filter || '%';
        const Cliente = cliente_filter || '%';

        let auxDateFormat = `fecha`;
        let finalDateFormat = `DATE_FORMAT(aux_fecha, '%Y-%m-%d')`;
        if(DateGroupBy.toUpperCase() === 'WEEK') {
            auxDateFormat = `DATE_FORMAT(DATE_SUB(fecha, INTERVAL WEEKDAY(fecha) DAY), '%Y-%m-%d')`;
            finalDateFormat = `CONCAT(DATE_FORMAT(DATE_SUB(aux_fecha, INTERVAL WEEKDAY(aux_fecha) DAY), '%e %b %Y'),', ',DATE_FORMAT(DATE_ADD(aux_fecha, INTERVAL 6 - WEEKDAY(aux_fecha) DAY), '%e %b %Y'))`;
        } else if (DateGroupBy.toUpperCase() === 'MONTH') {
            auxDateFormat = `DATE_FORMAT(fecha, '%Y-%m-01')`;
            finalDateFormat = `DATE_FORMAT(aux_fecha, '%M %Y')`;
        } else if (DateGroupBy.toUpperCase() === 'YEAR') {
            auxDateFormat = `DATE_FORMAT(fecha, '%Y-01-01')`;
            finalDateFormat = `DATE_FORMAT(aux_fecha, 'Year %Y')`;
        }

        let sql = `
            SELECT 
                ${finalDateFormat} AS fecha,
                numero_facturas,
                total_sin_iva,
                total_con_iva
            FROM
                (
                    SELECT 
                        ${auxDateFormat} AS aux_fecha,
                        COUNT(*) AS numero_facturas,
                        SUM(total_sin_iva) AS total_sin_iva,
                        SUM(total_con_iva) AS total_con_iva
                    FROM 
                        vista_factura
                    WHERE
                        fecha >= ? AND fecha <= ? 
                        AND UPPER(tipo) LIKE UPPER(?)
                        AND UPPER(cliente_nombre) LIKE UPPER(?)
                    GROUP BY
                        aux_fecha
                    ORDER BY 
                        aux_fecha ASC
                ) AS facturas_ordenadas
        `;

        const [data] = await pool.query(
            sql,
            [MinDate, MaxDate, TipoFactura, Cliente]
        );

        return data;
    }

    // En frontend... group by Tipo de Factura
    // NETO: sin IVA
    // BRUTO: con IVA
    static async clientsInvoiceGlobal({min_date_filter, max_date_filter, tipo_factura_filter, cliente_filter}) {

        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        const TipoFactura = tipo_factura_filter || '%';
        const Cliente = cliente_filter || '%';

        let sql = `
            SELECT 
                cliente_nombre AS cliente,
                COUNT(*) AS numero_facturas,
                SUM(total_sin_iva) AS total_neto_factura,
                SUM(total_con_iva) AS total_bruto_factura,
                ROUND(SUM(total_sin_iva)/COUNT(*),2) AS promedio_neto_factura,
                ROUND(SUM(total_con_iva)/COUNT(*),2) AS promedio_bruto_factura
            FROM 
                vista_factura 
            WHERE
                fecha >= ? AND fecha <= ? 
                AND UPPER(tipo) LIKE UPPER(?)
                AND UPPER(cliente_nombre) LIKE UPPER(?)
            GROUP BY 
                cliente_nombre
        `;

        const [data] = await pool.query(
            sql,
            [MinDate, MaxDate, TipoFactura, Cliente]
        );

        return data;
    }


    //////////// ESTADISTICAS BUQUES /////////////////
    static async vesselGlobal({buque_filter}) {
        const Buque = buque_filter || '%';
        let sql = `
            SELECT 
                nombre AS buque,
                trb,
                trn,
                eslora,
                calado,
                manga
            FROM 
                buque 
            WHERE
                UPPER(nombre) LIKE (?)
        `;

        const [data] = await pool.query(
            sql,
            [Buque]
        );

        return data;
    }

    static async vesselByFlag() {
        let sql = `
            SELECT 
                bandera,
                count(*) as numero_buques
            FROM 
                buque 
            GROUP BY
                bandera;
        `;

        const [data] = await pool.query(sql);

        return data;
    } 

    static async vesselScalesByDate({min_date_filter, max_date_filter, date_group_filter, material_filter, puerto_filter, buque_filter, armador_filter, cargador_filter}) {
        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        const DateGroupBy = date_group_filter || 'DAY';
        const Buque = buque_filter || '%';
        const Armador = armador_filter || '%';
        const Cargador = cargador_filter || '%';
        const Puerto = puerto_filter || '%';
        const Material = material_filter || '%';

        // New... ordenado
        let auxDateFormat = `salida`;
        let finalDateFormat = `DATE_FORMAT(aux_fecha, '%Y-%m-%d')`;
        if(DateGroupBy.toUpperCase() === 'WEEK') {
            auxDateFormat = `DATE_FORMAT(DATE_SUB(salida, INTERVAL WEEKDAY(salida) DAY), '%Y-%m-%d')`;
            finalDateFormat = `CONCAT(DATE_FORMAT(DATE_SUB(aux_fecha, INTERVAL WEEKDAY(aux_fecha) DAY), '%e %b %Y'),', ',DATE_FORMAT(DATE_ADD(aux_fecha, INTERVAL 6 - WEEKDAY(aux_fecha) DAY), '%e %b %Y'))`;
        } else if (DateGroupBy.toUpperCase() === 'MONTH') {
            auxDateFormat = `DATE_FORMAT(salida, '%Y-%m-01')`;
            finalDateFormat = `DATE_FORMAT(aux_fecha, '%M %Y')`;
        } else if (DateGroupBy.toUpperCase() === 'YEAR') {
            auxDateFormat = `DATE_FORMAT(salida, '%Y-01-01')`;
            finalDateFormat = `DATE_FORMAT(aux_fecha, 'Year %Y')`;
        }
        
        let sql = `
        SELECT
            ${finalDateFormat} AS fecha,
            numero_escalas,
            total_carga,
            promedio_carga_escala
        FROM
            (
                SELECT
                    ${auxDateFormat} AS aux_fecha,
                    COUNT(*) AS numero_escalas,
                    SUM(carga) AS total_carga,
                    ROUND(SUM(carga)/COUNT(*), 2) AS promedio_carga_escala
                FROM 
                    vista_estancia_de_buque
                WHERE
                    salida >= ? AND 
                    salida <= ? AND 
                    UPPER(buque_nombre) LIKE UPPER(?) AND
                    UPPER(armador_nombre) LIKE UPPER(?) AND
                    UPPER(cargador_nombre) LIKE UPPER(?) AND
                    UPPER(puerto) LIKE UPPER(?) AND
                    UPPER(material) LIKE UPPER(?)
                GROUP BY
                    aux_fecha
                ORDER BY 
                    aux_fecha ASC

            ) AS escalas_ordenadas
        `;

        const [data] = await pool.query(
            sql,
            [MinDate, MaxDate, Buque, Armador, Cargador, Puerto, Material]
        );

        return data;
    } 

    static async scalesByVessels({min_date_filter, max_date_filter, buque_filter, armador_filter, cargador_filter, puerto_filter, material_filter}) {
        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        const Buque = buque_filter || '%';
        const Armador = armador_filter || '%';
        const Cargador = cargador_filter || '%';
        const Puerto = puerto_filter || '%';
        const Material = material_filter || '%';

        let sql = `
            SELECT 
                buque_nombre AS buque,
                COUNT(*) AS numero_escalas, 
                SUM(carga) AS total_carga, 
                ROUND(SUM(carga) / COUNT(*), 2) AS promedio_carga_escala
            FROM 
                vista_estancia_de_buque 
            WHERE 
                salida >= ? 
                AND salida <= ?
                AND UPPER(puerto) LIKE UPPER(?) 
                AND UPPER(material) LIKE UPPER(?) 
                AND UPPER(armador_nombre) LIKE UPPER(?)
                AND UPPER(cargador_nombre) LIKE UPPER(?)
                AND UPPER(buque_nombre) LIKE UPPER(?)
            GROUP BY 
                buque_nombre
        `;

        const [data] = await pool.query(
            sql,
            [MinDate, MaxDate, Puerto, Material, Armador, Cargador, Buque]
        );

        return data;
    } 

    static async vesselScalesTime({min_date_filter, max_date_filter, buque_filter, puerto_filter, material_filter}) {
        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        const Buque = buque_filter || '%';
        const Puerto = puerto_filter || '%';
        const Material = material_filter || '%';

        let sql = `
            SELECT 
                e.buque_nombre AS buque, 
                ABS(SUM(TIMESTAMPDIFF(MINUTE, e.arrival_on_the_road, e.salida_puerto))) AS total_minutos_escala,
                ABS(SUM(TIMESTAMPDIFF(MINUTE, e.entrada_fondeadero, e.salida_fondeadero))) AS total_minutos_fondeadero,
                ABS(SUM(TIMESTAMPDIFF(MINUTE, e.atraque_puerto, e.salida_puerto))) AS total_minutos_puerto,
                ABS(SUM(TIMESTAMPDIFF(MINUTE, e.inicio_carga, e.fin_carga))) AS total_minutos_carga,
                ROUND((60 * SUM(e.carga)) / ABS(SUM(TIMESTAMPDIFF(MINUTE, e.inicio_carga, e.fin_carga))),2) AS promedio_velocidad_carga,
                ROUND(ABS(SUM(TIMESTAMPDIFF(MINUTE, e.arrival_on_the_road, e.salida_puerto))) / COUNT(*),2) AS promedio_minutos_escala,
                ROUND(ABS(SUM(TIMESTAMPDIFF(MINUTE, e.entrada_fondeadero, e.salida_fondeadero))) / COUNT(*),2) AS promedio_minutos_fondeadero_escala,
                ROUND(ABS(SUM(TIMESTAMPDIFF(MINUTE, e.atraque_puerto, e.salida_puerto))) / COUNT(*),2) AS promedio_minutos_puerto_escala,
                ROUND(ABS(SUM(TIMESTAMPDIFF(MINUTE, e.inicio_carga, e.fin_carga))) / COUNT(*),2) AS promedio_minutos_carga_escala,
                ROUND(ABS(SUM(TIMESTAMPDIFF(MINUTE, e.atraque_puerto, e.salida_puerto))) / COUNT(*),2) AS promedio_minutos_puerto_escala
            FROM 
                vista_estancia_de_buque e
            WHERE 
                e.salida >= ? AND e.salida <= ? 
                AND UPPER(e.buque_nombre) LIKE UPPER(?)
                AND UPPER(e.puerto) LIKE UPPER(?) 
                AND UPPER(e.material) LIKE UPPER(?) 
            GROUP BY 
                e.buque_nombre
        `;

        const [data] = await pool.query(
            sql,
            [MinDate, MaxDate, Buque, Puerto, Material]
        );

        return data;

    }

    static async vesselScalesOrigin({min_date_filter, max_date_filter, buque_filter, puerto_filter, material_filter}) {
        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        const Buque = buque_filter || '%';
        const Puerto = puerto_filter || '%';
        const Material = material_filter || '%';

        let sql = `
            SELECT 
                origen,
                COUNT(*) AS numero_escalas, 
                SUM(carga) AS total_carga, 
                ROUND(SUM(carga) / COUNT(*), 2) AS promedio_carga_escala 
            FROM 
                vista_estancia_de_buque 
            WHERE 
                origen IS NOT NULL AND
                salida >= ? AND 
                salida <= ? AND
                UPPER(puerto) LIKE UPPER(?) AND
                UPPER(material) LIKE UPPER(?) AND  
                UPPER(buque_nombre) LIKE UPPER(?)    
            GROUP BY 
                origen
        `;

        const [data] = await pool.query(
            sql,
            [MinDate, MaxDate, Puerto, Material, Buque]
        );

        return data;
    }    
    
    static async vesselScalesDestination({min_date_filter, max_date_filter, buque_filter, puerto_filter, material_filter}) {
        const MinDate = min_date_filter || '0001-01-01';
        const MaxDate = max_date_filter || '9999-12-12';
        const Buque = buque_filter || '%';
        const Puerto = puerto_filter || '%';
        const Material = material_filter || '%';

        let sql = `
            SELECT 
                destino,
                COUNT(*) AS numero_escalas, 
                SUM(carga) AS total_carga, 
                ROUND(SUM(carga) / COUNT(*), 2) AS promedio_carga_escala 
            FROM 
                vista_estancia_de_buque 
            WHERE 
                destino IS NOT NULL AND
                salida >= ? AND 
                salida <= ? AND
                UPPER(puerto) LIKE UPPER(?) AND
                UPPER(material) LIKE UPPER(?) AND  
                UPPER(buque_nombre) LIKE UPPER(?)    
            GROUP BY 
                destino
        `;

        const [data] = await pool.query(
            sql,
            [MinDate, MaxDate, Puerto, Material, Buque]
        );

        return data;
    }

}
