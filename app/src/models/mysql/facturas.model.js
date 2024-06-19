import { pool } from "../../database.js";

export class FacturasModel {


    // El controlador recibe facturas normalizadas. El modelo, es el encargado de normalizar
    // sus respuestas para que el controlador pueda procesarlas
    static normalize(factura) {
        
        const fecha_N = factura.fecha ? factura.fecha.toISOString().split('T')[0] : null;

        let factura_N = {
            id: factura.id,
            tipo: factura.tipo,
            num_factura: factura.num_factura,
            fecha: fecha_N,
            cliente_id: factura.cliente_id,
            cliente_nombre: factura.cliente_nombre,
            cliente_direccion: factura.cliente_direccion,
            cliente_vat: factura.cliente_vat,
            cliente_cif: factura.cliente_cif,
            iva: parseFloat(factura.iva) || 0.00 ,
            total_sin_iva: parseFloat(factura.total_sin_iva) || 0.00,
            total_con_iva: parseFloat(factura.total_con_iva) || 0.00,
        }

        if(factura.tipo=='A' || factura.tipo=='B') {
            // Process fecha_entrada, fecha_salida
            factura_N.buque_id = factura.buque_id;
            factura_N.buque_nombre = factura.buque_nombre;
            
            const fecha_entrada_N = factura.fecha_entrada ? factura.fecha_entrada.toISOString().split('T')[0] : null;
            const fecha_salida_N = factura.fecha_salida ? factura.fecha_salida.toISOString().split('T')[0] : null;
            factura_N.fecha_entrada = fecha_entrada_N;
            factura_N.fecha_salida = fecha_salida_N;
        }

        if(factura.tipo=='C') {
            // Process dias
            const dia = [];
            for (let i = 1; i <= 20; i++) {
                dia.push(factura[`dia${i}`]);
            }
            factura_N.dia = dia;
        }

        const concepto = [];
        const precio = [];
        for (let i = 1; i <= 20; i++) {
            precio.push(parseFloat(factura[`precio${i}`]) || null);
            concepto.push(factura[`concepto${i}`]);
        }

        factura_N.concepto = concepto;
        factura_N.precio = precio;

        return factura_N;
    }

    static denormalize(factura) {
        let factura_D = {
            id: factura.id || null,
            tipo: factura.tipo,
            num_factura: factura.num_factura,
            fecha: factura.fecha.trim() !== '' ? factura.fecha : null,
            cliente_id: parseInt(factura.cliente_id) || null,
            cliente_nombre: factura.cliente_nombre,
            // cliente_direccion: factura.cliente_direccion,
            // cliente_vat: factura.cliente_vat,
            // cliente_cif: factura.cliente_cif,
            iva: parseFloat(factura.iva)!== 0 ? parseFloat(factura.iva) : 0.00,
        }
  
        if(factura.tipo=='A' || factura.tipo=='B') {
            factura_D.buque_id = parseInt(factura.buque_id) || null;
            factura_D.buque_nombre = factura.buque_nombre;
            factura_D.fecha_entrada = factura.fecha_entrada.trim() !== '' ? factura.fecha_entrada : null;
            factura_D.fecha_salida = factura.fecha_salida.trim() !== '' ? factura.fecha_salida : null;
        }

        if(factura.tipo=='C') {
            // Process dias
            for (let i = 1; i <= factura.dia.length; i++) {
                factura_D[`dia${i}`] = parseInt(factura.dia[i-1]) || null;
            }
        }

        for (let i = 1; i <= factura.concepto.length; i++) {
            factura_D[`concepto${i}`] = factura.concepto[i-1].trim() !== '' ? factura.concepto[i-1] : null;
            factura_D[`precio${i}`] = parseFloat(factura.precio[i-1]) || null;
        }

        return factura_D;
    }

    // Returns columns from table
    static async describe(tipo) {
        let table = 'vista_factura';
        if(tipo === 'A' || tipo === 'B') table = 'vista_factura_con_buque';
        else if (tipo === 'C') table = 'vista_factura_con_dias';
        else if (tipo === 'G') table = 'vista_factura_listado';
        
        const [result] = await pool.query(
            `DESCRIBE ${table}`
        );    
        
        const columns = result.map(column => column['Field']);     
        return columns;
    }

