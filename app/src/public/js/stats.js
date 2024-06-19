// Requires chart.js, ajax

// Load lib
if (window.Chart) {
    console.log('Chart.js se ha cargado correctamente.');
} else {
    console.error('Error al cargar Chart.js');
}

////////////////////////////////////////////////////////////////////////
/// Generic functions
////////////////////////////////////////////////////////////////////////

// Requires AJAX module
async function ajaxFetch(url) {
  try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return await response.json();
	} catch (error) {
		throw error;
	}
}

function formatMinutes(minutes) {
  // Calcular días, horas y minutos
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes =  Math.floor(minutes % 60);

  // Crear la cadena formateada
  let formattedString = '';
  if (days > 0) {
      formattedString += `${days}d `;
  }
  if (hours > 0) {
      formattedString += `${hours}h `;
  }
  if (remainingMinutes > 0) {
      formattedString += `${remainingMinutes}min`;
  }

  return formattedString.trim();
}

// Create error or inform message 
function messageToggle(messageId, emptyData) {
	const messageElement = document.getElementById(messageId);
	var rowDiv = document.createElement("div");
	rowDiv.classList.add("row", "justify-content-center");
	var alertDiv = document.createElement("div");
	alertDiv.classList.add("alert", "alert-primary", "alert-dismissible", "fade", "show");
	alertDiv.setAttribute("role", "alert");
	
	let message = `No se pudieron generar las estadísticas, inténtelo de nuevo.`;
	if(emptyData) message =  `No hay datos para esos filtros. Inténtelo de nuevo con otros valores`;

	alertDiv.innerHTML = `<i class="me-2 bi bi-info-circle"></i> ${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;

	rowDiv.appendChild(alertDiv);
	messageElement.appendChild(rowDiv);
}

// Appends a chart to parent element
function createChart(parentElement, canvasId, chart) {
	const chartType = chart.type;
	let chartSize=12;
	if(chartType==='pie' || chartType==='doughnut' || chartType==='polarArea') chartSize=8;

	/// Prepare HTML
	var row = document.createElement("div");
	row.classList.add("row", "justify-content-center", "m-4");
	var col = document.createElement("div");
	col.classList.add(`col-${chartSize}`);
	var cnv = document.createElement("canvas");
	cnv.setAttribute("id", canvasId);
	col.appendChild(cnv);
	row.appendChild(col);
	parentElement.appendChild(row);

	/// Paint chart
	var context = cnv.getContext('2d');
	// Obtener el gráfico existente por su ID (el ID del canvas)
	var existingChart = Chart.getChart(canvasId);
	if (existingChart) {
		existingChart.destroy();
	}
	new Chart(context, chart);
}

// Generates pdf button
function createPDFButton(parentElement, data, url) {
	var rowDiv = document.createElement("div");
	rowDiv.classList.add("row", "justify-content-end");
	var colDiv = document.createElement("div");
	colDiv.classList.add("col-auto", "my-3");

	var button = document.createElement("input");
	button.type = "submit";
	button.classList.add("btn", "btn-primary");
	button.value = "Listado";

	// Agregar un evento de clic al botón
	button.onclick = function() {// Crear un formulario para enviar los datos
		var form = document.createElement("form");
		form.method = "POST";
		form.action = url;
		form.target = "_blank"; // Abrir en una nueva pestaña

		// Crear un input oculto para los datos y agregarlo al formulario
		var inputData = document.createElement("input");
		inputData.type = "hidden";
		inputData.name = "data";
		inputData.value = JSON.stringify(data); // Convertir la matriz de objetos a JSON
		form.appendChild(inputData);

		// Agregar el formulario al documento y enviarlo
		document.body.appendChild(form);
		form.submit();
		document.body.removeChild(form); // Eliminar el formulario después de enviarlo
	};

	colDiv.appendChild(button);
	rowDiv.appendChild(colDiv);
	parentElement.appendChild(rowDiv);
}

////////////////////////////////////////////////////////////////////////
/// Data processing functions
////////////////////////////////////////////////////////////////////////

// function getDistinctValues(data, key) {
//   const distinctValues = new Set();
//   data.forEach(entry => {
//       distinctValues.add(entry[key]);
//   });
//   return Array.from(distinctValues);
// }

function generateDataset(data, xKey, yKey) {
	const processedData = [];
	data.forEach(entry => {
		processedData.push({x: entry[xKey], y: entry[yKey]});
	});
	return processedData;
}

function generatePieDataset(data, xKey, yKey) {
    const labels = [];
    const dataValues = [];

    data.forEach(item => {
        labels.push(item[xKey]);
        dataValues.push(item[yKey]);
    });

	const pieDataset = {
		labels: labels,
		datasets: [{data: dataValues}]
	};

	return pieDataset;
}

////////////////////////////////////////////////////////////////////////
/// Specific from estadisticas/cliente
////////////////////////////////////////////////////////////////////////

// (1)
async function statsClientByType (event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	
	// Build api request
	const url = `${apiUrl}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart10";
	const xKey = 'tipo';
	const yKey = 'numero';
	const pieDataset = generatePieDataset(response, xKey, yKey);

	const chart = {
		type: chartType,
		data: pieDataset,
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Total de clientes clasificados por tipo',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
				legend: {
					display: true, // Mostrar la leyenda
					position: 'right' // Posición de la leyenda (arriba, abajo, izquierda, derecha)
				},
				animation: {
					duration: 1000,
					easing: 'easeInOutQuart'
				}
			}
		}
	}

	// Crear chart
	createChart(parentElement, canvasId, chart);

	// Crear el boton para imprimir
	const contentPDF = {
		description: 'Total de clientes clasificados por tipo',
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (2) 
async function statsClientByOrigin (event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const url = `${apiUrl}?${params.toString()}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart20";
	const xKey = 'pais';
	const yKey = 'numero_clientes';

	let chart = {};
	if(chartType==='pie' || chartType==='doughnut' || chartType==='polarArea') {
		const pieDataset = generatePieDataset(response, xKey, yKey);
		chart = {
			type: chartType,
			data: pieDataset,
			options: {
				plugins: {
					title: {
						display: true,
						text: 'Total de clientes por país',
						font: {
							size: 18,
							lineHeight: 2,
						},
						align: 'start',
					},
					legend: {
						display: true, // Mostrar la leyenda
						position: 'right' // Posición de la leyenda (arriba, abajo, izquierda, derecha)
					},
					animation: {
						duration: 1000,
						easing: 'easeInOutQuart'
					}
				}
			}
		};
	} else {
		const data = generateDataset(response, xKey, yKey);

		chart = {        
			type: chartType,
			data: {
				datasets:[{
						label: 'Total',
						data: data,
						hidden: false,
						fill: true
					}]
			},
			options: {
				plugins: {
					title: {
						display: true,
						text: 'Total de clientes por país',
						font: {
							size: 18,
							lineHeight: 2,
						},
						align: 'start',
	
					},
				},
				elements: {
					line: {
						borderCapStyle: 'round',
						tension: 0.5 // Controla la curvatura de la línea (0 = líneas rectas, 1 = líneas suavizadas)
					}
				},
				scales: {
					x: {
						// beginAtZero: true,
						title: {
							display: true,
							text: 'País',
							align: 'end'
						},
						border: {
							display: true,
							width: 5,
						}
					},
					y: {
						type: 'linear',
						beginAtZero: true, // Empezar el eje Y en cero
						title: {
							display: true,
							text: 'Número de clientes',
							align: 'end'
						},
						border: {
							display: true,
							width: 5,
						},                
					}
				},
			}
		};

	}

	createChart(parentElement, canvasId, chart);

	// Crear descripcion
	let description_head = 'Listado paises de procedencia (de clientes)';
	let description_body = '';
	if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
	if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
	if (!(!formData.get('puerto_filter') || formData.get('puerto_filter').trim() ==='' )) description_body += `, puerto ${formData.get('puerto_filter').trim().toUpperCase()}`;
	let description = description_head;
	if(description_body.trim()!=='') {
		if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
	}
	
	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (3) 
async function statsClientScalesByDate (event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const url = `${apiUrl}?${params.toString()}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart30";
	const xKey = 'fecha';

	const chart = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Toneladas totales',
					data: generateDataset(response, xKey, 'total_carga'),
					hidden: false,
					fill: false
				},
				{
					label: 'Promedio toneladas por escala',
					data: generateDataset(response, xKey, 'promedio_carga_escala'),
					hidden: false,
					fill: false
				},
				{
					label: 'Número de Escalas',
					data: generateDataset(response, xKey, 'numero_escalas'),
					hidden: true,
					fill: false
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Toneladas cargadas por fecha',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Fecha',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasId, chart);

    // Crear descripcion
	let description_head = 'Listado de Escalas por Fecha';
    let description_body = '';
    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('puerto_filter') || formData.get('puerto_filter').trim() ==='' )) description_body += `, puerto ${formData.get('puerto_filter').trim().toUpperCase()}`;
    if (!(!formData.get('material_filter') || formData.get('material_filter').trim() ==='' )) description_body += `, material ${formData.get('material_filter').trim().toUpperCase()}`;
    if (!(!formData.get('cliente_filter') || formData.get('cliente_filter').trim() ==='' )) description_body += `, cliente ${formData.get('cliente_filter').trim().toUpperCase()}`;
    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
    }

	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (4) 
