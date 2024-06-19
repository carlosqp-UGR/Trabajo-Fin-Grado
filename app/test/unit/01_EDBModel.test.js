import { expect } from 'chai';
import { pool } from '../../src/database.js';
import { EDBModel } from '../../src/models/mysql/edb.model.js';
import { ClienteModel } from '../../src/models/mysql/clientes.model.js';
import { BuqueModel } from '../../src/models/mysql/buques.model.js';

describe('Pruebas unitarias para EDBModel', () => {
    const cliente1 = {
        nombre: 'TEST01_CLIENTE',
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

    const cliente2 = {
        nombre: 'TEST02_CLIENTE',
        tipo: 'CARGADOR',
        direccion: 'Dirección 2',
        cif: 'CIF124',
        vat: 'VAT124',
        telefono: '987654321',
        pais: 'País 2',
        email: 'test02@cliente.com',
        fax: '987654321',
        observaciones: 'Observaciones 2'
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

    let edbId;

    const edb = {
        numero: 'T01/24',
        puerto: 'garrucha',
        buque_nombre: buque.nombre,
        entrada: '2024-01-01',
        salida: '2024-01-10',
        t2l: 'T2L123',
        dua: 'DUA123',
        origen: 'Origen 1',
        destino: 'Destino 1',
        armador_nombre: cliente1.nombre,
        capitan: 'Capitan 1',
        material: 'yeso',
        carga: '1000',
        cargador_nombre: cliente2.nombre,
        arrival_on_the_road: '2024-01-01T08:00',
        entrada_fondeadero: '2024-01-01T10:00',
        salida_fondeadero: '2024-01-01T12:00',
        atraque_puerto: '2024-01-01T14:00',
        inicio_carga: '2024-01-01T16:00',
        fin_carga: '2024-01-01T18:00',
        salida_puerto: '2024-01-01T20:00',
        observaciones: 'Observaciones de la estancia'
    };

    before(async () => {
        // Limpiar las tablas relevantes
        await pool.query("DELETE FROM estancia_de_buque WHERE numero LIKE 'T%/24'");
        await pool.query("DELETE FROM cliente WHERE nombre LIKE 'TEST%'");
        await pool.query("DELETE FROM buque WHERE nombre LIKE 'TEST%'");

        // Crear dos clientes
        await ClienteModel.create({ input: cliente1 });
        await ClienteModel.create({ input: cliente2 });
        const [cliente1Result] = await pool.query('SELECT id FROM cliente WHERE nombre = ?', [cliente1.nombre]);
        const [cliente2Result] = await pool.query('SELECT id FROM cliente WHERE nombre = ?', [cliente2.nombre]);
        cliente1.id = cliente1Result[0].id;
        cliente2.id = cliente2Result[0].id;

        // Crear un buque
        await BuqueModel.create({ input: buque });
        const [buqueResult] = await pool.query('SELECT id FROM buque WHERE nombre = ?', [buque.nombre]);
        buque.id = buqueResult[0].id;
    });

    it('Debería crear una EDB correctamente', async () => {
        await EDBModel.create({ input: edb });
        const [result] = await pool.query('SELECT * FROM estancia_de_buque WHERE numero = ?', [edb.numero]);
        expect(result).to.have.lengthOf(1);
        edbId = result[0].id;
    });

    it('Debería fallar al crear una EDB con un número duplicado', async () => {
        try {
            await EDBModel.create({ input: edb });
        } catch (err) {
            expect(err.errorType).to.equal('DB_DUPLICATE_ENTRY');
        }
    });

    it('Debería fallar al crear una EDB con un armador no válido', async () => {
        const invalidEDB = { ...edb, numero: 'T02/24', armador_nombre: 'test01_armador_invalido' };
        try {
            await EDBModel.create({ input: invalidEDB });
        } catch (err) {
            expect(err.errorType).to.equal('DB_FOREIGN_KEY_CONSTRAINT');
            expect(err.errorField).to.equal('armador_nombre');
        }
    });

    it('Debería fallar al crear una EDB con un buque no válido', async () => {
        const invalidEDB = { ...edb, numero: 'T03/24', buque_nombre: 'test01_buque_invalido' };
        try {
            await EDBModel.create({ input: invalidEDB });
        } catch (err) {
            expect(err.errorType).to.equal('DB_FOREIGN_KEY_CONSTRAINT');
            expect(err.errorField).to.equal('buque_nombre');
        }
    });

    it('Debería obtener una EDB por ID correctamente', async () => {
        const fetchedEDB = await EDBModel.getById({ id: edbId });
        expect(fetchedEDB.numero).to.equal(edb.numero);
    });

    it('Debería realizar una búsqueda correctamente', async () => {
        const searchResult = await EDBModel.search({ search_field: 'numero', search_query: 'T01/24' });
        expect(searchResult).to.have.lengthOf(1);
    });

    it('Debería actualizar la información de la EDB correctamente', async () => {
        const updatedEDB = { ...edb, id: edbId, numero: 'T01/24', puerto: 'carboneras' };
        await EDBModel.edit({ input: updatedEDB });
        const [result] = await pool.query('SELECT * FROM estancia_de_buque WHERE id = ?', [edbId]);
        expect(result[0].puerto).to.equal('carboneras');
    });

    it('Debería fallar al borrar un cliente referenciado en una EDB', async () => {
		try {
			await ClienteModel.delete({ id: cliente1.id });
			// Si llega aquí, no lanzó el error esperado, así que fallamos la prueba manualmente
			expect.fail("La operación de borrado no falló como se esperaba");
		} catch (err) {
			expect(err).to.be.an('error');
		}
	});

	it('Debería fallar al borrar un buque referenciado en una EDB', async () => {
		try {
			await BuqueModel.delete({ id: buque.id });
			// Si llega aquí, no lanzó el error esperado, así que fallamos la prueba manualmente
			expect.fail("La operación de borrado no falló como se esperaba");
		} catch (err) {
			expect(err).to.be.an('error');
		}
	});

    it('Debería borrar una EDB correctamente', async () => {
        await EDBModel.delete({ id: edbId });
        const [result] = await pool.query('SELECT * FROM estancia_de_buque WHERE id = ?', [edbId]);
        expect(result).to.have.lengthOf(0);
    });

    after(async () => {
        await pool.query("DELETE FROM estancia_de_buque WHERE numero LIKE 'T%/24'");
        await pool.query("DELETE FROM cliente WHERE nombre LIKE 'TEST%'");
        await pool.query("DELETE FROM buque WHERE nombre LIKE 'TEST%'");
    });
});
