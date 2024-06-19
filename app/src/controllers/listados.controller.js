import stream from 'stream';
import { generateDatalistPDF } from "../lib/pdfkit-table.js";

export const generateListPDF = async (req, res, next) => {
    try {
        const data = JSON.parse(req.body.data);
    
        // For filename
        // Crear una instancia de Date con la fecha y hora actual
        const currentDate = new Date();
    
        // Obtener los componentes de la fecha actual
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
    
        // Formatear la fecha en el formato deseado (YYYY-MM-DD)
        const formattedDate = `${year}-${month}-${day}`;
    
        // Set the response headers for a PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=AQH-Listado-${formattedDate}.pdf`);
    
        // Crear un stream PassThrough
        const bufferStream = new stream.PassThrough();
    
        // Crea el pdf
        await generateDatalistPDF(bufferStream, data);
    
        // Pipe el contenido del stream PassThrough a la respuesta
        res.status(201);
        bufferStream.pipe(res); 
    
      } catch(e) {
        console.error(e),
        next(e);
        // res.status(500).send('Ocurrió un error al procesar la solicitud.');
    }
};

export const renderScaleList = async (req, res, next) => {
    const apiSugerencias = '/api/estancia-de-buque';
    const apiUrl = '/api/list/escalas';
    const printUrl = req.baseUrl + '/gen-pdf-list';
    res.render('listados/listado-escalas', {
      apiUrl,
      printUrl,
      apiSugerencias
    });
};

export const renderInvoiceList = async (req, res, next) => {
    const apiSugerencias = '/api/facturas';
    const apiUrl = '/api/list/facturas';
    const printUrl = req.baseUrl + '/gen-pdf-list';
    res.render('listados/listado-facturas', {
      apiUrl,
      printUrl,
      apiSugerencias,
    });
};