async function statsScalesByClients (event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const url = `${apiUrl}?${params.toString()}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart40";
	const xKey = 'cliente';

	const chart = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Toneladas totales',
					data: generateDataset(response, xKey, 'total_carga'),
					hidden: false,
					fill: false
				},
				{
					label: 'Promedio toneladas por escala',
					data: generateDataset(response, xKey, 'promedio_carga_escala'),
					hidden: false,
					fill: false
				},
				{
					label: 'Número de Escalas',
					data: generateDataset(response, xKey, 'numero_escalas'),
					hidden: true,
					fill: false
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Toneladas Cargadas por Cliente',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Cliente',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasId, chart);

    // Crear descripcion
	let description_head = 'Listado de escalas y carga general por cliente';
    let description_body = '';
    if (!(!formData.get('tipo_cliente_filter') || formData.get('tipo_cliente_filter').trim() ==='' )) description_body += `, tipo de cliente ${formData.get('tipo_cliente_filter').trim().toUpperCase()}`;
    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('puerto_filter') || formData.get('puerto_filter').trim() ==='' )) description_body += `, puerto ${formData.get('puerto_filter').trim().toUpperCase()}`;
    if (!(!formData.get('material_filter') || formData.get('material_filter').trim() ==='' )) description_body += `, material ${formData.get('material_filter').trim().toUpperCase()}`;
    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
    }

	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (5) 
async function statsClientDestination (event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const url = `${apiUrl}?${params.toString()}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart50";
	const xKey = 'destino';

	const chart = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Total toneladas',
					data: generateDataset(response, xKey, 'total_carga'),
					hidden: false,
					fill: false
				},
				{
					label: 'Promedio toneladas por escala',
					data: generateDataset(response, xKey, 'promedio_carga_escala'),
					hidden: false,
					fill: false
				},
				{
					label: 'Número de Escalas',
					data: generateDataset(response, xKey, 'numero_escalas'),
					hidden: true,
					fill: false
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Estadísticas globales por destino de escala',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Destino',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasId, chart);

    // Crear descripcion
	let description_head = 'Listado de escalas y carga general por Destino';
    let description_body = '';
    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('puerto_filter') || formData.get('puerto_filter').trim() ==='' )) description_body += `, puerto ${formData.get('puerto_filter').trim().toUpperCase()}`;
    if (!(!formData.get('material_filter') || formData.get('material_filter').trim() ==='' )) description_body += `, material ${formData.get('material_filter').trim().toUpperCase()}`;
    if (!(!formData.get('cliente_filter') || formData.get('cliente_filter').trim() ==='' )) description_body += `, cliente ${formData.get('cliente_filter').trim().toUpperCase()}`;
    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
    }

	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (6) 
