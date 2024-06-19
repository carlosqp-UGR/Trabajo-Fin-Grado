/**
 * 
 * @param {*} element_id HTML element id
 * @param {int>0} currentPage 
 * @param {int>0} totalPages 
 */
function createPaginationNav(element_id, currentPage,totalPages) {

    // Obtener el elemento por su id
    var paginationOptions = document.getElementById(element_id); // 'pagination-options'

    // Vaciar el contenido actual del elemento
    paginationOptions.innerHTML = '';

    if(totalPages<=1) {
        paginationOptions.innerHTML = 
            `<li class="page-item">
                <button type="submit" class="page-link disabled" name="page" aria-label="Anterior">
                    <span aria-hidden="true">&laquo;</span> 
                </button> 
            </li>
            <li class="page-item active">
                <button type="submit" class="page-link" name="page" value="1">1</button>
            </li>
            <li class="page-item">
                <button class="page-link disabled" name="page" aria-label="Siguiente">
                    <span aria-hidden="true">&raquo;</span> 
                </button>
            </li>`;
    } else if (totalPages==2) {
        if(currentPage<=1) {
            paginationOptions.innerHTML =
            `<li class="page-item">
                <button type="submit" class="page-link disabled" name="page" aria-label="Anterior">
                    <span aria-hidden="true">&laquo;</span> 
                </button> 
            </li>
            <li class="page-item">
                <button type="submit" class="page-link active" name="page" value="1">1</button>
            </li>
            <li class="page-item">
                <button type="submit" class="page-link" name="page" value="2">2</button>
            </li>
            <li class="page-item">
                <button class="page-link" name="page" value="2" aria-label="Siguiente">
                    <span aria-hidden="true">&raquo;</span> 
                </button>
            </li>`;
        } else {    // Current Page >=2
            paginationOptions.innerHTML =
            `<li class="page-item">
                <button type="submit" class="page-link" name="page" value="1" aria-label="Anterior">
                    <span aria-hidden="true">&laquo;</span> 
                </button> 
            </li>
            <li class="page-item">
                <button type="submit" class="page-link" name="page" value="1">1</button>
            </li>
            <li class="page-item">
                <button type="submit" class="page-link active" name="page" value="2">2</button>
            </li>
            <li class="page-item">
                <button class="page-link disabled" name="page" value="2" aria-label="Siguiente">
                    <span aria-hidden="true">&raquo;</span> 
                </button>
            </li>`;
        }
    } else {    // Total pages > 2
        if(currentPage<=1) {    // Es la primera página
            paginationOptions.innerHTML =
            `<li class="page-item">
                <button type="submit" class="page-link disabled" name="page" aria-label="Anterior">
                    <span aria-hidden="true">&laquo;</span> 
                </button> 
            </li>
            <li class="page-item">
                <button type="submit" class="page-link active" name="page" value="${currentPage}">${currentPage}</button>
            </li>
            <li class="page-item">
                <button type="submit" class="page-link" name="page" value="${currentPage+1}">${currentPage+1}</button>
            </li>
            <li class="page-item">
                <button type="submit" class="page-link" name="page" value="${currentPage+2}">${currentPage+2}</button>
            </li>
            <li class="page-item">
                <button class="page-link" name="page" value="${currentPage+2}" aria-label="Siguiente">
                    <span aria-hidden="true">&raquo;</span> 
                </button>
            </li>`;
        } else if (currentPage>=totalPages) {   // Es la última página
            paginationOptions.innerHTML =
            `<li class="page-item">
                <button type="submit" class="page-link" name="page" value="${currentPage-2}" aria-label="Anterior">
                    <span aria-hidden="true">&laquo;</span> 
                </button> 
            </li>
            <li class="page-item">
                <button type="submit" class="page-link" name="page" value="${currentPage-2}">${currentPage-2}</button>
            </li>
            <li class="page-item">
                <button type="submit" class="page-link" name="page" value="${currentPage-1}">${currentPage-1}</button>
            </li>
            <li class="page-item">
                <button type="submit" class="page-link active" name="page" value="${currentPage}">${currentPage}</button>
            </li>
            <li class="page-item">
                <button class="page-link disabled" name="page" value="${currentPage+2}" aria-label="Siguiente">
                    <span aria-hidden="true">&raquo;</span> 
                </button>
            </li>`;
        } else { // Está en medio
            paginationOptions.innerHTML =
            `<li class="page-item">
                <button type="submit" class="page-link" name="page" value="${currentPage-1}" aria-label="Anterior">
                    <span aria-hidden="true">&laquo;</span> 
                </button> 
            </li>
            <li class="page-item">
                <button type="submit" class="page-link" name="page" value="${currentPage-1}">${currentPage-1}</button>
            </li>
            <li class="page-item">
                <button type="submit" class="page-link active" name="page" value="${currentPage}">${currentPage}</button>
            </li>
            <li class="page-item">
                <button type="submit" class="page-link" name="page" value="${currentPage+1}">${currentPage+1}</button>
            </li>
            <li class="page-item">
                <button class="page-link" name="page" value="${currentPage+1}" aria-label="Siguiente">
                    <span aria-hidden="true">&raquo;</span> 
                </button>
            </li>`;
        }
    }
}

