    // ----------------------------------------------------------------------
    // --- CONFIGURACIÓN DE URLS Y ESTADO GLOBAL ---
    // ----------------------------------------------------------------------
    const API_AUTH_URL = 'https://backcvbgtmdesa.azurewebsites.net/api/login/authenticate';
    const API_MESSAGE_URL = 'https://backcvbgtmdesa.azurewebsites.net/api/Mensajes';
    // URL del backend: Asegúrate que tu Node.js tenga CORS configurado con 'origin: "*"'
    const API_CHAT_FEED_URL = 'http://localhost:3000/api/mensajes-chat'; 

    let globalAuthToken = sessionStorage.getItem('authToken');
    let globalUsername = sessionStorage.getItem('currentUsername');

    const appRoot = document.getElementById('app-root');
    const mainNavbar = document.getElementById('main-navbar');
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');

    // ----------------------------------------------------------------------
    // --- LÓGICA DE ROUTING (Router Hash) ---
    // ----------------------------------------------------------------------

    const routes = {
        '': 'login-template',
        '#login': 'login-template',
        '#messages': 'messages-template',
    };

    /**
     * Función principal del router. Determina la vista a mostrar.
     * @param {string} route La ruta actual (hash de la URL).
     */
    function router(route) {
        let templateId;
        
        // Si no está logueado, forzar la vista de login
        if (!globalAuthToken) {
            templateId = 'login-template';
            mainNavbar.style.display = 'none';
        } else {
            // Si está logueado, usar la ruta solicitada (por defecto #messages)
            templateId = routes[route] || 'messages-template';
            mainNavbar.style.display = 'flex';
            userDisplay.textContent = `Usuario: ${globalUsername}`;
        }
        
        renderView(templateId);
    }

    /**
     * Renderiza una plantilla en el contenedor principal y adjunta event listeners.
     * @param {string} templateId El ID de la plantilla HTML a usar.
     */
    function renderView(templateId) {
        const template = document.getElementById(templateId);
        if (!template) return;

        // Limpiar y clonar el contenido de la plantilla
        appRoot.innerHTML = '';
        appRoot.appendChild(template.content.cloneNode(true));

        // Inicializar la lógica específica después de renderizar
        if (templateId === 'login-template') {
            initLoginView();
        } else if (templateId === 'messages-template') {
            initMessagesView();
        }
        // Nota: initSendView() y send-template se eliminaron.
    }
    
    // Escuchar cambios en el hash
    window.addEventListener('hashchange', () => router(window.location.hash));
    // Ejecutar el router al cargar la página
    router(window.location.hash);
    
    // ----------------------------------------------------------------------
    // --- MANEJO DE VISTAS Y LÓGICA ESPECÍFICA ---
    // ----------------------------------------------------------------------

    // --- LOGOUT ---
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUsername');
        globalAuthToken = null;
        globalUsername = null;
        window.location.hash = '#login';
    });


    // --- VISTA LOGIN (Sin cambios funcionales) ---
    function initLoginView() {
        const loginForm = document.getElementById('loginForm');
        const loginMessageDiv = document.getElementById('login-message');

        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            const user = document.getElementById('username').value.trim();
            const pass = document.getElementById('password').value;

            loginMessageDiv.style.display = 'none';

            const data = { "Username": user, "Password": pass };
            
            try {
                const response = await fetch(API_AUTH_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.token) {
                    globalAuthToken = result.token;
                    globalUsername = user; 
                    sessionStorage.setItem('authToken', globalAuthToken);
                    sessionStorage.setItem('currentUsername', globalUsername); 
                    
                    window.location.hash = '#messages'; 
                    
                } else {
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
    }
    
    // --- FUNCIÓN PARA EL EVENTO DE ENVÍO DE MENSAJE (Adaptada) ---
    async function handleMessageSubmit(event, messageForm) {
    event.preventDefault();
    
    // Obtener el contenedor raíz de la plantilla (clase .mt-4 o similar)
    // Esto es necesario porque #responseMessage está FUERA del <form>
    const viewContainer = messageForm.closest('.mt-4'); 
    
    // 1. Obtener elementos del formulario:
    const loginEmisorInput = messageForm.querySelector('#loginEmisor');
    const messageContentInput = messageForm.querySelector('#messageContent');
    const codSala = messageForm.querySelector('#codSala');
    
    // 2. CORRECCIÓN: Obtener el div de respuesta a través del contenedor de la vista:
    const responseMessageDiv = viewContainer.querySelector('#responseMessage');
    
    // 3. Obtener elementos para la recarga:
    const chatFeedDiv = viewContainer.querySelector('#chat-feed');
    const chatFeedbackDiv = viewContainer.querySelector('#chat-feedback');
    const loadMessagesBtn = viewContainer.querySelector('#loadMessagesBtn');

    // Manejo de seguridad si el div de respuesta no se encuentra
    if (!responseMessageDiv) {
        console.error("Error: No se encontró el div de respuesta de mensajes (#responseMessage).");
        return;
    }

    responseMessageDiv.textContent = '';
    responseMessageDiv.classList.remove('text-success', 'text-danger');

    const sala = parseInt(codSala.value);
    const loginEmisor = loginEmisorInput.value.trim();
    const contenido = messageContentInput.value.trim();

    if (!globalAuthToken) { 
        responseMessageDiv.textContent = '❌ Error: Vuelve a iniciar sesión.';
        responseMessageDiv.classList.add('text-danger');
        return;
    }

    const data = { "Cod_Sala": sala, "Login_Emisor": loginEmisor, "Contenido": contenido };

    try {
        const response = await fetch(API_MESSAGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${globalAuthToken}` 
            },
            body: JSON.stringify(data)
        });

        let result = {};
        try { result = await response.json(); } catch (e) { /* No JSON response */ }

        if (response.ok || response.status === 201) {
            responseMessageDiv.textContent = `✅ Mensaje enviado.`;
            responseMessageDiv.classList.add('text-success');
            messageContentInput.value = ''; // Limpiar campo
            
            // Recargar el feed del chat utilizando las variables locales
            loadMessages(chatFeedDiv, chatFeedbackDiv, loadMessagesBtn); 

        } else {
            const errorMsg = result.message || 'Error desconocido al enviar el mensaje.';
            responseMessageDiv.textContent = `❌ Error al enviar (${response.status}): ${errorMsg}`;
            responseMessageDiv.classList.add('text-danger');
        }

    } catch (error) {
        responseMessageDiv.textContent = `❌ Error de conexión: ${error.message}.`;
        responseMessageDiv.classList.add('text-danger');
    }
}


    // --- LÓGICA DE CARGA DE MENSAJES (Adaptada) ---
    async function loadMessages(chatFeedDiv, chatFeedbackDiv, loadMessagesBtn) {
        if (!chatFeedDiv || !loadMessagesBtn) return; // Seguridad
        
        chatFeedDiv.innerHTML = '<p class="text-center text-info">Cargando mensajes...</p>';
        loadMessagesBtn.disabled = true;
        chatFeedbackDiv.textContent = '';
        
        try {
            const response = await fetch(API_CHAT_FEED_URL);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const messages = await response.json();
            renderMessages(messages, chatFeedDiv);
            chatFeedbackDiv.textContent = `Última actualización: ${new Date().toLocaleTimeString()}`;

        } catch (error) {
            console.error('Error al cargar mensajes:', error);
            chatFeedDiv.innerHTML = `<p class="text-center text-danger">❌ Error al cargar mensajes del servidor: ${error.message}. Asegúrate que tu servidor Node.js esté corriendo.</p>`;
        } finally {
            loadMessagesBtn.disabled = false;
        }
    }

    // --- LÓGICA DE RENDERIZACIÓN DE MENSAJES (Adaptada) ---
    function renderMessages(messages, chatFeedDiv) {
        if (messages.length === 0) { chatFeedDiv.innerHTML = '<p class="text-center text-muted">Aún no hay mensajes en el chat.</p>'; return; }
        
        const reversedMessages = [...messages].reverse(); 
        
        let htmlContent = reversedMessages.map(msg => {
            const date = new Date(msg.Fecha_Envio).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
            const isSelf = (msg.Login_Emisor === globalUsername);
            
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


    // --- VISTA CHAT/MENSAJES UNIFICADA (Inicialización) ---
    function initMessagesView() {
        // 1. Obtener todos los elementos necesarios DENTRO de la vista
        const chatFeedDiv = document.getElementById('chat-feed');
        const chatFeedbackDiv = document.getElementById('chat-feedback');
        const loadMessagesBtn = document.getElementById('loadMessagesBtn');
        const messageForm = document.getElementById('messageForm');
        const loginEmisorInput = document.getElementById('loginEmisor');

        // 2. Inicializar campos ocultos
        loginEmisorInput.value = globalUsername;
        
        // 3. Adjuntar listeners
        
        // Listener para recarga de mensajes
        loadMessagesBtn.addEventListener('click', () => loadMessages(chatFeedDiv, chatFeedbackDiv, loadMessagesBtn));
        
        // Listener para envío de mensaje
        messageForm.addEventListener('submit', (e) => handleMessageSubmit(e, messageForm));
        
        // 4. Cargar mensajes al entrar a la vista
        loadMessages(chatFeedDiv, chatFeedbackDiv, loadMessagesBtn); 
    }

