import { pool } from "../../database.js";

export class ClienteModel {
    
    // API
    // Pre: search_field is filtered to prevent SQL Injections
    static async search({search_field, search_query}) {
        const search = '%' + search_query + '%';
        const [results] = await pool.query(
            `SELECT DISTINCT ${search_field} FROM cliente WHERE LOWER(${search_field}) LIKE LOWER(?)`,
            [search]
        );    
        return results;
    }

    static async describe() {
        const [result] = await pool.query(
            `DESCRIBE cliente`
        );    
        
        const columns = result.map(column => column['Field']);     
        return columns;
    }

    static async get({search_query, search_field, page, view}) {
        try {
            const start = (page-1) * view;
            let clientes = [];
            // Si los parámetros de búsqueda están definidos filtrar la consulta
            if((search_query && search_query.trim() !== '') && (search_field && search_field.trim() !== '')) {
                const search = '%' + search_query + '%';
                [clientes] =  await pool.query(
                    `SELECT * FROM cliente WHERE LOWER(${search_field}) LIKE LOWER(?) ORDER BY id DESC LIMIT ?,?`,
                    [search, start, view]
                ); 
            } else {
                // Si no están definidos, simplemente aplicar paginación
                [clientes] = await pool.query(
                    `SELECT * FROM cliente ORDER BY id DESC LIMIT ?,?`,
                    [start, view]
                );           
            }
            return clientes;
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    static async getById({id}) {
        const [cliente] = await pool.query(
            `SELECT * FROM cliente WHERE id=?`,
            [id]
        );
        if (cliente.length === 0) {
            const error = new Error();
            error.errorType = 'DB_NO_RESULT';
            throw error;
        }
        return cliente[0];
    }

    static async total({search_query, search_field}) {
        if((search_query && search_query.trim() !== '') && (search_field && search_field.trim() !== '')) {
            const search = '%' + search_query + '%';
            const [result] = await pool.query(
                `SELECT COUNT(*) AS total FROM cliente WHERE LOWER(${search_field}) LIKE LOWER(?)`,
                [search]
            );
            return result[0].total;
        } else {
            const [result] = await pool.query(
                `SELECT COUNT(*) AS total FROM cliente`
            );
            return result[0].total;
        }
    }

    static async create({input}) {
        const {
            nombre,
            tipo,
            direccion,
            cif,
            vat,
            telefono,
            pais,
            email,
            fax,
            observaciones
        } = input;

        try {
            await pool.query(
                `INSERT INTO cliente (nombre, tipo, direccion, cif, vat, telefono, pais, email, fax, observaciones)
                VALUES (?,?,?,?,?,?,?,?,?,?);`,
                [nombre, tipo, direccion, cif, vat , telefono, pais, email, fax, observaciones]
            );
        } catch (e) {
            if(e.code === 'ER_DUP_ENTRY') {
                const error = new Error();
                error.errorType = 'DB_DUPLICATE_ENTRY';
                error.errorField = 'nombre';
                throw error;
            } else if(e.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
                const error = new Error();
                error.errorType = 'DB_CHECK_CONSTRAINT';
                error.errorField = 'tipo';
                throw error;
            } else {
                console.log(e);
                throw(e);
            }
        }
    }

    static async edit({input}) {
        const {
            id,
            nombre,
            tipo,
            direccion,
            cif,
            vat,
            telefono,
            pais,
            email,
            observaciones,
            fax
        } = input;

        try {
            await pool.query(
                `UPDATE cliente SET nombre=?, tipo=?, direccion=?, cif=?, vat=?, telefono=?, pais=?, email=?, observaciones=?, fax=? WHERE id = ?;`,
                [nombre, tipo, direccion, cif, vat, telefono, pais, email, observaciones, fax, id]
            );
        } catch (e) {
            if(e.code === 'ER_DUP_ENTRY') {
                const error = new Error();
                error.errorType = 'DB_DUPLICATE_ENTRY';
                error.errorField = 'nombre';
                throw error;
            } else if(e.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
                const error = new Error();
                error.errorType = 'DB_CHECK_CONSTRAINT';
                error.errorField = 'tipo';
                throw error;
            } else {
                console.log(e);
                throw e;
            }
        }
    }

    static async delete({id}) {
        try {
            const result = await pool.query(
                `DELETE FROM cliente WHERE id = ?`,
                [id]
            );

        } catch(e) {
            if(e.code === 'ER_ROW_IS_REFERENCED') {
                const error = new Error();
                error.errorType = 'DB_DELETE_REFERENCED_ERROR';
                throw error;
            }
            
            console.log(e);
            throw e;
        }
    }

    static getTipos() {
        return ['CARGADOR', 'ARMADOR', 'OTRO'];
    }
}