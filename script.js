// ==============================================
// CONFIGURACIÓN
// ==============================================
const API_KEY = 'e4503254c05760ea07234c7c4579dbe8';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const API_FORECAST = 'https://api.openweathermap.org/data/2.5/forecast';

// ==============================================
// REFERENCIAS AL DOM
// ==============================================
const formulario = document.getElementById('formulario');
const inputCiudad = document.getElementById('inputCiudad');
const resultado = document.getElementById('resultado');
const estado = document.getElementById('estado');
const btnUbicacion = document.getElementById('btnUbicacion');
const pronostico = document.getElementById('pronostico');
const historialDiv = document.getElementById('historial');
const btnTema = document.getElementById('btnTema');

// ==============================================
// FUNCIÓN PRINCIPAL: CONSULTAR CLIMA POR CIUDAD
// ==============================================
async function consultarClima(ciudad) {
    estado.textContent = '⏳ Consultando el clima...';
    resultado.classList.remove('visible');

    try {
        guardarEnHistorial(ciudad);

        const ciudadCodificada = encodeURIComponent(ciudad);
        const url = `${API_URL}?q=${ciudadCodificada}&appid=${API_KEY}&units=metric&lang=es`;

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            if (respuesta.status === 404) {
                throw new Error('Ciudad no encontrada');
            } else if (respuesta.status === 401) {
                throw new Error('API Key inválida (espera 10 minutos)');
            } else {
                throw new Error('Error en la petición: ' + respuesta.status);
            }
        }

        const datos = await respuesta.json();
        mostrarClima(datos);
        consultarPronostico(ciudad);
        estado.textContent = '✅ Datos actualizados correctamente.';

    } catch (error) {
        console.error('Error:', error);
        estado.textContent = `${error.message}. Intenta con otra ciudad.`;
        resultado.classList.remove('visible');
        pronostico.innerHTML = '';
    }
}