async function statsClientTimes (event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const url = `${apiUrl}?${params.toString()}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart60";
	const xKey = 'cliente';

	const chart = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Velocidad promedio de carga (toneladas/hora)',
					data: generateDataset(response, xKey, 'promedio_velocidad_carga'),
					hidden: false,
					fill: false
				},
				{
					label: 'Tiempo total de escalas (minutos)',
					data: generateDataset(response, xKey, 'total_minutos_escala'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo promedio de escala (minutos/escala)',
					data: generateDataset(response, xKey, 'promedio_minutos_escala'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo total en Fondeadero (minutos)',
					data: generateDataset(response, xKey, 'total_minutos_fondeadero'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo promedio en Fondeadero (minutos/escala)',
					data: generateDataset(response, xKey, 'promedio_minutos_fondeadero_escala'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo total en Puerto (minutos)',
					data: generateDataset(response, xKey, 'total_minutos_puerto'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo promedio en Puerto (minutos/escala)',
					data: generateDataset(response, xKey, 'promedio_minutos_puerto_escala'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo total de Carga (minutos)',
					data: generateDataset(response, xKey, 'total_minutos_carga'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo promedio en Carga (minutos/escala)',
					data: generateDataset(response, xKey, 'promedio_minutos_carga_escala'),
					hidden: true,
					fill: false
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Estadísticas de tiempo por Cliente',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Cliente',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasId, chart);

    // Crear descripcion
	let description_head = 'Estadísticas de tiempo por Escala';
    let description_body = '';
    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('puerto_filter') || formData.get('puerto_filter').trim() ==='' )) description_body += `, puerto ${formData.get('puerto_filter').trim().toUpperCase()}`;
    if (!(!formData.get('material_filter') || formData.get('material_filter').trim() ==='' )) description_body += `, material ${formData.get('material_filter').trim().toUpperCase()}`;
    if (!(!formData.get('tipo_cliente_filter') || formData.get('tipo_cliente_filter').trim() ==='' )) description_body += `, tipo de cliente ${formData.get('tipo_cliente_filter').trim().toUpperCase()}`;
    if (!(!formData.get('cliente_filter') || formData.get('cliente_filter').trim() ==='' )) description_body += `, cliente ${formData.get('cliente_filter').trim().toUpperCase()}`;
    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
    }

	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (7) 
async function statsClientInvoiceByDate (event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const url = `${apiUrl}?${params.toString()}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart70";
	const xKey = 'fecha';

	const chart = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Total con IVA (€)',
					data: generateDataset(response, xKey, 'total_con_iva'),
					hidden: false,
					fill: false
				},
				{
					label: 'Total sin IVA (€)',
					data: generateDataset(response, xKey, 'total_sin_iva'),
					hidden: false,
					fill: false
				},
				{
					label: 'Número de facturas',
					data: generateDataset(response, xKey, 'numero_facturas'),
					hidden: true,
					fill: false
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Facturación en función de fecha',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Fecha',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasId, chart);

    // Crear descripcion
	let description_head = 'Facturación general según Fecha ';
    let description_body = '';
    if (!(!formData.get('tipo_factura_filter') || formData.get('tipo_factura_filter').trim() ==='' )) description_body += `, tipo de factura ${formData.get('tipo_factura_filter').trim().toUpperCase()}`;
    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('cliente_filter') || formData.get('cliente_filter').trim() ==='' )) description_body += `, cliente ${formData.get('cliente_filter').trim().toUpperCase()}`;

    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
    }

	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (8) 
