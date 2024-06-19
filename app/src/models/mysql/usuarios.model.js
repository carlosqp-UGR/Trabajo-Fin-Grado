import { pool } from "../../database.js";
import { encryptPassword } from "../../lib/helpers.js";

export class UsuarioModel {
    static async get() {
        try {
            const [usuarios] = await pool.query(
                `SELECT id, username, fullname, admin FROM usuario;`
            );
            return usuarios;
        } catch (err) {
            throw err;
        }
    }

    static async create({input}) {
        const {
            username,
            fullname,
            password,
            admin
        } = input;

        const encryptedPassword = await encryptPassword(password);

        // console.log(input);
        // console.log(encryptedPassword);

        try {
            await pool.query(
                `INSERT INTO usuario (username, password, fullname, admin) 
                VALUES (?,?,?,?);`,
                [username, encryptedPassword, fullname, admin]
            );
        } catch (err) {
            if(err.code === 'ER_DUP_ENTRY') {
                const error = new Error();
                error.errorType = 'DB_DUPLICATE_ENTRY';
                throw error;
            }
            throw(err);
        }
    }

    static async getById({id}) {
        try {
            const [usuario] = await pool.query(
                `SELECT id, username, fullname, admin FROM usuario WHERE id = ?`,
                [id]
            );
            if(usuario.length === 0) {
                const error = new Error();
                error.errorType = 'DB_NO_RESULT';
                throw error;
            }
            return usuario[0];
        } catch (e) {
            throw(e);
        }
    }
    
    static async changePassword({id, newPassword}) {
        const encryptedPassword = await encryptPassword(newPassword);

        try {
            const [query] = await pool.query(
                `UPDATE usuario SET password=? WHERE id=?`, 
                [encryptedPassword, id]
            );

            if(query.affectedRows <= 0) {
                const error = new Error();
                error.errorType = 'DB_NO_RESULT';
                throw error;            
            }
        } catch (e) {
            throw(e);
        }

    }

    static async edit({input}) {
        const {
            id,
            fullname,
            username,
            admin
        } = input;
        try {
            const [query] = await pool.query(
                `UPDATE usuario SET fullname=?, username=?, admin=? WHERE id=?`, 
                [fullname, username, admin, id]
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
                //error.errorField = 'username';
                throw error;
            } else {
                throw e;
            }
        }
    }

    static async editProfile({input}) {
        const {
            id,
            fullname,
            username,
        } = input;
        try {
            const [query] = await pool.query(
                `UPDATE usuario SET fullname=?, username=? WHERE id=?`, 
                [fullname, username, id]
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
                //error.errorField = 'username';
                throw error;
            } else {
                throw e;
            }
        }
    }

    static async delete({id}) {
        try {
            const [query] = await pool.query(
                `DELETE FROM usuario WHERE id=?`, 
                [id]
            );

            if(query.affectedRows <= 0) {
                const error = new Error();
                error.errorType = 'DB_NO_RESULT';
                throw error;            
            }
        } catch (e) {
            throw e;
        }
    }
    
}