    // Pre: search_field is filtered to prevent SQL Injections
    static async search({tipo, search_field, search_query}) {

        let table = 'vista_factura';
        if(tipo == 'A' || tipo == 'B') table = 'vista_factura_con_buque';
        else if (tipo == 'C') table = 'vista_factura_con_dias';
        else if (tipo === 'G') table = 'vista_factura_listado';

        const search = '%' + search_query + '%';
        let results;
        if (tipo !== 'G')
            [results] = await pool.query(
                `SELECT DISTINCT ${search_field} FROM ${table} WHERE tipo = ? AND LOWER(${search_field}) LIKE LOWER(?)`,
                [tipo, search]
            );
        else
            [results] = await pool.query(
                `SELECT DISTINCT ${search_field} FROM ${table} WHERE LOWER(${search_field}) LIKE LOWER(?)`,
                [search]
            );

        return results;
    }

    static async getById({tipo, id}) {
        var sql = `SELECT * FROM vista_factura WHERE id=? AND tipo=?`;
        if(tipo == 'A' || tipo =='B') {
            sql = `SELECT * FROM vista_factura_con_buque WHERE id=? AND tipo=?`;
        } else if (tipo == 'C') {
            sql = `SELECT * FROM vista_factura_con_dias WHERE id=? AND tipo=?`;
        }

        const [factura] = await pool.query( sql, [id, tipo] );
        if (factura.length === 0) {
            const error = new Error();
            error.errorType = 'DB_NO_RESULT';
            throw error;
        }

        // Normalizar el formato de la factura
        const factura_normalized = this.normalize(factura[0]);

        return factura_normalized;  
    }

    static async get({tipo, search_query, search_field, page, view}) {
        try {
            const start = (page-1) * view;

            let table = 'vista_factura';
            if(tipo == 'A' || tipo == 'B') table = 'vista_factura_con_buque';
            else if (tipo == 'C') table = 'vista_factura_con_dias';
            
            let facturas = [];
            // Si los parámetros de búsqueda están definidos filtrar la consulta
            if((search_query && search_query.trim() !== '') && (search_field && search_field.trim() !== '')) {
                const search = '%' + search_query + '%';
                [facturas] =  await pool.query(
                    `SELECT * FROM ${table} WHERE tipo = ? AND LOWER(${search_field}) LIKE LOWER(?) ORDER BY id DESC LIMIT ?,?`,
                    [tipo, search, start, view]
                ); 
            } else {
                // Si no están definidos, simplemente aplicar paginación
                [facturas] = await pool.query(
                    `SELECT * FROM ${table} WHERE tipo = ? ORDER BY id DESC LIMIT ?,?`,
                    [tipo, start, view]
                );           
            }

            // Procesar respuesta
            if (facturas.length > 0) {
                const facturasNormalizadas = [];
                for (const factura of facturas) {
                    const facturaNormalizada = this.normalize(factura);
                    facturasNormalizadas.push(facturaNormalizada);
                }
                return facturasNormalizadas;
            } else {
                return [];
            }   

        } catch (e) {
            console.log(e);
            return [];
        }     
    }

    static async total({tipo, search_query, search_field}) {
        let table = 'vista_factura';
        if(tipo == 'A' || tipo == 'B') table = 'vista_factura_con_buque';
        else if (tipo == 'C') table = 'vista_factura_con_dias';

        // Si los parámetros de búsqueda están definidos filtrar la consulta
        if((search_query && search_query.trim() !== '') && (search_field && search_field.trim() !== '')) {
            const search = '%' + search_query + '%';
            const [result] = await pool.query(
                `SELECT COUNT(*) AS total FROM ${table} WHERE tipo = ? AND LOWER(${search_field}) LIKE LOWER(?)`,
                [tipo, search]
            );
            return result[0].total;
        } else {
            const [result] = await pool.query(
                `SELECT COUNT(*) AS total FROM ${table} WHERE tipo = ?`, [tipo]
            );
            return result[0].total;
        }
    }

    // Based on the type and the current date, generates the new invoice type
    static async nextInvoiceNumber({tipo}) {
        let year = new Date().getFullYear() % 100;
        const sql = `SELECT num_factura FROM factura WHERE tipo = ? AND num_factura LIKE ? ORDER BY num_factura DESC LIMIT 1`;
        let str = `${tipo}%/${year}`;

        const [result] = await pool.query( sql, [tipo, str] );

        // Si no hay resultados... crear una nueva cadena...
        let next = null;
        if(result.length === 0) {
            next = `${tipo}1/${year}`;
        } else {
            // Procesar el resultado
            const latest = result[0].num_factura;
            let number = parseInt(latest.substring(tipo.length).split('/')[0]);
            next = `${tipo}${number+1}/${year}`;
        }

        return next;
    }