async function statsClientInvoiceGlobal (event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const url = `${apiUrl}?${params.toString()}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart80";
	const xKey = 'cliente';

	const chart = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Total neto (€)',
					data: generateDataset(response, xKey, 'total_neto_factura'),
					hidden: false,
					fill: false
				},
				{
					label: 'Total bruto (€)',
					data: generateDataset(response, xKey, 'total_bruto_factura'),
					hidden: false,
					fill: false
				},
				{
					label: 'Promedio neto por factura (€)',
					data: generateDataset(response, xKey, 'promedio_neto_factura'),
					hidden: true,
					fill: false
				},				{
					label: 'Promedio bruto por factura (€)',
					data: generateDataset(response, xKey, 'promedio_bruto_factura'),
					hidden: true,
					fill: false
				},
				{
					label: 'Número de facturas',
					data: generateDataset(response, xKey, 'numero_facturas'),
					hidden: true,
					fill: false
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Facturación en función de cliente',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Clientes',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasId, chart);

    // Crear descripcion
	let description_head = 'Facturación general según Cliente ';
    let description_body = '';
    if (!(!formData.get('tipo_factura_filter') || formData.get('tipo_factura_filter').trim() ==='' )) description_body += `, tipo de factura ${formData.get('tipo_factura_filter').trim().toUpperCase()}`;
    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('cliente_filter') || formData.get('cliente_filter').trim() ==='' )) description_body += `, cliente ${formData.get('cliente_filter').trim().toUpperCase()}`;

    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
    }

	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// Other specific functions here...

////////////////////////////////////////////////////////////////////////
/// Specific from estadisticas/buque
////////////////////////////////////////////////////////////////////////

// (1)
async function statsVesselGeneric (event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const url = `${apiUrl}?${params.toString()}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart10";
	const xKey = 'buque';

	const chart = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Tonelaje Registro Bruto (toneladas)',
					data: generateDataset(response, xKey, 'trb'),
					hidden: false,
					fill: false
				},
				{
					label: 'Tonelaje Registro Neto (toneladas)',
					data: generateDataset(response, xKey, 'trn'),
					hidden: false,
					fill: false
				},
				{
					label: 'Eslora (m)',
					data: generateDataset(response, xKey, 'eslora'),
					hidden: false,
					fill: false
				},				{
					label: 'Calado (m)',
					data: generateDataset(response, xKey, 'calado'),
					hidden: false,
					fill: false
				},
				{
					label: 'Manga (m)',
					data: generateDataset(response, xKey, 'manga'),
					hidden: false,
					fill: false
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Especificaciones técnicas de buques',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Buques',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasId, chart);

    // Crear descripcion
	let description_head = 'Especificaciones técnicas';
    let description_body = '';
    if (!(!formData.get('buque_filter') || formData.get('buque_filter').trim() ==='' )) description_body += `, buque ${formData.get('buque_filter').trim().toUpperCase()}`;

    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
    }

	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (2)
