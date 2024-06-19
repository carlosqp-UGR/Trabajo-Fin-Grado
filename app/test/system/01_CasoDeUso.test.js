import { expect } from 'chai';
import supertest from 'supertest';
import app from '../../src/app.js';
import { UsuarioModel } from '../../src/models/mysql/usuarios.model.js';
import { pool } from '../../src/database.js';

/// Este caso de uso simula un uso normal de la aplicación:
// (1) El usuario accede a su perfil y puede ver su nombre completo y su username
// (2) El usuario crea un cliente
// (3) El usuario crea un buque
// (4) El usuario modifica un buque
// (5) El usuario crea una factura de tipo A
// (6) El usuario saca la factura en PDF
// (7) El usuario elimina la factura

describe('Pruebas de sistema para casos de uso básicos', () => {
    const usuario = {
        username: "TEST01_USER",
        fullname: "FULLNAME",
        password: "hala madrid",
        admin: false
    };

    const cliente = {
        nombre: 'TEST01 Cliente',
        tipo: 'ARMADOR',
        direccion: 'Dirección 1',
        cif: 'CIF123',
        vat: 'VAT123',
        telefono: '123456789',
        pais: 'País 1',
        email: 'test01@cliente.com',
        fax: '123456789',
        observaciones: 'Observaciones 1'
    };

    const buque = {
		nombre: 'TEST01_BUQUE',
		matricula: '12345',
		bandera: 'NORUEGA',
		trb: 12300,
		trn: 9500,
		eslora: 30.11,
		calado: 6.75,
		manga: 15.75
    };

    const factura = {
        tipo: 'A',
        num_factura: 'A01/28',
        fecha: '2028-01-01',
        cliente_nombre: cliente.nombre,
        iva: 21.00,
        buque_nombre: buque.nombre,
        fecha_entrada: '2028-01-01',
        fecha_salida: '2028-01-02',
        concepto: ['Servicio 1', 'Servicio 2', 'Concepto 3'],
        precio: [500.00, 500.00, 1250.00]
    };

    before(async () => {
        try{
            const [result] = await pool.query(`SELECT id FROM factura WHERE num_factura=?`, [factura.num_factura]);
            const id = result[0].id || null;
            if (id) { // Eliminar facturas de prueba
                await pool.query(`DELETE FROM factura_con_buque WHERE id=?`, [id]);
                await pool.query(`DELETE FROM factura WHERE id=?`, [id]);
            }
        } catch (e) {

        }

        await pool.query(`DELETE FROM usuario WHERE username LIKE 'TEST%'`);
        await pool.query(`DELETE FROM buque WHERE nombre LIKE 'TEST%'`);
        await pool.query(`DELETE FROM cliente WHERE nombre LIKE 'TEST%'`);
        await UsuarioModel.create({input: usuario});
    });

    it('(1) Debe iniciar sesión y acceder a su perfil correctamente', async () => {
        // Iniciar sesión
        const loginResponse = await supertest(app)
            .post('/login')
            .send({ username: usuario.username, password: usuario.password })
            .expect(302);

        // Extraer la cookie de sesión desde la cabecera 'Set-Cookie'
        const cookies = loginResponse.headers['set-cookie'];
        
        const sessionCookie = cookies
          .map(cookie => cookie.split(';')[0])
          .find(cookie => cookie.startsWith('connect.sid='));  // Encuentra la cookie 'connect.sid'
        
        const profileResponse = await supertest(app)
          .get('/perfil')
          .set('Cookie', sessionCookie)
          .expect(200);  // Verifica que se acceda correctamente al perfil
    
        expect(profileResponse.text).to.include(usuario.username);
    });

    it('(2) Crear un cliente correctamente', async () => {
        const loginResponse = await supertest(app)
            .post('/login')
            .send({ username: usuario.username, password: usuario.password })

        // Extraer la cookie de sesión desde la cabecera 'Set-Cookie'
        const cookies = loginResponse.headers['set-cookie'];
        
        const sessionCookie = cookies
          .map(cookie => cookie.split(';')[0])
          .find(cookie => cookie.startsWith('connect.sid='));  // Encuentra la cookie 'connect.sid'
        
        const response = await supertest(app)
          .post('/clientes/add')
          .redirects(1)
          .set('Cookie', sessionCookie)
          .send({ ...cliente });

        expect(response.statusCode).to.equal(200);
        expect(response.text).to.include('creado correctamente');
    });

    it('(3) Crear un buque correctamente', async () => {
        const loginResponse = await supertest(app)
            .post('/login')
            .send({ username: usuario.username, password: usuario.password })

        const cookies = loginResponse.headers['set-cookie'];
        
        const sessionCookie = cookies
          .map(cookie => cookie.split(';')[0])
          .find(cookie => cookie.startsWith('connect.sid='));  // Encuentra la cookie 'connect.sid'
        
        const response = await supertest(app)
          .post('/buques/add')
          .redirects(1)
          .set('Cookie', sessionCookie)
          .send({ ...buque });

        expect(response.statusCode).to.equal(200);
        expect(response.text).to.include('creado correctamente');
    });

    it('(4) Obtener datos del buque antes, editar buque, volver a obtener datos del buque (editado)', async () => {
        // Obtener id del buque (Previo a la prueba)
        const [result] = await pool.query(`SELECT id FROM buque WHERE nombre=?`, [buque.nombre]);
        buque.id = result[0].id;

        // Iniciar sesion
        const loginResponse = await supertest(app)
            .post('/login')
            .send({ username: usuario.username, password: usuario.password })

        const cookies = loginResponse.headers['set-cookie'];
        
        const sessionCookie = cookies
          .map(cookie => cookie.split(';')[0])
          .find(cookie => cookie.startsWith('connect.sid='));
        
        const responseBeforeEdit = await supertest(app)
          .get(`/buques/get/${buque.id}`)
          .set('Cookie', sessionCookie)
          .expect(200);

        expect(responseBeforeEdit.text).to.include(buque.nombre);

        const matriculaEditada = `${buque.matricula}_EDITADO`;
        buque.matricula = matriculaEditada;

        const responseAfterEdit = await supertest(app)
            .post(`/buques/edit/${buque.id}`)
            .set('Cookie', sessionCookie)
            .send({...buque})
            .redirects(1);

        expect(responseAfterEdit.status).to.equal(200);
        expect(responseAfterEdit.redirects[0]).to.include(`/buques/get/${buque.id}`);
        expect(responseAfterEdit.text).to.include(buque.nombre);
        expect(responseAfterEdit.text).to.include('modificado correctamente');
    });

    it('(5) Crear una factura', async () => {
        // Iniciar sesion
        const loginResponse = await supertest(app)
            .post('/login')
            .send({ username: usuario.username, password: usuario.password })

        const cookies = loginResponse.headers['set-cookie'];
        
        const sessionCookie = cookies
          .map(cookie => cookie.split(';')[0])
          .find(cookie => cookie.startsWith('connect.sid='));
        
        const response = await supertest(app)
            .post(`/facturas/cuentas-escala/add`)
            .set('Cookie', sessionCookie)
            .redirects(1)
            .send({...factura});
        
        expect(response.status).to.equal(200);
        expect(response.redirects[0]).to.include(`/facturas/cuentas-escala`);
        expect(response.text).to.include('creada correctamente');
    });

    it('(6) Obtener el pdf de una factura', async () => {
        // Obtener id de la factura (Previo a la prueba)
        const [result] = await pool.query(`SELECT id FROM factura_con_buque WHERE buque_id=?`, [buque.id]);
        factura.id = result[0].id;

        // Iniciar sesion
        const loginResponse = await supertest(app)
            .post('/login')
            .send({ username: usuario.username, password: usuario.password })

        const cookies = loginResponse.headers['set-cookie'];
        
        const sessionCookie = cookies
          .map(cookie => cookie.split(';')[0])
          .find(cookie => cookie.startsWith('connect.sid='));
        
        const response = await supertest(app)
            .get(`/facturas/cuentas-escala/pdf/${factura.id}`)
            .set('Cookie', sessionCookie)
            .expect('Content-Type', 'application/pdf')
            .expect(201);
        
        expect(response.headers['content-disposition']).to.include(`filename=${factura.num_factura}.pdf`);
    });

    it('(7) Eliminar una factura', async () => {
        const loginResponse = await supertest(app)
            .post('/login')
            .send({ username: usuario.username, password: usuario.password });

        const cookies = loginResponse.headers['set-cookie'];
        
        const sessionCookie = cookies
          .map(cookie => cookie.split(';')[0])
          .find(cookie => cookie.startsWith('connect.sid='));
        
        const response = await supertest(app)
            .get(`/facturas/cuentas-escala/delete/${factura.id}`)
            .set('Cookie', sessionCookie)
            .redirects(1);
        
        // console.log(response);
        expect(response.status).to.equal(200);
        expect(response.redirects[0]).to.include(`/facturas/cuentas-escala`);
        expect(response.text).to.include('Factura eliminada correctamente');
    });

    after(async () => {
        await pool.query(`DELETE FROM buque WHERE nombre LIKE 'TEST%'`);
        await pool.query(`DELETE FROM cliente WHERE nombre LIKE 'TEST%'`);
        await pool.query(`DELETE FROM usuario WHERE username LIKE 'TEST%'`);
    });
});