    static async create({input}) {
        const factura = this.denormalize(input);
        let cliente_id = null;
        try {
            let [cliente_query] = await pool.query(
                `SELECT id FROM cliente WHERE LOWER(nombre)=LOWER(?)`,
                [factura.cliente_nombre]
            );
            if(cliente_query.length==0) {
                throw new Error('No results for cliente.');
            }
            const [cliente] = [cliente_query][0];
            cliente_id = cliente.id;
        } catch (e) {
            const error = new Error();
            error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
            error.errorField = 'cliente_nombre';
            throw error;
        }

        let buque_id = null;
        if(factura.tipo=='A' || factura.tipo=='B'){
            try {
                let [buque_query] = await pool.query(
                    `SELECT id FROM buque WHERE LOWER(nombre)=LOWER(?)`,
                    [factura.buque_nombre]
                );
                if(buque_query.length==0) {
                    throw new Error('No results for buque.');
                }
                const [buque] = [buque_query][0];
                buque_id = buque.id;
            } catch (e) {
                const error = new Error();
                error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
                error.errorField = 'buque_nombre';
                throw error;
            }
        }

        // Insert into tables
        try {
            // First insert into generic table
            let [query] = await pool.query(
                `INSERT INTO factura( num_factura, tipo, fecha, cliente_id, iva,
                    concepto1, concepto2, concepto3, concepto4, concepto5,
                    concepto6, concepto7, concepto8, concepto9, concepto10,
                    concepto11, concepto12, concepto13, concepto14, concepto15,
                    concepto16, concepto17, concepto18, concepto19, concepto20,
                    precio1, precio2, precio3, precio4, precio5, 
                    precio6, precio7, precio8, precio9, precio10,
                    precio11, precio12, precio13, precio14, precio15,
                    precio16, precio17, precio18, precio19, precio20) VALUES
                    (   ?,?,?,?,?,
                        ?,?,?,?,?, 
                        ?,?,?,?,?, 
                        ?,?,?,?,?, 
                        ?,?,?,?,?, 
                        ?,?,?,?,?, 
                        ?,?,?,?,?, 
                        ?,?,?,?,?, 
                        ?,?,?,?,? )`,
                    [factura.num_factura, factura.tipo, factura.fecha, cliente_id, factura.iva,
                    factura.concepto1, factura.concepto2, factura.concepto3, factura.concepto4, factura.concepto5,
                    factura.concepto6, factura.concepto7, factura.concepto8, factura.concepto9, factura.concepto10,
                    factura.concepto11, factura.concepto12, factura.concepto13, factura.concepto14, factura.concepto15,
                    factura.concepto16, factura.concepto17, factura.concepto18, factura.concepto19, factura.concepto20,
                    factura.precio1, factura.precio2, factura.precio3, factura.precio4, factura.precio5,
                    factura.precio6, factura.precio7, factura.precio8, factura.precio9, factura.precio10,
                    factura.precio11, factura.precio12, factura.precio13, factura.precio14, factura.precio15,
                    factura.precio16, factura.precio17, factura.precio18, factura.precio19, factura.precio20 ]
                );

            const id_factura = query.insertId;
            
            if(factura.tipo!=='AQH') {
                // Get id from insertion
                // After, insert into specific table
                if(factura.tipo=='A' ||factura.tipo=='B') {
                    let [factura_con_buque] = await pool.query(
                        `INSERT INTO factura_con_buque (id, buque_id, fecha_entrada, fecha_salida) VALUES (?,?,?,?)`,
                        [id_factura, buque_id, factura.fecha_entrada, factura.fecha_salida]
                    );
                    // console.log(factura_con_buque);
                } else if (factura.tipo=='C') {
                    let [factura_con_dias] = await pool.query(
                        `INSERT INTO factura_con_dias (id, dia1, dia2, dia3, dia4, dia5, dia6, dia7, dia8, dia9, dia10, 
                         dia11, dia12, dia13, dia14, dia15, dia16, dia17, dia18, dia19, dia20) 
                         VALUES (?,     ?,?,?,?,?,      ?,?,?,?,?,      ?,?,?,?,?,      ?,?,?,?,?)`,
                        [id_factura, factura.dia1, factura.dia2, factura.dia3, factura.dia4, factura.dia5, factura.dia6, factura.dia7, factura.dia8, factura.dia9, factura.dia10,
                        factura.dia11, factura.dia12, factura.dia13, factura.dia14, factura.dia15, factura.dia16, factura.dia17, factura.dia18, factura.dia19, factura.dia20]
                    );
                    // console.log(factura_con_dias);
                }
            }

        } catch (e) {
            // Already exists (invalid num_factura)
            if(e.code === 'ER_DUP_ENTRY') {
                const error = new Error();
                error.errorType = 'DB_DUPLICATE_ENTRY';
                error.errorField = 'num_factura';
                throw error;
            } else if (e.code === 'ER_NO_REFERENCED_ROW') {
                const error = new Error();
                error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
                error.errorField = 'id';
                throw error;
            } else {
                console.log(e);
                throw(e);
            }
        }
    }

