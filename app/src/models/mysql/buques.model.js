import { pool } from "../../database.js";

export class BuqueModel {

    static async total({search_query, search_field}) {
        if((search_query && search_query.trim() !== '') && (search_field && search_field.trim() !== '')) {
            const search = '%' + search_query + '%';
            const [result] = await pool.query(
                `SELECT COUNT(*) AS total FROM buque WHERE LOWER(${search_field}) LIKE LOWER(?)`,
                [search]
            );
            return result[0].total;
        } else {
            const [result] = await pool.query(
                `SELECT COUNT(*) AS total FROM buque`
            );
            return result[0].total;
        }
    }

    static async describe() {
        const [result] = await pool.query(
            `DESCRIBE buque`
        );    
        
        const columns = result.map(column => column['Field']);     
        return columns;
    }

    // API
    static async search({search_field, search_query}) {
        const search = '%' + search_query + '%';
        const [results] = await pool.query(
            `SELECT DISTINCT ${search_field} FROM buque WHERE LOWER(${search_field}) LIKE LOWER(?)`,
            [search]
        );    
        return results;
    }

    static async get({search_query, search_field, page, view}) {
        const start = (page-1) * view;
        let buques = [];
        // Si los parámetros de búsqueda están definidos filtrar la consulta
        if((search_query && search_query.trim() !== '') && (search_field && search_field.trim() !== '')) {
            const search = '%' + search_query + '%';
            [buques] =  await pool.query(
                `SELECT * FROM buque WHERE LOWER(${search_field}) LIKE LOWER(?) ORDER BY id DESC LIMIT ?,?`,
                [search, start, view]
            ); 
        } else {
            // Si no están definidos, simplemente aplicar paginación
            [buques] = await pool.query(
                `SELECT * FROM buque ORDER BY id DESC LIMIT ?,?`,
                [start, view]
            );           
        }
        return buques;
    }

    static async getById({id}) {
        try {
            const [buque] = await pool.query(
                `SELECT * FROM buque WHERE id = ?`,
                [id]
            );
            if(buque.length === 0) {
                const error = new Error();
                error.errorType = 'DB_NO_RESULT';
                throw error;
            }
            return buque[0];
        } catch (e) {
            // console.log(e);
            throw(e);
        }
    }

    static async create({input}) {
        const {
            nombre,
            matricula,
            bandera,
            trb,
            trn,
            eslora,
            calado,
            manga,
            observaciones
        } = input;

        try {
            await pool.query(
                `INSERT INTO buque (nombre, matricula, bandera, trb, trn, eslora, calado, manga, observaciones) VALUES (?,?,?,?,?,?,?,?,?)`,
                [nombre, matricula, bandera, trb, trn, eslora, calado, manga, observaciones]
            );
        } catch (e) {
            if(e.code === 'ER_DUP_ENTRY') {
                const error = new Error();
                error.errorType = 'DB_DUPLICATE_ENTRY';
                throw error;
            } else {
                // console.log(e);
                throw(e);
            }
        }
    }

    static async edit({input}) {
        const {
            id,
            nombre,
            matricula,
            bandera,
            trb,
            trn,
            eslora,
            calado,
            manga,
            observaciones
        } = input;

        try {
            const [query] = await pool.query(
                `UPDATE buque SET nombre=?, matricula=?, bandera=?, trb=?, trn=?, eslora=?, calado=?, manga=?, observaciones=? WHERE id=?`, 
                [nombre, matricula, bandera, trb, trn, eslora, calado, manga, observaciones, id]
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
                throw error;
            }
            throw(e);
        }
    }

    static async delete({id}) {
        try {
            const [result] = await pool.query(
                `DELETE FROM buque WHERE id = ?`,
                [id]
            );

            if(result.affectedRows<=0){
                const error = new Error();
                error.errorType = 'DB_NO_RESULT';
                throw error;
            }
        } catch(e) {
            if (e.code === 'ER_ROW_IS_REFERENCED') {
                const error = new Error();
                error.errorType = 'DB_DELETE_REFERENCED_ERROR';
                throw error;
            } 
            // console.log(e);
            throw(e);
        }
    }
}