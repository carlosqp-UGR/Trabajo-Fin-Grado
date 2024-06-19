import { expect } from 'chai';
import { pool } from '../../src/database.js';
import { FacturasModel } from '../../src/models/mysql/facturas.model.js';
import { ClienteModel } from '../../src/models/mysql/clientes.model.js';
import { BuqueModel } from '../../src/models/mysql/buques.model.js';

describe('Pruebas unitarias para FacturasModel', () => {
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

    let facturaId;

    const facturaA = {
        tipo: 'A',
        num_factura: 'A01/28',
        fecha: '2024-01-01',
        cliente_nombre: cliente1.nombre,
        cliente_direccion: cliente1.direccion,
        cliente_vat: cliente1.vat,
        cliente_cif: cliente1.cif,
        iva: 21.00,
        total_sin_iva: 1000.00,
        total_con_iva: 1210.00,
        buque_nombre: buque.nombre,
        fecha_entrada: '2024-01-01',
        fecha_salida: '2024-01-10',
        concepto: ['Servicio 1', 'Servicio 2'],
        precio: [500.00, 500.00]
    };

    const facturaC = {
        tipo: 'C',
        num_factura: 'C01/28',
        fecha: '2024-01-01',
        cliente_nombre: cliente2.nombre,
        cliente_direccion: cliente2.direccion,
        cliente_vat: cliente2.vat,
        cliente_cif: cliente2.cif,
        iva: 21.00,
        total_sin_iva: 2000.00,
        total_con_iva: 2420.00,
        dia: [1, 2, 3, 4, 5],
        concepto: ['Concepto 1', 'Concepto 2'],
        precio: [1000.00, 1000.00]
    };

    before(async () => {
        // Limpiar las tablas relevantes
        await pool.query("DELETE FROM factura WHERE num_factura LIKE '%/28'");
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

    it('Debería crear una factura tipo A correctamente', async () => {
        await FacturasModel.create({ input: facturaA });
        const [result] = await pool.query('SELECT * FROM factura WHERE num_factura = ?', [facturaA.num_factura]);
        expect(result).to.have.lengthOf(1);
        facturaId = result[0].id;
    });

    it('Debería crear una factura tipo C correctamente', async () => {
        await FacturasModel.create({ input: facturaC });
        const [result] = await pool.query('SELECT * FROM factura WHERE num_factura = ?', [facturaC.num_factura]);
        expect(result).to.have.lengthOf(1);
    });

    it('Debería fallar al crear una factura con un número duplicado', async () => {
        try {
            await FacturasModel.create({ input: facturaA });
        } catch (err) {
            expect(err.errorType).to.equal('DB_DUPLICATE_ENTRY');
        }
    });

    it('Debería fallar al crear una factura con un cliente no válido', async () => {
        const invalidFactura = { ...facturaA, num_factura: 'A02/28', cliente_nombre: 'cliente_invalido' };
        try {
            await FacturasModel.create({ input: invalidFactura });
        } catch (err) {
            expect(err.errorType).to.equal('DB_FOREIGN_KEY_CONSTRAINT');
            expect(err.errorField).to.equal('cliente_nombre');
        }
    });

    it('Debería fallar al crear una factura tipo A con un buque no válido', async () => {
        const invalidFactura = { ...facturaA, num_factura: 'A03/28', buque_nombre: 'buque_invalido' };
        try {
            await FacturasModel.create({ input: invalidFactura });
        } catch (err) {
            expect(err.errorType).to.equal('DB_FOREIGN_KEY_CONSTRAINT');
            expect(err.errorField).to.equal('buque_nombre');
        }
    });

    it('Debería obtener una factura por ID correctamente', async () => {
        const fetchedFactura = await FacturasModel.getById({ tipo: facturaA.tipo, id: facturaId });
        expect(fetchedFactura.num_factura).to.equal(facturaA.num_factura);
    });

    it('Debería realizar una búsqueda correctamente', async () => {
        const searchResult = await FacturasModel.search({ tipo: facturaA.tipo, search_field: 'num_factura', search_query: 'A01/28' });
        expect(searchResult).to.have.lengthOf(1);
    });

    it('Debería fallar al borrar un cliente referenciado en una factura', async () => {
        try {
            await ClienteModel.delete({ id: cliente1.id });
            expect.fail("La operación de borrado no falló como se esperaba");
        } catch (err) {
            expect(err).to.be.an('error');
        }
    });

    it('Debería fallar al borrar un buque referenciado en una factura tipo A', async () => {
        try {
            await BuqueModel.delete({ id: buque.id });
            expect.fail("La operación de borrado no falló como se esperaba");
        } catch (err) {
            expect(err).to.be.an('error');
        }
    });

    it('Debería borrar una factura correctamente', async () => {
        await FacturasModel.delete({ tipo: facturaA.tipo, id: facturaId });
        const [result] = await pool.query('SELECT * FROM factura WHERE id = ?', [facturaId]);
        expect(result).to.have.lengthOf(0);
    });

    after(async () => {
        await pool.query("DELETE FROM factura WHERE num_factura LIKE '%/28'");
        await pool.query("DELETE FROM cliente WHERE nombre LIKE 'TEST%'");
        await pool.query("DELETE FROM buque WHERE nombre LIKE 'TEST%'");
    });
});
