import { expect } from 'chai';
import { BuqueModel } from '../../src/models/mysql/buques.model.js';
import { pool } from '../../src/database.js'; // Importa la conexión de la base de datos

describe('Pruebas unitarias para BuqueModel', () => {
	let buque01ID;
	
	const buque01 = {
		nombre: 'TEST01_BUQUE',
		matricula: '12345',
		bandera: 'NORUEGA',
		trb: 12300,
		trn: 9500,
		eslora: 30.11,
		calado: 6.75,
		manga: 15.75
	};

	const buque02 = {
		nombre: 'TEST02_BUQUE',
		matricula: '6789',
		bandera: 'DUBAI',
		trb: 18300,
		trn: 12000,
		eslora: 35,
		calado: 7,
		manga: 20
	};

	before(async () => {
		await pool.query("DELETE FROM buque WHERE nombre LIKE 'TEST%'");
	});

	describe('Crear un buque', () => {
		it('debería crear un nuevo buque', async () => {
			await BuqueModel.create({ input: buque01 });
			const [result] = await pool.query('SELECT * FROM buque WHERE nombre = ?', [buque01.nombre]);
			expect(result).to.have.lengthOf(1);
			buque01ID = result[0].id;
		});

		it('debería fallar al crear un buque con un nombre duplicado', async () => {
			const buquePrueba = {
				nombre: buque01.nombre,
				matricula: buque01.matricula,
				bandera: 'ESPAÑA',
				trb: 12300,
				trn: 9500,
				eslora: 30.11,
				calado: 6.75,
				manga: 15.75
			};

			try {
				await BuqueModel.create({ input: buquePrueba });
			} catch (e) {
				expect(e.errorType).to.equal('DB_DUPLICATE_ENTRY');
			}
		});
	});

	describe('Buscar buque', () => {
		it('debería buscar un buque por nombre', async () => {
			const buques = await BuqueModel.search({ search_field: 'nombre', search_query: 'TEST01' });
			expect(buques).to.have.lengthOf(1);
			expect(buques[0].nombre).to.equal(buque01.nombre);
		});

		it('debería devolver sugerencias por nombre', async () => {
			await BuqueModel.create({ input: buque02 });
			const sugerencias = await BuqueModel.search({ search_field: 'nombre', search_query: 'TEST' });
			expect(sugerencias).to.have.lengthOf(2);
		});
	});

	describe('Modificar un buque', () => {
		it('debería modificar un buque existente', async () => {
			let caladoOriginal = buque01.calado;
			let caladoEditado = caladoOriginal + 100;
			buque01.id = buque01ID;
			buque01.calado = caladoEditado;

			await BuqueModel.edit({ input: buque01 });

			const [result] = await pool.query('SELECT * FROM buque WHERE id = ?', [buque01ID]);
			expect(result).to.have.lengthOf(1);
			expect(parseFloat(result[0].calado)).to.equal(parseFloat(caladoEditado));
		});

		it('debería fallar al modificar un buque con un nombre duplicado', async () => {
			const buque01Modificado = buque01;
			buque01Modificado.nombre = buque02.nombre;

			try {
				await BuqueModel.edit({ input: buque01Modificado });
			} catch (e) {
				expect(e.errorType).to.equal('DB_DUPLICATE_ENTRY');
			}
		});
	});

	describe('Eliminar un buque', () => {
		it('debería eliminar un buque', async () => {
			await BuqueModel.delete({ id: buque01ID });

			const [result] = await pool.query('SELECT * FROM buque WHERE id = ?', [buque01ID]);
			expect(result).to.have.lengthOf(0);
		});
	});

	after(async () => {
		await pool.query("DELETE FROM buque WHERE nombre LIKE 'TEST%'");
	});
});
