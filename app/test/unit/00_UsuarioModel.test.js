import { expect } from 'chai';
import { UsuarioModel } from '../../src/models/mysql/usuarios.model.js';
import { pool } from '../../src/database.js'; // Importa la conexión de la base de datos
import { encryptPassword } from '../../src/lib/helpers.js'; // Asegúrate de importar la función de encriptación de contraseñas

describe('Pruebas unitarias para UsuarioModel', () => {
    let usuario01ID, usuario02ID;
    const password = 'hala madrid';

    const usuario00 = {
        username: 'TEST00_USUARIO',
        fullname: 'Nombre Completo #0',
        password,
        admin: true
    };

    const usuario01 = {
        username: 'TEST01_USUARIO',
        fullname: 'Nombre Completo #1',
        password,
        admin: false
    };

    const usuario02 = {
        username: 'TEST02_USUARIO',
        fullname: 'Nombre Completo #2',
        password,
        admin: false
    };

    before(async () => {
        await pool.query("DELETE FROM usuario WHERE username LIKE 'TEST%'");
    });

    it('Debería crear un usuario correctamente', async () => {
        await UsuarioModel.create({ input: usuario00 });
        const [usuario] = await pool.query(`SELECT * FROM usuario WHERE username = ?`, [usuario00.username]);
        expect(usuario).to.have.lengthOf(1);
        expect(usuario[0].username).to.equal(usuario00.username);
    });

    it('Debería fallar al crear un usuario con un nombre de usuario duplicado', async () => {
        try {
            await UsuarioModel.create({ input: usuario00 });
        } catch (err) {
            expect(err.errorType).to.equal('DB_DUPLICATE_ENTRY');
        }
    });

    it('Debería obtener un usuario por ID correctamente', async () => {
        const [usuario] = await pool.query(`SELECT * FROM usuario WHERE username = ?`, [usuario00.username]);
        const usuarioID = usuario[0].id;
        const fetchedUsuario = await UsuarioModel.getById({ id: usuarioID });
        expect(fetchedUsuario.username).to.equal(usuario00.username);
    });

    it('Debería actualizar la información del usuario correctamente', async () => {
        const [usuario] = await pool.query(`SELECT * FROM usuario WHERE username = ?`, [usuario00.username]);
        const usuarioID = usuario[0].id;
    
        const updatedUsuario = {
            id: usuarioID,
            username: 'UPDATED_TEST00_USUARIO',
            fullname: 'Updated Nombre Completo #0',
            admin: false
        };
    
        await UsuarioModel.edit({ input: updatedUsuario });
        const [updated] = await pool.query(`SELECT * FROM usuario WHERE id = ?`, [usuarioID]);
        expect(updated[0].username).to.equal(updatedUsuario.username);
        expect(updated[0].fullname).to.equal(updatedUsuario.fullname);
        expect(Number(updated[0].admin)).to.equal(Number(updatedUsuario.admin)); // Convertir a número para la comparación
    });    

    it('Debería cambiar la contraseña del usuario correctamente', async () => {
        const [usuario] = await pool.query(`SELECT * FROM usuario WHERE username = ?`, ['UPDATED_TEST00_USUARIO']);
        const usuarioID = usuario[0].id;
        const newPassword = 'new_password';
        await UsuarioModel.changePassword({ id: usuarioID, newPassword });
        const [updated] = await pool.query(`SELECT * FROM usuario WHERE id = ?`, [usuarioID]);
        expect(updated[0].password).to.not.equal(usuario[0].password);
    });

    it('Debería eliminar un usuario correctamente', async () => {
        const [usuario] = await pool.query(`SELECT * FROM usuario WHERE username = ?`, ['UPDATED_TEST00_USUARIO']);
        const usuarioID = usuario[0].id;
        await UsuarioModel.delete({ id: usuarioID });
        const [deleted] = await pool.query(`SELECT * FROM usuario WHERE id = ?`, [usuarioID]);
        expect(deleted).to.have.lengthOf(0);
    });

    it('Debería crear múltiples usuarios y obtenerlos en la lista de usuarios correctamente', async () => {
        await UsuarioModel.create({ input: usuario01 });
        await UsuarioModel.create({ input: usuario02 });

        const [usuario1] = await pool.query(`SELECT * FROM usuario WHERE username = ?`, [usuario01.username]);
        const [usuario2] = await pool.query(`SELECT * FROM usuario WHERE username = ?`, [usuario02.username]);

        const usuarios = await UsuarioModel.get();
        const usuario1InDB = usuarios.find(user => user.username === usuario01.username);
        const usuario2InDB = usuarios.find(user => user.username === usuario02.username);

        expect(usuario1InDB).to.exist;
        expect(usuario2InDB).to.exist;
    });

    after(async () => {
        await pool.query("DELETE FROM usuario WHERE username LIKE 'TEST%'");
    });
});