async function statsVesselByFlag(event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);

	const url = `${apiUrl}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart20";
	const xKey = 'bandera';
	const yKey = 'numero_buques';

	let chart = {};
	if(chartType==='pie' || chartType==='doughnut' || chartType==='polarArea') {
		const pieDataset = generatePieDataset(response, xKey, yKey);
		chart = {
			type: chartType,
			data: pieDataset,
			options: {
				plugins: {
					title: {
						display: true,
						text: 'Total de clientes por país',
						font: {
							size: 18,
							lineHeight: 2,
						},
						align: 'start',
					},
					legend: {
						display: true, // Mostrar la leyenda
						position: 'right' // Posición de la leyenda (arriba, abajo, izquierda, derecha)
					},
					animation: {
						duration: 1000,
						easing: 'easeInOutQuart'
					}
				}
			}
		};
	} else {
		const data = generateDataset(response, xKey, yKey);

		chart = {        
			type: chartType,
			data: {
				datasets:[{
						label: 'Número de Buques',
						data: data,
						hidden: false,
						fill: true
					}]
			},
			options: {
				plugins: {
					title: {
						display: true,
						text: 'Total de buques por país',
						font: {
							size: 18,
							lineHeight: 2,
						},
						align: 'start',
	
					},
				},
				elements: {
					line: {
						borderCapStyle: 'round',
						tension: 0.5 // Controla la curvatura de la línea (0 = líneas rectas, 1 = líneas suavizadas)
					}
				},
				scales: {
					x: {
						// beginAtZero: true,
						title: {
							display: true,
							text: 'Bandera',
							align: 'end'
						},
						border: {
							display: true,
							width: 5,
						}
					},
					y: {
						type: 'linear',
						beginAtZero: true, // Empezar el eje Y en cero
						title: {
							display: true,
							text: 'Número de clientes',
							align: 'end'
						},
						border: {
							display: true,
							width: 5,
						},                
					}
				},
			}
		};

	}

	createChart(parentElement, canvasId, chart);

    // Crear descripcion
	let description_head = 'Especificaciones técnicas';
    let description_body = '';
    if (!(!formData.get('buque_filter') || formData.get('buque_filter').trim() ==='' )) description_body += `, buque ${formData.get('buque_filter').trim().toUpperCase()}`;

    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
    }

	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (3)
async function statsVesselScalesByDate(event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const url = `${apiUrl}?${params.toString()}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart30";
	const xKey = 'fecha';

	const chart = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Total carga (toneladas)',
					data: generateDataset(response, xKey, 'total_carga'),
					hidden: false,
					fill: false
				},
				{
					label: 'Promedio de carga (toneladas/escala)',
					data: generateDataset(response, xKey, 'promedio_carga_escala'),
					hidden: false,
					fill: false
				},
				{
					label: 'Número de escalas',
					data: generateDataset(response, xKey, 'numero_escalas'),
					hidden: true,
					fill: false
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Escalas y Carga en función de Fecha',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Fecha',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasId, chart);

	// Descripcion
	let description_head = 'Listado de Escalas por Fecha';
    let description_body = '';
    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('puerto_filter') || formData.get('puerto_filter').trim() ==='' )) description_body += `, puerto ${formData.get('puerto_filter').trim().toUpperCase()}`;
    if (!(!formData.get('material_filter') || formData.get('material_filter').trim() ==='' )) description_body += `, material ${formData.get('material_filter').trim().toUpperCase()}`;
    if (!(!formData.get('buque_filter') || formData.get('buque_filter').trim() ==='' )) description_body += `, buque ${formData.get('buque_filter').trim().toUpperCase()}`;
    if (!(!formData.get('armador_filter') || formData.get('armador_filter').trim() ==='' )) description_body += `, armador ${formData.get('armador_filter').trim().toUpperCase()}`;
    if (!(!formData.get('cargador_filter') || formData.get('cargador_filter').trim() ==='' )) description_body += `, cargador ${formData.get('cargador_filter').trim().toUpperCase()}`;
    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
    }

	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (4)