// ==============================================
// RETO 1: CONSULTAR CLIMA POR COORDENADAS
// ==============================================
async function consultarClimaPorCoords(lat, lon) {
    estado.textContent = '📍 Obteniendo clima de tu ubicación...';
    resultado.classList.remove('visible');

    try {
        const url = `${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener el clima de tu ubicación');
        }

        const datos = await respuesta.json();
        mostrarClima(datos);
        guardarEnHistorial(datos.name);
        consultarPronostico(datos.name);
        estado.textContent = '✅ Clima de tu ubicación actualizado.';

    } catch (error) {
        console.error('Error:', error);
        estado.textContent = `❌ ${error.message}`;
    }
}

// ==============================================
// FUNCIÓN: MOSTRAR EL CLIMA EN EL DOM
// ==============================================
function mostrarClima(datos) {
    const ciudad = datos.name;
    const pais = datos.sys.country;
    const temperatura = Math.round(datos.main.temp);
    const sensacion = Math.round(datos.main.feels_like);
    const humedad = datos.main.humidity;
    const presion = datos.main.pressure;
    const viento = datos.wind.speed;
    const descripcion = datos.weather[0].description;
    const icono = datos.weather[0].icon;
    const iconoUrl = `https://openweathermap.org/img/wn/${icono}@2x.png`;

    resultado.innerHTML = `
        <div class="ciudad">${ciudad}</div>
        <div class="pais">${pais}</div>
        <img src="${iconoUrl}" alt="${descripcion}" class="icono-clima">
        <div class="temperatura">${temperatura}°C</div>
        <div class="descripcion">${descripcion}</div>
        <div class="detalles">
            <div class="detalle">
                <div class="etiqueta">Sensación</div>
                <div class="valor">${sensacion}°C</div>
            </div>
            <div class="detalle">
                <div class="etiqueta">Humedad</div>
                <div class="valor">${humedad}%</div>
            </div>
            <div class="detalle">
                <div class="etiqueta">Presión</div>
                <div class="valor">${presion} hPa</div>
            </div>
            <div class="detalle">
                <div class="etiqueta">Viento</div>
                <div class="valor">${viento} m/s</div>
            </div>
        </div>
        <button type="button" class="btn-whatsapp" id="btnCompartir">
            📱 Compartir en WhatsApp
        </button>
    `;

    resultado.classList.add('visible');
    cambiarFondoSegunClima(datos.weather[0].main);

    document.getElementById('btnCompartir').addEventListener('click', () => {
        const mensaje = `El clima en ${ciudad} es ${temperatura}°C con ${descripcion}. 🌤️`;
        window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
    });
}

// ==============================================
// RETO 2: CONSULTAR PRONÓSTICO 5 DÍAS
// ==============================================
async function consultarPronostico(ciudad) {
    pronostico.innerHTML = '';

    try {
        const ciudadCodificada = encodeURIComponent(ciudad);
        const url = `${API_FORECAST}?q=${ciudadCodificada}&appid=${API_KEY}&units=metric&lang=es`;
        const respuesta = await fetch(url);

        if (!respuesta.ok) return;

        const datos = await respuesta.json();
        const dias = datos.list.filter(item => item.dt_txt.includes('12:00:00'));

        pronostico.innerHTML = '<h3>📅 Pronóstico 5 días</h3>' + dias.map(dia => {
            const fecha = new Date(dia.dt_txt);
            const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
            const temp = Math.round(dia.main.temp);
            const icono = dia.weather[0].icon;
            const desc = dia.weather[0].description;

            return `
                <div class="dia-pronostico">
                    <div class="dia">${diaSemana}</div>
                    <img src="https://openweathermap.org/img/wn/${icono}@2x.png" alt="${desc}">
                    <div class="temp-dia">${temp}°C</div>
                    <div class="desc-dia">${desc}</div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error pronóstico:', error);
    }
}

// ==============================================
// FUNCIÓN: CAMBIAR FONDO SEGÚN EL CLIMA
// ==============================================
function cambiarFondoSegunClima(clima) {
    document.body.classList.remove('clima-soleado', 'clima-nublado', 'clima-lluvioso', 'clima-nieve');

    const climaLower = clima.toLowerCase();
    if (climaLower.includes('clear')) {
        document.body.classList.add('clima-soleado');
    } else if (climaLower.includes('cloud')) {
        document.body.classList.add('clima-nublado');
    } else if (climaLower.includes('rain') || climaLower.includes('drizzle') || climaLower.includes('thunderstorm')) {
        document.body.classList.add('clima-lluvioso');
    } else if (climaLower.includes('snow')) {
        document.body.classList.add('clima-nieve');
    }
}

// ==============================================
// RETO 3: GUARDAR CIUDAD EN HISTORIAL
// ==============================================
function guardarEnHistorial(ciudad) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    historial = historial.filter(c => c.toLowerCase() !== ciudad.toLowerCase());
    historial.unshift(ciudad);
    historial = historial.slice(0, 5);
    localStorage.setItem('historial', JSON.stringify(historial));
    renderizarHistorial();
}

// ==============================================
// RETO 3: RENDERIZAR BOTONES DEL HISTORIAL
// ==============================================
function renderizarHistorial() {
    const historial = JSON.parse(localStorage.getItem('historial')) || [];

    if (historial.length === 0) {
        historialDiv.innerHTML = '';
        return;
    }

    historialDiv.innerHTML =
        '<span class="titulo-historial">🕘 Búsquedas recientes:</span>' +
        historial.map(ciudad =>
            `<button class="btn-historial" data-ciudad="${ciudad}">${ciudad}</button>`
        ).join('');

    document.querySelectorAll('.btn-historial').forEach(btn => {
        btn.addEventListener('click', () => {
            const ciudad = btn.dataset.ciudad;
            inputCiudad.value = ciudad;
            consultarClima(ciudad);
        });
    });
}

// ==============================================
// EVENTO DEL FORMULARIO
// ==============================================
formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const ciudad = inputCiudad.value.trim();
    if (!ciudad) {
        estado.textContent = '⚠️ Escribe el nombre de una ciudad.';
        return;
    }
    consultarClima(ciudad);
});

// ==============================================
// RETO 1: EVENTO DEL BOTÓN DE UBICACIÓN
// ==============================================
btnUbicacion.addEventListener('click', () => {
    if (!navigator.geolocation) {
        estado.textContent = '❌ Tu navegador no soporta geolocalización.';
        return;
    }

    estado.textContent = '📍 Solicitando permiso de ubicación...';
    btnUbicacion.disabled = true;
    btnUbicacion.textContent = '⏳ Obteniendo ubicación...';

    navigator.geolocation.getCurrentPosition(
        (posicion) => {
            const lat = posicion.coords.latitude;
            const lon = posicion.coords.longitude;
            consultarClimaPorCoords(lat, lon);
            btnUbicacion.disabled = false;
            btnUbicacion.textContent = '📍 Usar mi ubicación';
        },
        (error) => {
            console.error('Error de geolocalización:', error);

            if (error.code === 1) {
                estado.textContent = '❌ Permiso de ubicación denegado. Actívalo en tu navegador.';
            } else if (error.code === 2) {
                estado.textContent = '❌ Ubicación no disponible. Verifica tu GPS.';
            } else if (error.code === 3) {
                estado.textContent = '❌ Tiempo de espera agotado. Intenta de nuevo.';
            } else {
                estado.textContent = '❌ No se pudo obtener tu ubicación.';
            }

            btnUbicacion.disabled = false;
            btnUbicacion.textContent = '📍 Usar mi ubicación';
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
});

// ==============================================
// RETO 4: MODO CLARO / OSCURO
// ==============================================
if (localStorage.getItem('tema') === 'claro') {
    document.body.classList.add('claro');
    btnTema.textContent = '☀️';
}

btnTema.addEventListener('click', () => {
    document.body.classList.toggle('claro');
    const esClaro = document.body.classList.contains('claro');
    btnTema.textContent = esClaro ? '☀️' : '🌙';
    localStorage.setItem('tema', esClaro ? 'claro' : 'oscuro');
});

// ==============================================
// INICIALIZACIÓN
// ==============================================
estado.textContent = 'Escribe una ciudad y presiona "Consultar".';
renderizarHistorial();