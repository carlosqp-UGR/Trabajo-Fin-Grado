import { expect } from 'chai';
import { ClienteModel } from '../../src/models/mysql/clientes.model.js';
import { pool } from '../../src/database.js'; // Importa la conexión de la base de datos

describe('Pruebas unitarias para ClienteModel', () => {
  let clienteId;

  before(async () => {
    // Limpiar solo los clientes cuyo nombre comienza con 'TEST'
    await pool.query("DELETE FROM cliente WHERE nombre LIKE 'TEST%'");
  });

  describe('Crear un cliente', () => {
    it('debería crear un nuevo cliente', async () => {
      const cliente = {
        nombre: 'TEST01 Cliente',
        tipo: 'CARGADOR',
        direccion: 'Dirección 1',
        cif: 'CIF123',
        vat: 'VAT123',
        telefono: '123456789',
        pais: 'País 1',
        email: 'test01@cliente.com',
        fax: '123456789',
        observaciones: 'Observaciones 1'
      };

      await ClienteModel.create({ input: cliente });

      const [result] = await pool.query('SELECT * FROM cliente WHERE nombre = ?', [cliente.nombre]);
      expect(result).to.have.lengthOf(1);
      clienteId = result[0].id;
    });

    it('debería fallar al crear un cliente con un nombre duplicado', async () => {
      const cliente = {
        nombre: 'TEST01 Cliente',
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

      try {
        await ClienteModel.create({ input: cliente });
      } catch (e) {
        expect(e.errorType).to.equal('DB_DUPLICATE_ENTRY');
      }
    });

    it('debería fallar al crear un cliente con un tipo inválido', async () => {
      const cliente = {
        nombre: 'TEST03 Cliente',
        tipo: 'FUTBOLISTA', // Tipo inválido
        direccion: 'Dirección 3',
        cif: 'CIF125',
        vat: 'VAT125',
        telefono: '987654322',
        pais: 'País 3',
        email: 'test03@cliente.com',
        fax: '987654322',
        observaciones: 'Observaciones 3'
      };

      try {
        await ClienteModel.create({ input: cliente });
      } catch (e) {
        expect(e.errorType).to.equal('DB_CHECK_CONSTRAINT');
        expect(e.errorField).to.equal('tipo');
      }
    });
  });

  describe('Buscar cliente', () => {
    it('debería buscar un cliente por nombre', async () => {
      const clientes = await ClienteModel.search({ search_field: 'nombre', search_query: 'TEST01' });
      expect(clientes).to.have.lengthOf(1);
      expect(clientes[0].nombre).to.equal('TEST01 Cliente');
    });

    it('debería devolver sugerencias por nombre', async () => {
      const cliente1 = {
        nombre: 'TEST02 Cliente',
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

      const cliente2 = {
        nombre: 'TEST03 Cliente',
        tipo: 'CARGADOR',
        direccion: 'Dirección 3',
        cif: 'CIF125',
        vat: 'VAT125',
        telefono: '987654322',
        pais: 'País 3',
        email: 'test03@cliente.com',
        fax: '987654322',
        observaciones: 'Observaciones 3'
      };

      await ClienteModel.create({ input: cliente1 });
      await ClienteModel.create({ input: cliente2 });

      const sugerencias = await ClienteModel.search({ search_field: 'nombre', search_query: 'TEST' });
      expect(sugerencias).to.have.lengthOf(3);
    });
  });

  describe('Modificar un cliente', () => {
    it('debería modificar un cliente existente', async () => {
      const cliente = {
        id: clienteId,
        nombre: 'TEST01 Cliente Modificado',
        tipo: 'CARGADOR',
        direccion: 'Dirección 1 Modificada',
        cif: 'CIF1234',
        vat: 'VAT1234',
        telefono: '1234567890',
        pais: 'País 1 Modificado',
        email: 'test01_mod@cliente.com',
        fax: '1234567890',
        observaciones: 'Observaciones 1 Modificadas'
      };

      await ClienteModel.edit({ input: cliente });

      const [result] = await pool.query('SELECT * FROM cliente WHERE id = ?', [clienteId]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].nombre).to.equal(cliente.nombre);
    });

    it('debería fallar al modificar un cliente con un nombre duplicado', async () => {
      const clienteModificado = {
        id: clienteId,
        nombre: 'TEST02 Cliente', // Nombre duplicado
        tipo: 'CARGADOR',
        direccion: 'Dirección 1 Modificada',
        cif: 'CIF1234',
        vat: 'VAT1234',
        telefono: '1234567890',
        pais: 'País 1 Modificado',
        email: 'test01_mod@cliente.com',
        fax: '1234567890',
        observaciones: 'Observaciones 1 Modificadas'
      };

      try {
        await ClienteModel.edit({ input: clienteModificado });
      } catch (e) {
        expect(e.errorType).to.equal('DB_DUPLICATE_ENTRY');
      }
    });
  });

  describe('Eliminar un cliente', () => {
    it('debería eliminar un cliente', async () => {
      await ClienteModel.delete({ id: clienteId });

      const [result] = await pool.query('SELECT * FROM cliente WHERE id = ?', [clienteId]);
      expect(result).to.have.lengthOf(0);
    });
  });

  after(async () => {
    // Limpiar solo los clientes cuyo nombre comienza con 'TEST'
    await pool.query("DELETE FROM cliente WHERE nombre LIKE 'TEST%'");
  });
});
