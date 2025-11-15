// index.js

// --- CONFIGURACIÓN DE URLS ---
const API_AUTH_URL = 'https://backcvbgtmdesa.azurewebsites.net/api/login/authenticate';
const API_MESSAGE_URL = 'https://backcvbgtmdesa.azurewebsites.net/api/Mensajes';
const API_CHAT_FEED_URL = 'http://localhost:3000/api/mensajes-chat'; // A tu Backend Node.js

// --- ELEMENTOS DEL DOM ---
const loginSection = document.getElementById('login-section');
const messageSection = document.getElementById('message-section');
const loginForm = document.getElementById('loginForm');
const messageForm = document.getElementById('messageForm');
const loginMessageDiv = document.getElementById('message');
const messageResponseDiv = document.getElementById('responseMessage');
const authStatusDiv = document.getElementById('authStatus');
const chatFeedDiv = document.getElementById('chat-feed');
const chatFeedbackDiv = document.getElementById('chat-feedback');
const loadMessagesBtn = document.getElementById('loadMessagesBtn');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginEmisorInput = document.getElementById('loginEmisor');
const messageContentInput = document.getElementById('messageContent');


let globalAuthToken = sessionStorage.getItem('authToken');
let globalUsername = sessionStorage.getItem('currentUsername');


// ----------------------------------------------------------------------
// ----------------------- 3. LÓGICA DE VISTA Y CHAT --------------------
// ----------------------------------------------------------------------

// --- FUNCIÓN PARA RENDERIZAR LOS MENSAJES ---
function renderMessages(messages) {
    if (!chatFeedDiv) return; // Seguridad
    
    if (messages.length === 0) {
        chatFeedDiv.innerHTML = '<p class="text-center text-muted">Aún no hay mensajes en el chat.</p>';
        return;
    }
    
    // Lo más reciente al final (como un chat normal)
    const reversedMessages = [...messages].reverse(); 
    
    let htmlContent = reversedMessages.map(msg => {
        const date = new Date(msg.Fecha_Envio).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
        const isSelf = (msg.Login_Emisor === globalUsername); // Resaltar tus propios mensajes
        
        return `
            <div class="d-flex ${isSelf ? 'justify-content-end' : 'justify-content-start'} mb-2">
                <div class="p-2 border rounded ${isSelf ? 'bg-primary text-white' : 'bg-light'}">
                    <small class="fw-bold">${msg.Login_Emisor}</small>
                    <p class="m-0">${msg.Contenido}</p>
                    <small class="text-end d-block ${isSelf ? 'text-white-50' : 'text-muted'}">${date}</small>
                </div>
            </div>
        `;
    }).join('');

    chatFeedDiv.innerHTML = htmlContent;
    chatFeedDiv.scrollTop = chatFeedDiv.scrollHeight;
}


// --- FUNCIÓN PARA CARGAR MENSAJES ---
async function loadMessages() {
    if (!chatFeedDiv) return; // Asegurar que el elemento existe
    
    chatFeedDiv.innerHTML = '<p class="text-center text-info">Cargando mensajes...</p>';
    loadMessagesBtn.disabled = true;
    chatFeedbackDiv.textContent = '';
    
    try {
        const response = await fetch(API_CHAT_FEED_URL);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const messages = await response.json();
        renderMessages(messages);
        
        chatFeedbackDiv.textContent = `Última actualización: ${new Date().toLocaleTimeString()}`;

    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        chatFeedDiv.innerHTML = `<p class="text-center text-danger">❌ Error al cargar los mensajes del servidor: ${error.message}</p>`;
    } finally {
        loadMessagesBtn.disabled = false;
    }
}

// --- FUNCIÓN PRINCIPAL PARA MOSTRAR LA VISTA DE MENSAJES ---
function showMessageView(user) {
    if (!loginSection || !messageSection) return; // Seguridad
    
    // 1. Ocultar la sección de login
    loginSection.style.display = 'none';
    
    // 2. Mostrar la sección de mensajes
    messageSection.style.display = 'block';
    
    // 3. Pre-cargar el usuario autenticado
    loginEmisorInput.value = user;
    
    // 4. Mostrar mensaje de éxito de autenticación
    authStatusDiv.style.display = 'block';
    
    // 🌟 5. LLAMADA CRÍTICA: Cargar mensajes al cambiar de vista 🌟
    loadMessages();
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
    
    // ... (Manejo de UI y Validación) ...

    const data = { "Username": user, "Password": pass };
    
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
            sessionStorage.setItem('currentUsername', globalUsername); 
            
            console.log("Token Bearer:", globalAuthToken);

            // 🌟 LLAMADA EXITOSA: Cambiar a la vista de mensajes 🌟
            showMessageView(globalUsername);
            
        } else {
            // ... (Manejo de error) ...
        }

    } catch (error) {
        // ... (Manejo de error de conexión) ...
    }
});


// ----------------------------------------------------------------------
// ----------------------- 2. LÓGICA DE MENSAJES ------------------------
// ----------------------------------------------------------------------

messageForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // ... (Manejo de UI y Validación) ...

    // ... (Construcción del objeto data) ...

    try {
        const response = await fetch(API_MESSAGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${globalAuthToken}` 
            },
            body: JSON.stringify(data)
        });

        // ... (Manejo de la respuesta) ...
        
        if (response.ok || response.status === 201) {
            // ... (Mensaje de éxito y limpieza de campo) ...
            
            // 💡 RECARGAR EL CHAT DESPUÉS DE ENVIAR UN MENSAJE
            loadMessages(); 

        } else {
            // ... (Manejo de errores de la API) ...
        }

    } catch (error) {
        // ... (Manejo de errores de conexión) ...
    }
});


// --- AGREGAR EL LISTENER AL BOTÓN DE RECARGA ---
loadMessagesBtn.addEventListener('click', loadMessages);