async function statsScalesByVessels(event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const url = `${apiUrl}?${params.toString()}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart40";
	const xKey = 'buque';

	const chart = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Total carga (toneladas)',
					data: generateDataset(response, xKey, 'total_carga'),
					hidden: false,
					fill: false
				},
				{
					label: 'Promedio de carga (toneladas/escala)',
					data: generateDataset(response, xKey, 'promedio_carga_escala'),
					hidden: false,
					fill: false
				},
				{
					label: 'Número de escalas',
					data: generateDataset(response, xKey, 'numero_escalas'),
					hidden: true,
					fill: false
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Escalas y Carga en función de Buque',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Buque',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasId, chart);

	// Descripcion
	let description_head = 'Carga por Buque';
    let description_body = '';
    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('puerto_filter') || formData.get('puerto_filter').trim() ==='' )) description_body += `, puerto ${formData.get('puerto_filter').trim().toUpperCase()}`;
    if (!(!formData.get('material_filter') || formData.get('material_filter').trim() ==='' )) description_body += `, material ${formData.get('material_filter').trim().toUpperCase()}`;
    if (!(!formData.get('buque_filter') || formData.get('buque_filter').trim() ==='' )) description_body += `, buque ${formData.get('buque_filter').trim().toUpperCase()}`;
    if (!(!formData.get('armador_filter') || formData.get('armador_filter').trim() ==='' )) description_body += `, armador ${formData.get('armador_filter').trim().toUpperCase()}`;
    if (!(!formData.get('cargador_filter') || formData.get('cargador_filter').trim() ==='' )) description_body += `, cargador ${formData.get('cargador_filter').trim().toUpperCase()}`;
    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
    }

	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (5)
async function statsVesselScalesTime(event, parentId, messageId, formId, apiUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const url = `${apiUrl}?${params.toString()}`;

	var response;
	try {
		response = await ajaxFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	const chartType = formData.get('chart_type')	// specific chart params
	const canvasId = "myChart50";
	const xKey = 'buque';

	const chart = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Velocidad promedio de carga (toneladas/hora)',
					data: generateDataset(response, xKey, 'promedio_velocidad_carga'),
					hidden: false,
					fill: false
				},
				{
					label: 'Tiempo total de escalas (minutos)',
					data: generateDataset(response, xKey, 'total_minutos_escala'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo promedio de escala (minutos/escala)',
					data: generateDataset(response, xKey, 'promedio_minutos_escala'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo total en Fondeadero (minutos)',
					data: generateDataset(response, xKey, 'total_minutos_fondeadero'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo promedio en Fondeadero (minutos/escala)',
					data: generateDataset(response, xKey, 'promedio_minutos_fondeadero_escala'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo total en Puerto (minutos)',
					data: generateDataset(response, xKey, 'total_minutos_puerto'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo promedio en Puerto (minutos/escala)',
					data: generateDataset(response, xKey, 'promedio_minutos_puerto_escala'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo total de Carga (minutos)',
					data: generateDataset(response, xKey, 'total_minutos_carga'),
					hidden: true,
					fill: false
				},
				{
					label: 'Tiempo promedio en Carga (minutos/escala)',
					data: generateDataset(response, xKey, 'promedio_minutos_carga_escala'),
					hidden: true,
					fill: false

				}			
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Tiempos de Escala por Buque',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Buques',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasId, chart);

	// Descripcion
	let description_head = 'Tiempos de Escala';
    let description_body = '';
    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('puerto_filter') || formData.get('puerto_filter').trim() ==='' )) description_body += `, puerto ${formData.get('puerto_filter').trim().toUpperCase()}`;
    if (!(!formData.get('material_filter') || formData.get('material_filter').trim() ==='' )) description_body += `, material ${formData.get('material_filter').trim().toUpperCase()}`;
    if (!(!formData.get('buque_filter') || formData.get('buque_filter').trim() ==='' )) description_body += `, buque ${formData.get('buque_filter').trim().toUpperCase()}`;
    if (!(!formData.get('armador_filter') || formData.get('armador_filter').trim() ==='' )) description_body += `, armador ${formData.get('armador_filter').trim().toUpperCase()}`;
    if (!(!formData.get('cargador_filter') || formData.get('cargador_filter').trim() ==='' )) description_body += `, cargador ${formData.get('cargador_filter').trim().toUpperCase()}`;
    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(2);
        }
        description += ' (' + description_body + ')';
    }

	// Crear el boton para imprimir
	const contentPDF = {
		description,
		data: response
	};

	createPDFButton(parentElement, contentPDF, printUrl);
}

// (6)
async function statsVesselScalesOriginDestination(event, parentId, messageId, formId, apiOriginUrl, apiDestinationUrl, printUrl) {
	event.preventDefault();

	const parentElement = document.getElementById(parentId);
	parentElement.innerHTML = '';
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const params = new URLSearchParams(formData);

	const urlOrigin = `${apiOriginUrl}?${params.toString()}`;
	const urlDest = `${apiDestinationUrl}?${params.toString()}`;
	var responseOrigin;
	var responseDest;
	try {
		responseOrigin = await ajaxFetch(urlOrigin);
		responseDest = await ajaxFetch(urlDest);

		if(responseOrigin.length === 0 || responseDest.length===0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
	} catch (e) {
		// console.error(e);
		if(e.code==='NO_DATA') messageToggle(messageId, true);
		else messageToggle(messageId, false);
		return;
	}

	// Crear tabla y boton para gráfico de origen de buques
	const chartType = formData.get('chart_type')	// specific chart params
	const canvasOriginId = "myChart60";
	const xKeyOrigin = 'origen';

	const chartOrigin = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Total carga (toneladas)',
					data: generateDataset(responseOrigin, xKeyOrigin, 'total_carga'),
					hidden: false,
					fill: false
				},
				{
					label: 'Promedio de carga (toneladas/escala)',
					data: generateDataset(responseOrigin, xKeyOrigin, 'promedio_carga_escala'),
					hidden: false,
					fill: false
				},
				{
					label: 'Número de escalas',
					data: generateDataset(responseOrigin, xKeyOrigin, 'numero_escalas'),
					hidden: true,
					fill: false
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Carga por Puerto de Origen',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Puerto (Origen)',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasOriginId, chartOrigin);

	// Descripcion
	let originDescriptionHead = 'Carga por Puerto de Origen';
    let originDescriptionBody = '';
    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) originDescriptionBody += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) originDescriptionBody += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('puerto_filter') || formData.get('puerto_filter').trim() ==='' )) originDescriptionBody += `, puerto ${formData.get('puerto_filter').trim().toUpperCase()}`;
    if (!(!formData.get('material_filter') || formData.get('material_filter').trim() ==='' )) originDescriptionBody += `, material ${formData.get('material_filter').trim().toUpperCase()}`;
    if (!(!formData.get('buque_filter') || formData.get('buque_filter').trim() ==='' )) originDescriptionBody += `, buque ${formData.get('buque_filter').trim().toUpperCase()}`;
	let originDescription = originDescriptionHead;
    if(originDescriptionBody.trim()!=='') {
        if(originDescriptionBody.startsWith(',')) {
            originDescriptionBody = originDescriptionBody.substring(2);
        }
        originDescription += ' (' + originDescriptionBody + ')';
    }

	// Crear el boton para imprimir
	const originContentPDF = {
		description: originDescription,
		data: responseOrigin
	};

	createPDFButton(parentElement, originContentPDF, printUrl);

	// Crear tabla y boton para gráfico de destino de buques
	const canvasDestId = "myChart61";
	const xKeyDest = 'destino';

	const chartDest = {        
		type: chartType,
		data: {
			datasets:[
				{
					label: 'Total carga (toneladas)',
					data: generateDataset(responseDest, xKeyDest, 'total_carga'),
					hidden: false,
					fill: false
				},
				{
					label: 'Promedio de carga (toneladas/escala)',
					data: generateDataset(responseDest, xKeyDest, 'promedio_carga_escala'),
					hidden: false,
					fill: false
				},
				{
					label: 'Número de escalas',
					data: generateDataset(responseDest, xKeyDest, 'numero_escalas'),
					hidden: true,
					fill: false
				}
			]
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Carga por Puerto de Destino',
					font: {
						size: 18,
						lineHeight: 2,
					},
					align: 'start',
				},
			},
			elements: {
				line: {
					borderCapStyle: 'round',
					tension: 0.5
				}
			},
			scales: {
				x: {
					// beginAtZero: true,
					title: {
						display: true,
						text: 'Puerto (Destino)',
						align: 'end'
					},
					border: {
						display: true,
						width: 5,
					}
				},
				y: {
					type: 'linear',
					beginAtZero: true, // Empezar el eje Y en cero
					// title: {
					// 	display: true,
					// 	text: 'Toneladas',
					// 	align: 'end'
					// },
					border: {
						display: true,
						width: 5,
					},                
				}
			},
		}
	};

	createChart(parentElement, canvasDestId, chartDest);

	// Descripcion
	let destDescriptionHead = 'Carga por Puerto de Destino';
	let destDescriptionBody = '';
	if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) destDescriptionBody += `, desde ${formData.get('min_date_filter').trim()}`;
	if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) destDescriptionBody += `, hasta ${formData.get('max_date_filter').trim()}`;
	if (!(!formData.get('puerto_filter') || formData.get('puerto_filter').trim() ==='' )) destDescriptionBody += `, puerto ${formData.get('puerto_filter').trim().toUpperCase()}`;
	if (!(!formData.get('material_filter') || formData.get('material_filter').trim() ==='' )) destDescriptionBody += `, material ${formData.get('material_filter').trim().toUpperCase()}`;
	if (!(!formData.get('buque_filter') || formData.get('buque_filter').trim() ==='' )) destDescriptionBody += `, buque ${formData.get('buque_filter').trim().toUpperCase()}`;
	let destDescription = destDescriptionHead;
	if(destDescriptionBody.trim()!=='') {
		if(destDescriptionBody.startsWith(',')) {
			destDescriptionBody = destDescriptionBody.substring(2);
		}
		destDescription += ' (' + destDescriptionBody + ')';
	}

	// Crear el boton para imprimir
	const destContentPDF = {
		description: destDescription,
		data: responseDest
	};

	createPDFButton(parentElement, destContentPDF, printUrl);
}
