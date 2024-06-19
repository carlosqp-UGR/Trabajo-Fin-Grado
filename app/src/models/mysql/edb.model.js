import { pool } from "../../database.js";

// EDB: Estancia De Buque
export class EDBModel {

    // El modelo debe devolver los objetos normalizados. En este caso debe de normalizar
    // únicamente los formatos de las fechas. La vista trabaja con strings en lugar de JS Date
    // que es el tipo de dato que devuelve mysql2
    static normalize(estancia) {
        let estancia_N = estancia;
        estancia_N.entrada = estancia.entrada ? estancia.entrada.toISOString().split('T')[0] : null;
        estancia_N.salida = estancia.salida ? estancia.salida.toISOString().split('T')[0] : null;
        estancia_N.arrival_on_the_road = estancia.arrival_on_the_road ? estancia.arrival_on_the_road.toISOString().substring(0,16) : null;
        estancia_N.entrada_fondeadero = estancia.entrada_fondeadero ? estancia.entrada_fondeadero.toISOString().substring(0,16) : null;
        estancia_N.salida_fondeadero = estancia.salida_fondeadero ? estancia.salida_fondeadero.toISOString().substring(0,16) : null;
        estancia_N.atraque_puerto = estancia.atraque_puerto ? estancia.atraque_puerto.toISOString().substring(0,16) : null;
        estancia_N.inicio_carga = estancia.inicio_carga ? estancia.inicio_carga.toISOString().substring(0,16) : null;
        estancia_N.fin_carga = estancia.fin_carga ? estancia.fin_carga.toISOString().substring(0,16) : null;
        estancia_N.salida_puerto = estancia.salida_puerto ? estancia.salida_puerto.toISOString().substring(0,16) : null;

        return estancia_N;
    }

    static async total({search_query, search_field}) {
        if((search_query && search_query.trim() !== '') && (search_field && search_field.trim() !== '')) {
            const search = '%' + search_query + '%';
            const [result] = await pool.query(
                `SELECT COUNT(*) AS total FROM vista_estancia_de_buque WHERE LOWER(${search_field}) LIKE LOWER(?)`,
                [search]
            );
            return result[0].total;
        } else {
            const [result] = await pool.query(
                `SELECT COUNT(*) AS total FROM estancia_de_buque`
            );
            return result[0].total;
        }
    }

    static async describe() {
        const [result] = await pool.query(
            `DESCRIBE vista_estancia_de_buque`
        );    
        
        const columns = result.map(column => column['Field']);     
        return columns;
    }

    // API
    static async search({search_field, search_query}) {
        const search = '%' + search_query + '%';
        const [results] = await pool.query(
            `SELECT DISTINCT ${search_field} FROM vista_estancia_de_buque WHERE LOWER(${search_field}) LIKE LOWER(?)`,
            [search]
        );    
        return results;
    }

    static async get({search_query, search_field, page, view}) {
        
        try {
            const start = (page-1) * view;
            let estancias = [];
            // Si los parámetros de búsqueda están definidos filtrar la consulta
            if((search_query && search_query.trim() !== '') && (search_field && search_field.trim() !== '')) {
                const search = '%' + search_query + '%';
                [estancias] =  await pool.query(
                    `SELECT * FROM vista_estancia_de_buque WHERE LOWER(${search_field}) LIKE LOWER(?) ORDER BY id DESC LIMIT ?,?`,
                    [search, start, view]
                ); 
            } else {
                // Si no están definidos, simplemente aplicar paginación
                [estancias] = await pool.query(
                    `SELECT * FROM vista_estancia_de_buque ORDER BY id DESC LIMIT ?,?`,
                    [start, view]
                );           
            }

            // Procesar respuesta
            if (estancias.length > 0) {
                const estanciasNormalizadas = [];
                for (const estancia of estancias) {
                    const estanciaNormalizada = this.normalize(estancia);
                    estanciasNormalizadas.push(estanciaNormalizada);
                }
                return estanciasNormalizadas;
            } else {
                return [];
            }   

        } catch (e) {
            console.log(e);
            return [];
        }     
    }

    static async getById({id}) {
        const [edb] = await pool.query( 
            `SELECT * FROM vista_estancia_de_buque WHERE id = ?`,
            [id]
        );
        if (edb.length === 0) {
            const error = new Error();
            error.errorType = 'DB_NO_RESULT';
            throw error;
        }
        return this.normalize(edb[0]);
    }