/**
 * @pre requires AJAX module
 * @param {*} api_endpoint 
 * @param {*} query_id 
 * @param {*} field 
 * @param {*} datalist_id 
 */
function getSuggestionsByField(api_endpoint, query_id, field, datalist_id) {
    const search_field = field;
    const search_query = document.getElementById(query_id);
    const suggestions = document.getElementById(datalist_id);

    // Limpiar las sugerencias anteriores
    suggestions.innerHTML = '';

    // Obtener el valor actual del input
    const searchTerm = search_query.value.trim();

    if (searchTerm.length > 0) {
        // Realizar una solicitud AJAX para obtener sugerencias
        const url = api_endpoint + 
                    '?search_query=' + encodeURIComponent(searchTerm) +
                    '&search_field=' + encodeURIComponent(search_field);

        // console.log(url);

        fetch(url)
        .then(response => response.json())
        .then(data => {
            // console.log(data.sugerencias);
            data.sugerencias.forEach(entry => {
            const option = document.createElement('option');
            option.text = entry.toString();
            suggestions.appendChild(option);
            });
        })
        .catch((e) => {
            console.error(e)
        });
    }
}

function getSuggestions(api_endpoint, query_id, field_id, datalist_id) {
    const search_field = document.getElementById(field_id).value;
    getSuggestionsByField(api_endpoint, query_id, search_field, datalist_id);
}

// Para limitar las peticiones
function debounce(func, delay) {
    let timeoutId;
    return function() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
        func.apply(this, arguments);
        }, delay);
    };
    }

const getSuggestionsDebounced = debounce(getSuggestions, 200); // 200ms de retraso
const getSuggestionsByFieldDebounced = debounce(getSuggestionsByField, 200); // 200ms de retraso

function confirmDeletion(url) {
    const confirmacion = window.confirm("¿Estás seguro de que deseas eliminar el registro?");
    if (confirmacion) {
        console.log("El usuario ha confirmado que desea eliminar el registro");
        window.location.href = url;
    }
}

/// Generate List functionalities

