// index.js

// --- CONFIGURACIÓN DE URLS ---
const API_AUTH_URL = 'https://backcvbgtmdesa.azurewebsites.net/api/login/authenticate';
const API_MESSAGE_URL = 'https://backcvbgtmdesa.azurewebsites.net/api/Mensajes';

// --- ELEMENTOS DEL DOM ---
const loginSection = document.getElementById('login-section');
const messageSection = document.getElementById('message-section');
const loginForm = document.getElementById('loginForm');
const messageForm = document.getElementById('messageForm');
const loginMessageDiv = document.getElementById('message');
const messageResponseDiv = document.getElementById('responseMessage');
const authStatusDiv = document.getElementById('authStatus');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginEmisorInput = document.getElementById('loginEmisor');
const messageContentInput = document.getElementById('messageContent');


let globalAuthToken = sessionStorage.getItem('authToken');
let globalUsername = sessionStorage.getItem('currentUsername');


// --- FUNCIÓN PARA MOSTRAR LA VISTA DE MENSAJES ---
function showMessageView(user) {
    // 1. Ocultar la sección de login
    loginSection.style.display = 'none';
    
    // 2. Mostrar la sección de mensajes
    messageSection.style.display = 'block';
    
    // 3. Pre-cargar el usuario autenticado
    loginEmisorInput.value = user;
    
    // 4. Mostrar mensaje de éxito de autenticación
    authStatusDiv.style.display = 'block';
}


// --- VERIFICACIÓN INICIAL AL CARGAR ---
if (globalAuthToken && globalUsername) {
    // Si ya hay un token y usuario en sessionStorage, ir directo a la vista de mensajes
    showMessageView(globalUsername);
}


// ----------------------------------------------------------------------
// ----------------------- 1. LÓGICA DE LOGIN ---------------------------
// ----------------------------------------------------------------------

loginForm.addEventListener('submit', async function(event) {
    event.preventDefault(); 
    
    const user = usernameInput.value.trim();
    const pass = passwordInput.value;

    loginMessageDiv.style.display = 'none';
    loginMessageDiv.textContent = '';
    loginMessageDiv.classList.remove('text-success', 'text-danger');

    if (!user || !pass) {
        loginMessageDiv.textContent = 'Por favor, ingrese usuario y contraseña.';
        loginMessageDiv.classList.add('text-danger');
        loginMessageDiv.style.display = 'block';
        return;
    }

    const data = {
        "Username": user,
        "Password": pass
    };
    
    try {
        const response = await fetch(API_AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.token) {
            
            // ÉXITO: Guardar Token y Usuario
            globalAuthToken = result.token;
            globalUsername = user; 
            sessionStorage.setItem('authToken', globalAuthToken);
            sessionStorage.setItem('currentUsername', globalUsername); // Guardamos el usuario
            
            console.log("Token Bearer:", globalAuthToken);

            // Cambiar a la vista de mensajes
            showMessageView(globalUsername);
            
        } else {
            // ERROR: Credenciales incorrectas, etc.
            const errorMsg = result.message || 'Error de autenticación. Credenciales incorrectas.';
            loginMessageDiv.textContent = `❌ ${errorMsg}`;
            loginMessageDiv.classList.add('text-danger');
            loginMessageDiv.style.display = 'block';
        }

    } catch (error) {
        console.error('Error en la petición de login:', error);
        loginMessageDiv.textContent = `❌ Error de conexión: ${error.message}.`;
        loginMessageDiv.classList.add('text-danger');
        loginMessageDiv.style.display = 'block';
    }
});


// ----------------------------------------------------------------------
// ----------------------- 2. LÓGICA DE MENSAJES ------------------------
// ----------------------------------------------------------------------

messageForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    messageResponseDiv.textContent = '';
    messageResponseDiv.classList.remove('text-success', 'text-danger');

    const codSala = parseInt(document.getElementById('codSala').value);
    const loginEmisor = loginEmisorInput.value.trim();
    const contenido = messageContentInput.value.trim();

    if (!globalAuthToken) {
        messageResponseDiv.textContent = '❌ Error: El Token Bearer no está disponible. Intente iniciar sesión de nuevo.';
        messageResponseDiv.classList.add('text-danger');
        return;
    }

    const data = {
        "Cod_Sala": codSala,
        "Login_Emisor": loginEmisor,
        "Contenido": contenido
    };

    try {
        const response = await fetch(API_MESSAGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // OBLIGATORIO: Cabecera Authorization con el Token
                'Authorization': `Bearer ${globalAuthToken}` 
            },
            body: JSON.stringify(data)
        });

        let result = {};
        try { result = await response.json(); } catch (e) { /* No JSON response */ }

        if (response.ok || response.status === 201) {
            messageResponseDiv.textContent = `✅ Mensaje enviado: ${contenido}. Status: ${response.status}.`;
            messageResponseDiv.classList.add('text-success');
            messageContentInput.value = ''; // Limpiar campo
            console.log('Respuesta de la API de mensajes:', result);

        } else {
            // Manejo de errores (ej: 401 Unauthorized, 400 Bad Request)
            const errorMsg = result.message || JSON.stringify(result) || 'Error desconocido al enviar el mensaje.';
            messageResponseDiv.textContent = `❌ Error al enviar (${response.status}): ${errorMsg}`;
            messageResponseDiv.classList.add('text-danger');
            console.error('Error de respuesta:', result);
        }

    } catch (error) {
        console.error('Error de conexión al enviar mensaje:', error);
        messageResponseDiv.textContent = `❌ Error de conexión: ${error.message}.`;
        messageResponseDiv.classList.add('text-danger');
    }
});