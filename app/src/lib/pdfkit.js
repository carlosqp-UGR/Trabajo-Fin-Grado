// import fs from 'fs/promises'; // Load images
import path from 'path';
import {fileURLToPath} from 'url';
import fs from 'fs';
import PDFDocument from 'pdfkit';

// Variables globales
const marginY = convertCmToPDFPoints(0.5);
const marginX = convertCmToPDFPoints(1.5);

// 1 inch = 72 pdf points
// 1 cm = 0.4 inches
function convertCmToPDFPoints(cm) {
    const factorCmToInch = 0.4;
    const factorInchToPDFPoint = 72.0;
    return Math.ceil(cm*factorCmToInch*factorInchToPDFPoint);
};

// Transform numbers to 1.000,46
function formatPrice(number) {
    let str;
    try {
       str= number.toLocaleString('de-DE', { minimumFractionDigits: 2});
    } catch (e) {
        str = '0,00';
    }
    return str;
};

// Transforms date from YYYY-MM-DD format to 
// param date is a date in format YYYY-MM-DD
// returns date in format DD/MM/YYYY
function formatDate(date) {
    if (date !== null && date !== '') {
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`
    } else {
        return '-';
    }
}

// EMPRESA: ['ANSADA 2002, S.L.', 'EMESTIGA S.L.', 'ANDRES QUESADA E HIJOS, S.A.']
function createHeader(doc, empresa) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logoPath = path.join(__dirname, '..', 'public', 'img', 'pdfkit', 'aqh-logo.png');    
    const logoBuffer = fs.readFileSync(logoPath);
    doc.image(logoBuffer, 
        marginX,  // x
        marginY,  // y
        { 
            width: convertCmToPDFPoints(3.5),
            //height: convertCmToPDFPoints()
    });

    doc.font('Helvetica-Bold');
    doc.fontSize(18).text(empresa, marginX, (1.5*marginY), {
        align: 'center',
    });

    doc.font('Helvetica');
    doc.fontSize(10);

    const info = `Shipping Agents & Stevedores\nPaseo del Malecón, 158 Bajo\n04630 Garrucha, Almería (Spain)`;
    doc.text(info, 
        (convertCmToPDFPoints(3.5) + marginX),
        convertCmToPDFPoints(1.8),
        {
            align: 'left',
    });

    const contact = `Teléfono: 950 460 025\nFax: 950 460 178\nEmail: ansada@ansada.com`;
    doc.text(contact, 
        (doc.page.width - marginX - convertCmToPDFPoints( 4 + 3.5)),
        convertCmToPDFPoints(1.8),
        {
            align: 'left',
    });

    const sgsPath = path.join(__dirname, '..', 'public', 'img', 'pdfkit', 'sgs-logo.png');    
    const sgsBuffer = fs.readFileSync(sgsPath);
    doc.image(sgsBuffer, 
        (doc.page.width - convertCmToPDFPoints(2.5 + 1.5)), // x
        convertCmToPDFPoints(0.5), // y
        { 
            height: convertCmToPDFPoints(2.5),
            width: convertCmToPDFPoints(2.5) 
    });
}

function createFooter(doc, empresa) {

    const footer1 = `${empresa} garantiza la seguridad y confidencialidad de sus datos. Los datos que se faciliten serán `  + 
    `incorporados a una base de datos para gestiones propias de la relación comercial. Usted puede ejercer en cualquier `   + 
    `momento sus derechos de acceso, rectificación, cancelación y oposición de acuerdo con la Ley Orgánica 3/2018 del 5 `   + 
    `de diciembre, de Protección de Datos Personales y garantía de los derechos digitales, contactando por correo `         +
    `electrónico a ansada@ansada.com.`;

    doc.fontSize(6).text(footer1, 
        marginX,  
        (doc.page.height - convertCmToPDFPoints(2) ), 
        {
            align: 'justify'
        }
    );
    
    let footer2 = '';
    if(empresa === 'ANSADA 2002, S.L.')
        footer2 = `Inscrita en el R.M. de Almería, Tomo 728, Folio 83, Hoja AL-18994, Inscripción 1ª CIF B-04432100`;
    else if (empresa === 'EMESTIGA S.L.')
        footer2 = `Inscrita en el R.M. de Almería, Tomo 728, Folio 93, Hoja AL-18996, Inscripción 1ª CIF B-04432084`;
    else if (empresa === 'ANDRES QUESADA E HIJOS, S.A.')
        footer2 = `Inscrita en el R.M. de Almería, Tomo 134, Gral. 90 Sec 3ª, Libro Sdes, Hoja nº 2101, Inscripción 1ª VAT ESA-04029096`;

    doc.moveDown();
    doc.fontSize(8).text(footer2, {
        align: 'center'
    });
}

// Crear el pdf de la factura. La estructura del objeto factura debe ser la siguiente:
// factura = { 
//     num_factura, 
//     tipo ('A','B','C,'AQH'), 
//     fecha (format YYYY-MM-DD), 

//     total_sin_iva,
//     iva,
//     total_con_iva,

//     cliente_nombre, 
//     cliente_direccion, 
//     cliente_vat, 

//     buque_nombre (*opcional, sólo tipos A o B),
//     fecha_entrada (*opcional, sólo tipos A o B),
//     fecha_salida (*opcional, sólo tipos A o B),

//     dia []  (*opcional, sólo tipo C),
//     concepto[],
//     precio []
// }

export const generateInvoicePDF = async (writeStream, factura) => {
    const pdfOptions = {
        size: 'A4',
        margins: {
            top: marginY,
            bottom: marginY,
            left: marginX,
            right: marginX
        },
        autoFirstPage: false,
        compress: true
    };

    const doc = new PDFDocument(pdfOptions);
    doc.pipe(writeStream);

    const empresas = ['ANSADA 2002, S.L.', 'EMESTIGA S.L.', 'ANDRES QUESADA E HIJOS, S.A.'];

    let empresa = '';
    if(factura.tipo == 'A' || factura.tipo == 'B') empresa = empresas[0];
    else if (factura.tipo == 'C') empresa = empresas[1];
    else if (factura.tipo == 'AQH') empresa = empresas[2];

    /// Metadata
    doc.info.Title = factura.num_factura;
    doc.info.Author = empresa;

    //////////////////////////////////////////////////////////////////////////
    /// Cabecera y footer
    doc.on('pageAdded', () => {
        createHeader(doc, empresa);
        createFooter(doc, empresa);
        
        // Restablecer el cursor en el principio de la pagina y valores por defecto
        doc.y = marginY + convertCmToPDFPoints(3);
        doc.x = marginX;
        // Restablecer la fuente y el tamaño
        doc.font('Helvetica');
        doc.fontSize(10);
    });

    doc.addPage();

    //////////////////////////////////////////////////////////////////////////
    /// Información del cliente
    doc.x = doc.page.width - marginX - convertCmToPDFPoints(4 + 3.5);
    doc.y = convertCmToPDFPoints(4);
    doc.text(`MESSRS.`, {align: 'justify'});
    doc.moveDown();
    doc.text(factura.cliente_nombre.toUpperCase(), {align: 'justify'});
    doc.moveDown();
    let direccion = factura.cliente_direccion.replace(/\r\n/g, '\n') || '  ';
    doc.text(`${direccion.toUpperCase()}`, {align: 'justify'});
    if (factura.cliente_cif && factura.cliente_cif.trim() !== '') {
        doc.moveDown();
        doc.text(`CIF: ${factura.cliente_cif.toUpperCase()}`, {align: 'justify'});
    } else if (factura.cliente_vat && factura.cliente_vat.trim() !== '') {
        doc.moveDown();
        doc.text(`VAT: ${factura.cliente_vat.toUpperCase()}`, {align: 'justify'});
    }

    //////////////////////////////////////////////////////////////////////////
    /// Metadatos de factura (num_factura y fecha)
    // Definir coordenadas y dimensiones del recuadro
    const th_x0 = marginX;
    const th_y0 = convertCmToPDFPoints(5.5);
    const th_width = convertCmToPDFPoints(7);
    const th_height = convertCmToPDFPoints(2.2);
    const th_column_width = convertCmToPDFPoints(3.5); // Ancho de cada columna dentro del recuadro
    const table_header_height = 25;

    // Rellenar las cabeceras con un color de fondo
    doc.rect(th_x0, th_y0, th_column_width, table_header_height).fillColor('lightgray').fill();
    doc.rect(th_x0 + th_column_width, th_y0, th_column_width, table_header_height).fill();

    // Agregar texto en las cabeceras
    doc.fillColor('black');
    doc.text('INVOICE/FACTURA', th_x0 + 5, th_y0 + 10);
    doc.text('DATE/FECHA', th_x0 + th_column_width, th_y0 + 10, {width: convertCmToPDFPoints(3.5), align: 'center'});

    // Dibujar líneas (contorno)
    doc.rect(th_x0, th_y0, th_width, th_height).stroke();
    doc.moveTo(th_x0, th_y0 + table_header_height).lineTo(th_x0 + th_width, th_y0 + table_header_height).stroke();
    doc.moveTo(th_x0 + th_column_width, th_y0).lineTo(th_x0 + th_column_width, th_y0 + th_height).stroke();

    // Agregar datos en los recuadros
    doc.text(`${factura.num_factura}`, th_x0, th_y0 + table_header_height + 15, {
        heigh: th_height - table_header_height,
        width: th_column_width, 
        align: 'center',
    });
    doc.text(`${formatDate(factura.fecha)}`, th_x0+th_column_width, th_y0 + table_header_height + 15, {
        heigh: th_height - table_header_height,
        width: th_column_width, 
        align: 'center',
    });

    //////////////////////////////////////////////////////////////////////////
    /// Añadir datos de buque (si está definido...)
    if (factura.buque_nombre && factura.buque_nombre.trim() !== '') {
        doc.x = marginX;
        doc.y = convertCmToPDFPoints(8.5);
        doc.text(`VESSEL/BUQUE:  ${factura.buque_nombre.toUpperCase()}`);
        doc.moveDown();
        doc.text(`ARRIVED/LLEGADO:  ${formatDate(factura.fecha_entrada)}            SALIDO/SAILED: ${formatDate(factura.fecha_salida)}`);
    }

    //////////////////////////////////////////////////////////////////////////
    /// Dibujar tabla de conceptos (diferenciar entre tipo C) y escribir el total
    const summaryBreakpoint = doc.page.height - convertCmToPDFPoints(4.5);

    if (factura.tipo == 'C') {     
        const tableHeaderHeight = 25;
        const pageWidth = doc.page.width;
        const tableWidth = pageWidth - 2 * marginX;
        const tableHeight = convertCmToPDFPoints(16.5);
        const column1Width = convertCmToPDFPoints(2); // 2 cm en puntos (28.35 puntos = 1 cm)
        const column2Width = convertCmToPDFPoints(12); // 12 cm en puntos
        const column3Width = tableWidth - column1Width - column2Width;

        // Coordenadas iniciales de la tabla
        const tableX = marginX;
        const tableY = doc.page.height - tableHeight - convertCmToPDFPoints(2.5); // Puedes ajustar la posición vertical según sea necesario

        // Relleno
        doc.rect(tableX, tableY, column1Width+column2Width+column3Width, tableHeaderHeight).fillColor('lightgray').fill();
        // Agregar texto a las tres columnas
        doc.fillColor('black');
        doc.text('DIA', tableX, tableY +10, { width: column1Width, align: 'center' });
        doc.text('CONCEPTO', tableX + column1Width, tableY+10, { width: column2Width, align: 'center' });
        doc.text('EUROS', tableX + column1Width + column2Width, tableY+10, { width: column3Width, align: 'center' });
        // Líneas verticales
        doc.moveTo(tableX, tableY).lineTo(tableX, tableY + tableHeight).stroke(); // Línea izquierda de la columna 2
        doc.moveTo(tableX + column1Width, tableY).lineTo(tableX + column1Width, tableY + tableHeight).stroke(); // Línea izquierda de la columna 2
        doc.moveTo(tableX + column1Width + column2Width, tableY).lineTo(tableX + column1Width + column2Width, tableY + tableHeight).stroke(); // Línea izquierda de la columna 3
        doc.moveTo(tableX + column1Width + column2Width + column3Width, tableY).lineTo(tableX + column1Width + column2Width + column3Width, tableY + tableHeight).stroke(); // Línea izquierda de la columna 3
        // Líneas Horizontales
        doc.moveTo(tableX, tableY).lineTo(tableX + tableWidth, tableY).stroke(); // Línea superior de la tabla
        doc.moveTo(tableX, tableY + tableHeaderHeight).lineTo(tableX + tableWidth, tableY + tableHeaderHeight).stroke(); // Línea inferior de la tabla
        doc.moveTo(tableX, tableY + tableHeight).lineTo(tableX + tableWidth, tableY + tableHeight).stroke(); // Línea inferior de la tabla

        // Rellenar con conceptos
        const summaryBreakpoint = doc.page.height - convertCmToPDFPoints(4.5);
        doc.y = tableY + tableHeaderHeight;
        for (let i = 0; i < factura.concepto.length; i++) {
            const concepto = {
                dia: factura.dia[i] || null,
                concepto: factura.concepto[i],
                precio: factura.precio[i] || null
            }

            if (concepto.concepto !== null && concepto.concepto.trim() !== '') {
                doc.moveDown();
                doc.x = tableX + column1Width + 5;
                doc.text(concepto.concepto.toUpperCase(), { width: column2Width - 10, align: 'left' });

                if(concepto.precio !== null) {
                    doc.moveUp(); // a la misma altura
                    doc.x = tableX + column1Width + column2Width;
                    const precioFormateado = formatPrice(concepto.precio);
                    doc.text(precioFormateado, {width: column3Width-5, align:'right'});
                }

                if(concepto.dia !== null) {
                    doc.moveUp(); // a la misma altura
                    doc.x = tableX;
                    doc.text(concepto.dia, { width: column1Width, align: 'center' });
                }

                if(doc.y >= summaryBreakpoint) {
                    const extendTable = () => {
                        // Add new page
                        doc.addPage();

                        // New values, same procedure
                        const tableY = marginY + convertCmToPDFPoints(3.5);
                        const tableHeight = doc.page.height - tableY - convertCmToPDFPoints(2.5);

                        // Relleno
                        doc.rect(tableX, tableY, column1Width+column2Width+column3Width, tableHeaderHeight).fillColor('lightgray').fill();
                        // Agregar texto a las tres columnas
                        doc.fillColor('black');
                        doc.text('DIA', tableX, tableY +10, { width: column1Width, align: 'center' });
                        doc.text('CONCEPTO', tableX + column1Width, tableY+10, { width: column2Width, align: 'center' });
                        doc.text('EUROS', tableX + column1Width + column2Width, tableY+10, { width: column3Width, align: 'center' });
                        // Líneas verticales
                        doc.moveTo(tableX, tableY).lineTo(tableX, tableY + tableHeight).stroke(); // Línea izquierda de la columna 2
                        doc.moveTo(tableX + column1Width, tableY).lineTo(tableX + column1Width, tableY + tableHeight).stroke(); // Línea izquierda de la columna 2
                        doc.moveTo(tableX + column1Width + column2Width, tableY).lineTo(tableX + column1Width + column2Width, tableY + tableHeight).stroke(); // Línea izquierda de la columna 3
                        doc.moveTo(tableX + column1Width + column2Width + column3Width, tableY).lineTo(tableX + column1Width + column2Width + column3Width, tableY + tableHeight).stroke(); // Línea izquierda de la columna 3
                        // Líneas Horizontales
                        doc.moveTo(tableX, tableY).lineTo(tableX + tableWidth, tableY).stroke(); // Línea superior de la tabla
                        doc.moveTo(tableX, tableY + tableHeaderHeight).lineTo(tableX + tableWidth, tableY + tableHeaderHeight).stroke(); // Línea inferior de la tabla
                        doc.moveTo(tableX, tableY + tableHeight).lineTo(tableX + tableWidth, tableY + tableHeight).stroke(); // Línea inferior de la tabla

                        // Restablecer el cursor
                        // doc.x = tableX + tableHeaderHeight;
                        doc.y = tableY + tableHeaderHeight;
                    };

                    extendTable();
                }
            }
        }

        // Summary
        doc.x = tableX + column1Width;
        doc.y = summaryBreakpoint;
        doc.text(`TOTAL DISBURSEMENTS/TOTAL GASTOS`, { width: column2Width-5, align: 'right' });
        doc.moveUp(); // Misma altura
        doc.x = tableX + column1Width + column2Width;
        doc.text(formatPrice(factura.total_sin_iva), {width: column3Width-5, align:'right'});
        doc.moveDown();
        doc.x = tableX + column1Width;
        doc.text(`VAT ${formatPrice(factura.iva)}% IVA ${formatPrice(factura.iva)}%`, { width: column2Width-5, align: 'right' });
        doc.moveUp(); // Misma altura
        doc.x = tableX + column1Width + column2Width;
        doc.text(formatPrice(factura.total_sin_iva * (factura.iva/100.0)), {width: column3Width-5, align:'right'});
        doc.moveDown();
        doc.x = tableX + column1Width;
        doc.text(`TOTAL INVOICE/TOTAL FACTURA`, { width: column2Width-5, align: 'right' });
        doc.moveUp(); // Misma altura
        doc.x = tableX + column1Width + column2Width;
        doc.text(formatPrice(factura.total_con_iva), {width: column3Width-5, align:'right'});
        doc.moveDown();

    } else {
        const tc_x0 = marginX;
        const tc_height = convertCmToPDFPoints(16.5);
        const tc_y0 = doc.page.height - convertCmToPDFPoints(2.5) - tc_height;
        const tc_width = doc.page.width - 2*marginX;
        const tc_column_width = convertCmToPDFPoints(14);
        const tc_2nd_column_width = doc.page.width-(2*marginX) - tc_column_width;
    
        // Rellenar las cabeceras con un color de fondo
        doc.rect(tc_x0, tc_y0, tc_column_width, table_header_height).fillColor('lightgray').fill();
        doc.rect(tc_x0 + tc_column_width, tc_y0, tc_2nd_column_width, table_header_height).fill();
    
        // Agregar texto en las cabeceras
        doc.fillColor('black');
        const cad = (factura.tipo == 'AQH') ? 'CONCEPTO' : 'DISBURSEMENTS/GASTOS';
        doc.text(cad, tc_x0 + 5, tc_y0 + 10, {width: tc_column_width, align: 'center'});
        doc.text('EUROS', tc_x0 + tc_column_width, tc_y0 + 10, {width: tc_2nd_column_width, align: 'center'});
    
        // Dibujar el contorno del recuadro
        doc.rect(tc_x0, tc_y0, tc_width, tc_height).stroke();
        doc.moveTo(tc_x0, tc_y0 + table_header_height).lineTo(tc_x0 + tc_width, tc_y0 + table_header_height).stroke();
        doc.moveTo(tc_x0 + tc_column_width, tc_y0).lineTo(tc_x0 + tc_column_width, tc_y0 + tc_height).stroke();
    
        // Rellenar la tabla con los conceptos de la factura...
        doc.x = marginX + 5;
        doc.y = tc_y0 + table_header_height;

        for (let i = 0; i < factura.concepto.length; i++) {
            const concepto = {
                concepto: factura.concepto[i],
                precio: factura.precio[i] || null
            }

            if (concepto.concepto !== null && concepto.concepto.trim() !== '') { 
                doc.moveDown();
                doc.x = marginX + 5;
                doc.text(concepto.concepto.toUpperCase(), {width: tc_column_width, align: 'left'});
                
                if(concepto.precio !== null) { 
                    doc.moveUp(); // a la misma altura
                    doc.x = marginX+tc_column_width;
                    // const precioFormateado = formatPrice(concepto.precio);
                    doc.text(`${formatPrice(concepto.precio)}`, {width: tc_2nd_column_width -5, align:'right'});
                } 

                if(doc.y >= summaryBreakpoint) {
                    const extendTable = () => {
                        // Add new page
                        doc.addPage();

                        // New values, same procedure
                        const tc_y0 = marginY + convertCmToPDFPoints(3.5);
                        const tc_height = doc.page.height - tc_y0 - convertCmToPDFPoints(2.5);

                        // Rellenar las cabeceras con un color de fondo
                        doc.rect(tc_x0, tc_y0, tc_column_width, table_header_height).fillColor('lightgray').fill();
                        doc.rect(tc_x0 + tc_column_width, tc_y0, tc_2nd_column_width, table_header_height).fill();

                        // Agregar texto en las cabeceras
                        doc.fillColor('black');
                        const cad = (factura.tipo == 'AQH') ? 'CONCEPTO' : 'DISBURSEMENTS/GASTOS';
                        doc.text(cad, tc_x0 + 5, tc_y0 + 10, {width: tc_column_width, align: 'center'});
                        doc.text('EUROS', tc_x0 + tc_column_width, tc_y0 + 10, {width: tc_2nd_column_width, align: 'center'});

                        // Dibujar el contorno del recuadro
                        doc.rect(tc_x0, tc_y0, tc_width, tc_height).stroke();
                        doc.moveTo(tc_x0, tc_y0 + table_header_height).lineTo(tc_x0 + tc_width, tc_y0 + table_header_height).stroke();
                        doc.moveTo(tc_x0 + tc_column_width, tc_y0).lineTo(tc_x0 + tc_column_width, tc_y0 + tc_height).stroke();

                        // Restablecer el cursor
                        doc.x = marginX + 5;
                        doc.y = tc_y0 + table_header_height;
                    };

                    extendTable();
                }
            }
        }
    
        // Summary
        doc.y = summaryBreakpoint;
        doc.text(`TOTAL DISBURSEMENTS/TOTAL GASTOS`, marginX, summaryBreakpoint, { width: tc_column_width -5, align: 'right'});
        doc.moveUp(); // Misma altura
        doc.x = marginX+tc_column_width;
        doc.text(formatPrice(factura.total_sin_iva), {width: tc_2nd_column_width -5, align:'right'});
        doc.moveDown();
        doc.x = marginX;
        doc.text(`VAT ${formatPrice(factura.iva)}% IVA ${formatPrice(factura.iva)}%`, {width: tc_column_width -5,align: 'right'});
        doc.moveUp();
        doc.x = marginX+tc_column_width;
        doc.text(formatPrice(factura.total_sin_iva * (factura.iva/100.0)), {width: tc_2nd_column_width -5, align:'right'});
        doc.moveDown();
        doc.x = marginX;
        doc.text(`TOTAL INVOICE/TOTAL FACTURA`, {width: tc_column_width -5, align: 'right'});
        doc.moveUp(); 
        doc.x = marginX+tc_column_width;
        doc.text(formatPrice(factura.total_con_iva), {width: tc_2nd_column_width -5, align:'right'});
    }

    doc.end();
};