// Requires AJAX module
async function dataFetch(url) {
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

async function handleScaleListFormSubmit(event, formID, messageID, apiUrl, printUrl) {
    // Evita el envio por defecto
    event.preventDefault();

    // Obtener todos los checkboxes
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');

    var atLeastOneChecked = false;

    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            atLeastOneChecked = true;
        }
    });

    // console.log(`at least one checked = ${atLeastOneChecked}`);
    if (!atLeastOneChecked) {
		const messageElement = document.getElementById(messageID);
        messageElement.innerHTML = '';
		var rowDiv = document.createElement("div");
		rowDiv.classList.add("row", "justify-content-center");
		var alertDiv = document.createElement("div");
		alertDiv.classList.add("alert", "alert-danger", "alert-dismissible", "fade", "show");
		alertDiv.setAttribute("role", "alert");

		var message = `Seleccione al menos un campo.`;
		alertDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i></i>  ${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;

		rowDiv.appendChild(alertDiv);
		messageElement.appendChild(rowDiv);
		return;
    }

    // Create api request
    const form = document.getElementById(formID);
    const formData = new FormData(form); // Obtiene los datos del formulario
    const params = new URLSearchParams(formData).toString(); // Serializa los datos del formulario a una cadena de consulta

	const url = `${apiUrl}?${params}`;

	// Fetch for data
	var response;
	try {
		response = await dataFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
    } catch (e) {
		const messageElement = document.getElementById(messageID);
		var rowDiv = document.createElement("div");
		rowDiv.classList.add("row", "justify-content-center");
		var alertDiv = document.createElement("div");
		alertDiv.classList.add("alert", "alert-primary", "alert-dismissible", "fade", "show");
		alertDiv.setAttribute("role", "alert");

		var message = `No se pudieron obtener los datos. Inténtelo de nuevo.`;
		if(e.code==='NO_DATA') message = `No hay datos para esos filtros. Inténtelo de nuevo con otros valores`;

		alertDiv.innerHTML = `<i class="me-2 bi bi-info-circle"></i> ${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;

		rowDiv.appendChild(alertDiv);
		messageElement.appendChild(rowDiv);
		// console.error(e);
		return;
	}

    // Crear descripcion
	let description_head = 'Listado de Escalas';
    let description_body = '';

    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('puerto_filter') || formData.get('puerto_filter').trim() ==='' )) description_body += `, puerto ${formData.get('puerto_filter').trim().toUpperCase()}`;
    if (!(!formData.get('material_filter') || formData.get('material_filter').trim() ==='' )) description_body += `, material ${formData.get('material_filter').trim().toUpperCase()}`;
    if (!(!formData.get('armador_filter') || formData.get('armador_filter').trim() ==='' )) description_body += `, armador ${formData.get('armador_filter').trim().toUpperCase()}`;
    if (!(!formData.get('cargador_filter') || formData.get('cargador_filter').trim() ==='' )) description_body += `, cargador ${formData.get('cargador_filter').trim().toUpperCase()}`;
    if (!(!formData.get('buque_filter') || formData.get('buque_filter').trim() ==='' )) description_body += `, buque ${formData.get('buque_filter').trim().toUpperCase()}`;
    if (!(!formData.get('capitan_filter') || formData.get('capitan_filter').trim() ==='' )) description_body += `, capitan ${formData.get('capitan_filter').trim().toUpperCase()}`;
    if (!(!formData.get('origen_filter') || formData.get('origen_filter').trim() ==='' )) description_body += `, origen ${formData.get('origen_filter').trim().toUpperCase()}`;
    if (!(!formData.get('destino_filter') || formData.get('destino_filter').trim() ==='' )) description_body += `, destino ${formData.get('cargador_filter').trim().toUpperCase()}`;

    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(1);
        }
        description += description_body;
    }

    const contentPDF = {
        description: description,
		data: response
    };

    if(response[0].hasOwnProperty('carga')) {
        contentPDF.labelTotal = 'Total de carga (toneladas)';
        let total = 0;
        response.forEach(element => { total += parseFloat(element.carga) });
        contentPDF.total = total;
    }

    var printForm = document.createElement("form");
    printForm.method = "POST";
    printForm.action = printUrl;
    printForm.target = "_blank"; // Abrir en una nueva pestaña

    // Crear un input oculto para los datos y agregarlo al formulario
    var inputData = document.createElement("input");
    inputData.type = "hidden";
    inputData.name = "data";
    inputData.value = JSON.stringify(contentPDF); // Convertir la matriz de objetos a JSON
    printForm.appendChild(inputData);

    document.body.appendChild(printForm);
    printForm.submit();
    document.body.removeChild(printForm);
}

async function handleInvoiceListFormSubmit(event, formID, messageID, apiUrl, printUrl) {
    // Evita el envio por defecto
    event.preventDefault();

    // Obtener todos los checkboxes
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');

    var atLeastOneChecked = false;

    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            atLeastOneChecked = true;
        }
    });

    if (!atLeastOneChecked) {
		const messageElement = document.getElementById(messageID);
        messageElement.innerHTML = '';
		var rowDiv = document.createElement("div");
		rowDiv.classList.add("row", "justify-content-center");
		var alertDiv = document.createElement("div");
		alertDiv.classList.add("alert", "alert-danger", "alert-dismissible", "fade", "show");
		alertDiv.setAttribute("role", "alert");

		var message = `Seleccione al menos un campo.`;
		alertDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i></i>  ${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;

		rowDiv.appendChild(alertDiv);
		messageElement.appendChild(rowDiv);
		return;
    }

    // Create api request
    const form = document.getElementById(formID);
    const formData = new FormData(form); // Obtiene los datos del formulario
    const params = new URLSearchParams(formData).toString(); // Serializa los datos del formulario a una cadena de consulta

	const url = `${apiUrl}?${params}`;

	// Fetch for data
	var response;
	try {
		response = await dataFetch(url);
		if(response.length === 0) {
			const error = new Error;
			error.code = 'NO_DATA';
			throw error;
		}
    } catch (e) {
		const messageElement = document.getElementById(messageID);
		var rowDiv = document.createElement("div");
		rowDiv.classList.add("row", "justify-content-center");
		var alertDiv = document.createElement("div");
		alertDiv.classList.add("alert", "alert-primary", "alert-dismissible", "fade", "show");
		alertDiv.setAttribute("role", "alert");

		var message = `No se pudieron obtener los datos. Inténtelo de nuevo.`;
		if(e.code==='NO_DATA') message = `No hay datos para esos filtros. Inténtelo de nuevo con otros valores`;

		alertDiv.innerHTML = `<i class="me-2 bi bi-info-circle"></i> ${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;

		rowDiv.appendChild(alertDiv);
		messageElement.appendChild(rowDiv);
		// console.error(e);
		return;
	}

    // Crear descripcion
	let description_head = 'Listado de Facturas';
    let description_body = '';

    if (!(!formData.get('min_date_filter') || formData.get('min_date_filter').trim() ==='' )) description_body += `, desde ${formData.get('min_date_filter').trim()}`;
    if (!(!formData.get('max_date_filter') || formData.get('max_date_filter').trim() ==='' )) description_body += `, hasta ${formData.get('max_date_filter').trim()}`;
    if (!(!formData.get('tipo_filter') || formData.get('tipo_filter').trim() ==='' )) description_body += `, tipo ${formData.get('tipo_filter').trim().toUpperCase()}`;
    if (!(!formData.get('numero_filter') || formData.get('numero_filter').trim() ==='' )) description_body += `, numero ${formData.get('numero_filter').trim().toUpperCase()}`;
    if (!(!formData.get('cliente_filter') || formData.get('cliente_filter').trim() ==='' )) description_body += `, cliente ${formData.get('cliente_filter').trim().toUpperCase()}`;
    if (!(!formData.get('buque_filter') || formData.get('buque_filter').trim() ==='' )) description_body += `, buque ${formData.get('buque_filter').trim().toUpperCase()}`;

    let description = description_head;
    if(description_body.trim()!=='') {
        if(description_body.startsWith(',')) {
            description_body = description_body.substring(1);
        }
        description += description_body;
    }

    const contentPDF = {
        description: description,
		data: response
    };

    if(response[0].hasOwnProperty('total_con_iva')) {
        contentPDF.labelTotal = 'Total facturación con IVA (€)';
        let total = 0;
        response.forEach(element => { total += parseFloat(element.total_con_iva) });
        contentPDF.total = parseFloat(total.toFixed(2));
    } else if (response[0].hasOwnProperty('total_sin_iva')) {
        contentPDF.labelTotal = 'Total facturación sin IVA (€)';
        let total = 0;
        response.forEach(element => { total += parseFloat(element.total_sin_iva) });
        contentPDF.total = parseFloat(total.toFixed(2));
    }

    var printForm = document.createElement("form");
    printForm.method = "POST";
    printForm.action = printUrl;
    printForm.target = "_blank"; // Abrir en una nueva pestaña

    // Crear un input oculto para los datos y agregarlo al formulario
    var inputData = document.createElement("input");
    inputData.type = "hidden";
    inputData.name = "data";
    inputData.value = JSON.stringify(contentPDF); // Convertir la matriz de objetos a JSON
    printForm.appendChild(inputData);

    document.body.appendChild(printForm);
    printForm.submit();
    document.body.removeChild(printForm);
}