    static async create({input}) {

        // Get reference for buque
        let buque_id = null;
        try {
            let [buque_query] = await pool.query(
                `SELECT id FROM buque WHERE LOWER(nombre)=LOWER(?)`,
                [input.buque_nombre]
            );
            if(buque_query.length==0) {
                throw new Error('No results for buque.');
            }
            const [buque] = [buque_query][0];
            buque_id = buque.id;
        } catch (e) {
            console.log('Buque no existe')
            const error = new Error();
            error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
            error.errorField = 'buque_nombre';
            throw error;
        }

        // Get reference for armador
        let armador_id = null;
        try {
            let [armador_query] = await pool.query(
                `SELECT id FROM cliente WHERE LOWER(nombre)=LOWER(?)`,
                [input.armador_nombre]
            );
            if(armador_query.length==0) {
                throw new Error('No results for armador(cliente).');
            }
            const [armador] = [armador_query][0];
            armador_id = armador.id;
        } catch (e) {
            const error = new Error();
            error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
            error.errorField = 'armador_nombre';
            throw error;
        }

        // Get reference for cargador
        let cargador_id = null;
        try {
            let [cargador_query] = await pool.query(
                `SELECT id FROM cliente WHERE LOWER(nombre)=LOWER(?)`,
                [input.cargador_nombre]
            );
            if(cargador_query.length==0) {
                throw new Error('No results for cargador(cliente).');
            }
            const [cargador] = [cargador_query][0];
            cargador_id = cargador.id;
        } catch (e) {
            const error = new Error();
            error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
            error.errorField = 'cargador_nombre';
            throw error;
        }

        // Insert into table
        try {
            let [query] = await pool.query (
                `INSERT INTO estancia_de_buque (numero, puerto, buque_id, entrada, salida, t2l, dua, origen, destino, armador_id, capitan, material, carga, cargador_id,
                arrival_on_the_road, entrada_fondeadero, salida_fondeadero, atraque_puerto, inicio_carga, fin_carga, salida_puerto, observaciones)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [input.numero, input.puerto, buque_id, input.entrada, input.salida, input.t2l, input.dua, input.origen, input.destino, armador_id, input.capitan, input.material,
                input.carga, cargador_id, input.arrival_on_the_road, input.entrada_fondeadero, input.salida_fondeadero, input.atraque_puerto, input.inicio_carga, input.fin_carga, 
                input.salida_puerto, input.observaciones]
            );
        } catch (e) {
            if(e.code === 'ER_DUP_ENTRY') {
                const error = new Error();
                error.errorType = 'DB_DUPLICATE_ENTRY';
                error.errorField = 'numero';
                throw error;
            } else {
                console.log(e);
                throw(e);
            }
        }
    }

    static async nextNumberEDB() {
        let year = new Date().getFullYear() % 100;
        const sql = `SELECT numero FROM estancia_de_buque WHERE numero LIKE ? ORDER BY numero DESC LIMIT 1`;
        let str = `%/${year}`;

        const [result] = await pool.query( sql, [str] );

        // Si no hay resultados... crear una nueva cadena...
        let next = null;
        if(result.length === 0) {
            next = `1/${year}`;
        } else {
            // Procesar el resultado
            const latest = result[0].numero;
            let number = parseInt(latest.split('/')[0]);
            next = `${number+1}/${year}`;
        }

        return next;
    }

    static getPuertos() {
        return ['garrucha', 'carboneras', 'almeria', 'otro'];
    }

    static getMateriales() {
        return ['yeso', 'marmol', 'granito', 'otro'];
    }

    static async delete({id}) {
        try {
            let [result] = await pool.query(
                `DELETE FROM estancia_de_buque WHERE id = ?`,
                [id]
            );

            if(result.affectedRows<=0){
                throw new Error(`Could not delete estancia_de_buque with id = ${id} because it doesn't exist.`)
            }

        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    static async edit({input}) {
        // Get reference for buque
        let buque_id = null;
        try {
            let [buque_query] = await pool.query(
                `SELECT id FROM buque WHERE LOWER(nombre)=LOWER(?)`,
                [input.buque_nombre]
            );
            if(buque_query.length==0) {
                throw new Error('No results for buque.');
            }
            const [buque] = [buque_query][0];
            buque_id = buque.id;
        } catch (e) {
            console.log('Buque no existe')
            const error = new Error();
            error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
            error.errorField = 'buque_nombre';
            throw error;
        }

        // Get reference for armador
        let armador_id = null;
        try {
            let [armador_query] = await pool.query(
                `SELECT id FROM cliente WHERE LOWER(nombre)=LOWER(?)`,
                [input.armador_nombre]
            );
            if(armador_query.length==0) {
                throw new Error('No results for armador(cliente).');
            }
            const [armador] = [armador_query][0];
            armador_id = armador.id;
        } catch (e) {
            const error = new Error();
            error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
            error.errorField = 'armador_nombre';
            throw error;
        }

        // Get reference for cargador
        let cargador_id = null;
        try {
            let [cargador_query] = await pool.query(
                `SELECT id FROM cliente WHERE LOWER(nombre)=LOWER(?)`,
                [input.cargador_nombre]
            );
            if(cargador_query.length==0) {
                throw new Error('No results for cargador(cliente).');
            }
            const [cargador] = [cargador_query][0];
            cargador_id = cargador.id;
        } catch (e) {
            const error = new Error();
            error.errorType = 'DB_FOREIGN_KEY_CONSTRAINT';
            error.errorField = 'cargador_nombre';
            throw error;
        }

        // Update estancia
        try {
            let [query] = await pool.query (
                `UPDATE estancia_de_buque SET numero=?, puerto=?, buque_id=?, entrada=?, salida=?, t2l=?, dua=?, origen=?, destino=?, armador_id=?, capitan=?, material=?, carga=?, cargador_id=?,
                arrival_on_the_road=?, entrada_fondeadero=?, salida_fondeadero=?, atraque_puerto=?, inicio_carga=?, fin_carga=?, salida_puerto=?, observaciones=? WHERE id = ?`,                
                [input.numero, input.puerto, buque_id, input.entrada, input.salida, input.t2l, input.dua, input.origen, input.destino, armador_id, input.capitan, input.material,
                input.carga, cargador_id, input.arrival_on_the_road, input.entrada_fondeadero, input.salida_fondeadero, input.atraque_puerto, input.inicio_carga, input.fin_carga, 
                input.salida_puerto, input.observaciones, input.id]
            );
            if(query.affectedRows <= 0) {
                const error = new Error();
                error.errorType = 'DB_NO_RESULT';
                throw error;
            }
        } catch (e) {
            if(e.code === 'ER_DUP_ENTRY') {
                const error = new Error();
                error.errorType = 'DB_DUPLICATE_ENTRY';
                error.errorField = 'numero';
                throw error;
            } else if(e.code === 'DB_NO_RESULT') {
                //console.log(e);
                throw(e);
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
        const describeFields = await this.describe();
        fields.forEach(field => {
            // En caso de ser una fecha (entrada o salida), procesar...
            if(describeFields.includes(field.trim().toLowerCase()) && (field.trim().toLowerCase()==='entrada' || field.trim().toLowerCase()==='salida')) query00 += ` DATE_FORMAT(${field.trim().toLowerCase()}, '%Y-%m-%d') AS ${field.trim().toLowerCase()},`;
            else if(describeFields.includes(field.trim().toLowerCase())) query00 += ` ${field.trim().toLowerCase()},`
        });

        if (query00.endsWith(',')) query00 = query00.substring(0,query00.length -1);
        
        if (query00.trim()==='') throw new Error ('Invalid fields!');

        // Filters
        const Armador = filters.armador_filter || '%';
        const Cargador = filters.cargador_filter || '%';
        const Capitan = filters.capitan_filter || '%';
        const Buque = filters.buque_filter || '%';
        const Puerto = filters.puerto_filter || '%';
        const Material = filters.material_filter || '%';
        const Origen = filters.origen_filter || '%';
        const Destino = filters.destino_filter || '%';

        const MinDate = filters.min_date_filter || '1001-01-01';
        const MaxDate = filters.max_date_filter || '9999-12-31';

        var sql = `
        SELECT ${query00} 
        FROM vista_estancia_de_buque WHERE
            salida >= ? AND salida <= ? AND
            UPPER(armador_nombre) LIKE UPPER(?) AND
            UPPER(cargador_nombre) LIKE UPPER(?) AND
            UPPER(capitan) LIKE UPPER(?) AND
            UPPER(buque_nombre) LIKE UPPER(?) AND
            UPPER(puerto) LIKE UPPER(?) AND
            UPPER(material) LIKE UPPER(?) AND
            UPPER(origen) LIKE UPPER(?) AND
            UPPER(destino) LIKE UPPER(?) 
        `;

        try {
            let [query] = await pool.query (sql, [MinDate, MaxDate, Armador, 
                Cargador,Capitan, Buque, Puerto, Material, Origen, Destino]
            );
            return query;
        } catch (e) {
            console.error(e);
        }
    }

}