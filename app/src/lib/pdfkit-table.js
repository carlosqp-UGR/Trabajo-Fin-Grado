import PDFDocument from 'pdfkit-table';

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

const marginX = convertCmToPDFPoints(2.5);
const marginY = convertCmToPDFPoints(2.5);
const defaultFontSize = 11;

function createFooter(doc, page) {
    doc.x = marginX;
    doc.y = doc.page.height - convertCmToPDFPoints(1.45);

    doc.fontSize(defaultFontSize).text(`${page}`, {align: 'right'});
}

// With pdfkit-table
export const generateDatalistPDF = async (writeStream, content) => {

    // content = fakeContent;

    const pdfOptions = {
        // size: 'A4',
        size: [841.89, 595.28],
        margins: {
            top: marginY,
            bottom: convertCmToPDFPoints(1),
            left: marginX,
            right: marginX
        },
        autoFirstPage: false,
        compress: true
    };

    const doc = new PDFDocument(pdfOptions);
    doc.pipe(writeStream);

    /// Metadata
    const currentDate = new Date();
    const date = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    doc.info.Title = `AQH-Listado-${date}`;
    doc.info.Author = 'Andres Quesada e Hijos S.A.';
    let page = 0;

    /// Cabecera y footer
    doc.on('pageAdded', () => {

        doc.font('Helvetica');
        doc.fontSize(defaultFontSize);
        // doc.lineGap(10);

        page++;
        createFooter(doc, page);
        
        // Restablecer la fuente y el tamaño
        doc.font('Helvetica');
        doc.fontSize(defaultFontSize);
        // doc.lineGap(10);

        // Restablecer el cursor en el principio de la pagina y valores por defecto
        doc.x = marginX;
        doc.y = marginY;
    });

    doc.addPage();
    doc.font('Helvetica-Oblique');
    doc.text(content.description);
    doc.moveDown();
    doc.moveDown();

    const keys = Object.keys(content.data[0]);
    const keysUppercase = [];
    keys.forEach(key => {
        keysUppercase.push(key.toUpperCase());
    });
    const values = [];
    content.data.forEach(entry => {
        const aux = [];
        for (let i = 0; i < keys.length; i++) {
            const value = entry[keys[i]];
            let text;
            if (typeof value === 'string') {
                text = value.trim() ? value.toUpperCase() : ' ';
            } else if (!isNaN(parseFloat(value))) {
                text = formatPrice(value);
            } else {
                text = ' ';
            }
            aux.push(text);
        }
        values.push(aux);
    });

    const tableArray = {
        headers: keysUppercase,
        rows: values
    };

    doc.table( tableArray, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(11),
        prepareRow: () => doc.font("Helvetica").fontSize(10),
    });

    // Resumen
    doc.font("Helvetica").fontSize(defaultFontSize);
    doc.x = marginX;
    doc.moveDown();
    
    const totalRegistros = content.data.length;
    doc.text(`Número de registros: ${totalRegistros}`);
    if(content.hasOwnProperty('total') && content.hasOwnProperty('labelTotal')) {
        doc.moveDown();
        doc.text(`${content.labelTotal}: ${content.total}`);
    }

    doc.end();
}
