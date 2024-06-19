import { expect } from 'chai';
import supertest from 'supertest';
import app from '../../src/app.js';
import { UsuarioModel } from '../../src/models/mysql/usuarios.model.js';
import { pool } from '../../src/database.js';

/// Estas pruebas de sistema prueba la protección de las rutas
// (1) Usuario sin registrar intenta acceder a la cualquier pagina, es redirigido a login
// (2) Usuario sin registrar intenta acceder a alguna ruta de la API, recibe un error
// (3) Usuario registrado accede a la API
// (4) Usuario registrado accede correctamente a la pagina de inicio
// (5) Usuario NO ADMINISTRADOR no puede acceder a la gestion de usuarios
// (6) Usuario ADMINISTRADOR puede acceder a la gestion de usuarios

describe('Pruebas de sistema de seguridad de acceso', () => {
    const usuario = {
        username: "TEST01_USER",
        fullname: "FULLNAME",
        password: "hala madrid",
        admin: false
    };

    const admin = {
        username: "TEST01_ADMIN",
        fullname: "FULLNAME",
        password: "aupa atleti",
        admin: true
    };

    before(async () => {
        await pool.query(`DELETE FROM usuario WHERE username LIKE 'TEST%'`);
        await UsuarioModel.create({input: usuario});
        await UsuarioModel.create({input: admin});
    });

    // (1) Usuario sin registrar intenta acceder a la cualquier pagina, es redirigido a login
    it('(1) debe redirigir a un usuario no registrado a la página de login al intentar acceder a cualquier página', async () => {
        const response = await supertest(app)
            .get('/')
            .redirects(0)
            .expect(302); // 302: Redireccion
    
        expect(response.headers.location).to.include('/login'); 
    });

    // (2) Usuario sin registrar intenta acceder a alguna ruta de la API, recibe un error
    it('(2) debe devolver un error cuando un usuario no registrado intenta acceder a alguna ruta de la API', async () => {
        const response = await supertest(app)
            .get('/api/stats/buque/general')
            .redirects(0)
            .expect(401); // 401: No autorizado
    });

    // (3) Usuario registrado accede a la API
    it('(3) debe permitir a un usuario registrado acceder a la API', async () => {
        const loginResponse = await supertest(app)
            .post('/login')
            .send({ username: usuario.username, password: usuario.password });
        
        const cookies = loginResponse.headers['set-cookie'];
        const sessionCookie = cookies
          .map(cookie => cookie.split(';')[0])
          .find(cookie => cookie.startsWith('connect.sid='));

        const response = await supertest(app)
            .get('/api/stats/buque/general')
            .set('Cookie', sessionCookie)
            .redirects(0)
            .expect(200);

        expect(response.headers['content-type']).to.include('application/json');
    });

    // (4) Usuario registrado accede correctamente a la pagina de inicio
    it('(4) debe permitir a un usuario registrado acceder correctamente a la página de inicio', async () => {
        const loginResponse = await supertest(app)
            .post('/login')
            .send({ username: usuario.username, password: usuario.password });
        
        const cookies = loginResponse.headers['set-cookie'];
        const sessionCookie = cookies
          .map(cookie => cookie.split(';')[0])
          .find(cookie => cookie.startsWith('connect.sid='));

        const response = await supertest(app)
            .get('/')
            .set('Cookie', sessionCookie)
            .redirects(0)
            .expect(200);
    });

    // (5) Usuario NO ADMINISTRADOR no puede acceder a la gestion de usuarios
    it('(5) debe impedir que un usuario no administrador acceda a la gestión de usuarios', async () => {
        const loginResponse = await supertest(app)
            .post('/login')
            .send({ username: usuario.username, password: usuario.password });
        
        const cookies = loginResponse.headers['set-cookie'];
        const sessionCookie = cookies
          .map(cookie => cookie.split(';')[0])
          .find(cookie => cookie.startsWith('connect.sid='));

        const response = await supertest(app)
            .get('/admin/usuarios')
            .set('Cookie', sessionCookie)
            .redirects(0)
            .expect(302);
    });

    // (6) Usuario ADMINISTRADOR puede acceder a la gestion de usuarios
    it('(6) debe permitir que un usuario administrador acceda a la gestión de usuarios', async () => {
        const loginResponse = await supertest(app)
            .post('/login')
            .send({ username: admin.username, password: admin.password });
        
        const cookies = loginResponse.headers['set-cookie'];
        const sessionCookie = cookies
          .map(cookie => cookie.split(';')[0])
          .find(cookie => cookie.startsWith('connect.sid='));

        const response = await supertest(app)
            .get('/admin/usuarios')
            .set('Cookie', sessionCookie)
            .redirects(0)
            .expect(200);
    });

    // it('(1) Debe iniciar sesión y acceder a su perfil correctamente', async () => {
    //     // Iniciar sesión
    //     const loginResponse = await supertest(app)
    //         .post('/login')
    //         .send({ username: usuario.username, password: usuario.password })
    //         .expect(302);

    //     // Extraer la cookie de sesión desde la cabecera 'Set-Cookie'
    //     const cookies = loginResponse.headers['set-cookie'];
        
    //     const sessionCookie = cookies
    //       .map(cookie => cookie.split(';')[0])
    //       .find(cookie => cookie.startsWith('connect.sid='));  // Encuentra la cookie 'connect.sid'
        
    //     const profileResponse = await supertest(app)
    //       .get('/perfil')
    //       .set('Cookie', sessionCookie)
    //       .expect(200);  // Verifica que se acceda correctamente al perfil
    
    //     expect(profileResponse.text).to.include(usuario.username);
    // });

    after(async () => {
        await pool.query(`DELETE FROM usuario WHERE username LIKE 'TEST%'`);
    });

});