    static async delete({tipo, id}) {
        try {
            if(tipo == 'A' || tipo == 'B'){
                await pool.query(
                    `DELETE FROM factura_con_buque WHERE id = ?`,
                    [id]
                );
            } else if (tipo == 'C') {
                await pool.query(
                    `DELETE FROM factura_con_dias WHERE id = ?`,
                    [id]
                );
            }

            let [result] = await pool.query(
                `DELETE FROM factura WHERE id = ? AND tipo = ?`,
                [id, tipo]
            );

            if(result.affectedRows<=0){
                throw new Error(`Could not delete factura with id = ${id} because it doesn't exist.`)
            }

        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    static async edit({input}) {
        const factura = this.denormalize(input);
        let cliente_id = null;
        try {
            let [cliente_query] = await pool.query(
                `SELECT id FROM cliente WHERE LOWER(nombre)=LOWER(?)`,
                [factura.cliente_nombre]
            );
            if(cliente_query.length==0) {
                throw new Error('No results for cliente.');
            }
            const [cliente] = [cliente_query][0];
            cliente_id = cliente.id;
        } catch (e) {
            const error = new Error();
            error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
            error.errorField = 'cliente_nombre';
            throw error;
        }

        let buque_id = null;
        if(factura.tipo=='A' || factura.tipo=='B'){
            try {
                let [buque_query] = await pool.query(
                    `SELECT id FROM buque WHERE LOWER(nombre)=LOWER(?)`,
                    [factura.buque_nombre]
                );
                if(buque_query.length==0) {
                    throw new Error('No results for buque.');
                }
                const [buque] = [buque_query][0];
                buque_id = buque.id;
            } catch (e) {
                const error = new Error();
                error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
                error.errorField = 'buque_nombre';
                throw error;
            }
        }

        // Update into tables
        try {
            // First update generic table
            let [query] = await pool.query(
                `UPDATE factura SET num_factura=?, fecha=?, cliente_id=?, iva=?,
                    concepto1=?, concepto2=?, concepto3=?, concepto4=?, concepto5=?,
                    concepto6=?, concepto7=?, concepto8=?, concepto9=?, concepto10=?,
                    concepto11=?, concepto12=?, concepto13=?, concepto14=?, concepto15=?,
                    concepto16=?, concepto17=?, concepto18=?, concepto19=?, concepto20=?,
                    precio1=?, precio2=?, precio3=?, precio4=?, precio5=?, 
                    precio6=?, precio7=?, precio8=?, precio9=?, precio10=?,
                    precio11=?, precio12=?, precio13=?, precio14=?, precio15=?,
                    precio16=?, precio17=?, precio18=?, precio19=?, precio20=? 
                WHERE id=? AND tipo=?`,
                    [factura.num_factura, factura.fecha, cliente_id, factura.iva,
                    factura.concepto1, factura.concepto2, factura.concepto3, factura.concepto4, factura.concepto5,
                    factura.concepto6, factura.concepto7, factura.concepto8, factura.concepto9, factura.concepto10,
                    factura.concepto11, factura.concepto12, factura.concepto13, factura.concepto14, factura.concepto15,
                    factura.concepto16, factura.concepto17, factura.concepto18, factura.concepto19, factura.concepto20,
                    factura.precio1, factura.precio2, factura.precio3, factura.precio4, factura.precio5,
                    factura.precio6, factura.precio7, factura.precio8, factura.precio9, factura.precio10,
                    factura.precio11, factura.precio12, factura.precio13, factura.precio14, factura.precio15,
                    factura.precio16, factura.precio17, factura.precio18, factura.precio19, factura.precio20, 
                    factura.id, factura.tipo]
                );

            if(query.affectedRows <= 0) {
                throw new Error('Couldn`t update factura generic... skipping the rest');
            }

            if(factura.tipo!=='AQH') {
                if(factura.tipo=='A' ||factura.tipo=='B') {
                    let [factura_con_buque] = await pool.query(
                        `UPDATE factura_con_buque SET buque_id=?, fecha_entrada=?, fecha_salida=? WHERE id=?`,
                        [buque_id, factura.fecha_entrada, factura.fecha_salida, factura.id]
                    );
                    if(factura_con_buque.affectedRows <= 0) {
                        throw new Error('Couldn`t update factura_con_buque.');
                    }                
                } else if (factura.tipo=='C') {
                    let [factura_con_dias] = await pool.query(
                        `UPDATE factura_con_dias SET dia1=?, dia2=?, dia3=?, dia4=?, dia5=?, dia6=?, dia7=?, dia8=?, dia9=?, dia10=?, 
                         dia11=?, dia12=?, dia13=?, dia14=?, dia15=?, dia16=?, dia17=?, dia18=?, dia19=?, dia20=? WHERE id=?`,
                        [factura.dia1, factura.dia2, factura.dia3, factura.dia4, factura.dia5, factura.dia6, factura.dia7, factura.dia8, factura.dia9, factura.dia10,
                        factura.dia11, factura.dia12, factura.dia13, factura.dia14, factura.dia15, factura.dia16, factura.dia17, factura.dia18, factura.dia19, factura.dia20,
                        factura.id]
                    );
                    if(factura_con_dias.affectedRows<=0) {
                        throw new Error('Couldn`t update factura_con_buque.');
                    }
                }
            }

        } catch (e) {
            if(e.code === 'ER_DUP_ENTRY') {
                const error = new Error();
                error.errorType = 'DB_DUPLICATE_ENTRY';
                error.errorField = 'num_factura';
                throw error;
            } else if (e.code === 'ER_NO_REFERENCED_ROW') {
                const error = new Error();
                error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
                error.errorField = 'id';
                throw error;
            } else {
                console.log(e);
                throw(e);
            }
        }
    }

    // fields is an array, filters is a JSON
    static async customGet({fields, filters}) {
        // Construct SQL query, first selecting fields
        var query00 = ' '; 
        const describeFields = await this.describe('G');
        // console.log(describeFields);
        fields.forEach(field => {
            // En caso de ser una fecha (entrada o salida), procesar...
            if(describeFields.includes(field.trim().toLowerCase()) && field.trim().toLowerCase()==='fecha') query00 += ` DATE_FORMAT(${field.trim().toLowerCase()}, '%Y-%m-%d') AS ${field.trim().toLowerCase()},`;
            else if(describeFields.includes(field.trim().toLowerCase())) query00 += ` ${field.trim().toLowerCase()},`
        });

        if (query00.endsWith(',')) query00 = query00.substring(0,query00.length -1);
        
        if (query00.trim()==='') throw new Error ('Invalid fields!');

        // Filters
        const Numero = filters.numero_filter || '%';
        const Tipo = filters.tipo_filter || '%';
        const Cliente = filters.cliente_filter || '%';
        const Buque = filters.buque_filter || '%';

        const MinDate = filters.min_date_filter || '1001-01-01';
        const MaxDate = filters.max_date_filter || '9999-12-31';

        var sql = `
        SELECT ${query00} 
        FROM vista_factura_listado WHERE
            fecha >= ? AND fecha <= ? AND
            UPPER(numero) LIKE UPPER(?) AND
            UPPER(tipo) LIKE UPPER(?) AND
            UPPER(cliente_nombre) LIKE UPPER(?)
        `;
        var sqlParams = [MinDate, MaxDate, Numero, Tipo, Cliente];

        if(Buque !== '%') {
            sql += 'AND UPPER(buque_nombre) LIKE UPPER(?)';
            sqlParams.push(Buque);
        }

        try {
            let [query] = await pool.query (sql, sqlParams);
            return query;
        } catch (e) {
            console.error(e);
        }
    }

}