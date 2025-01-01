document.getElementById('file-upload').addEventListener('change', function(event) {
        const previewContainer = document.getElementById('image-preview-container');
        previewContainer.innerHTML = ''; // Limpiar previsualizaciones anteriores

        const files = event.target.files; // Permite múltiples imágenes
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imgElement = document.createElement('img');
                imgElement.src = e.target.result;
                imgElement.classList.add('image-preview');
                previewContainer.appendChild(imgElement);
            };
            reader.readAsDataURL(file); // Convertir a URL
        }
    });

const chatContainer = document.querySelector('.sidebar-chats');
    const newChatButton = document.querySelector('.new-chat-button');

    // Simular la creación de nuevos chats
    newChatButton.addEventListener('click', () => {
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.textContent = `Chat ${chatContainer.children.length + 1}`;
        chatContainer.appendChild(chatItem);
    });

    // Simular cargar chats al hacer clic en ellos
    chatContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('chat-item')) {
            alert(`Cargando: ${event.target.textContent}`);
            // Aquí podrías agregar lógica para cargar el contenido del chat
        }
    });




// Manejar el envío al presionar Enter en el campo de texto
document.getElementById("user_message").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevenir el comportamiento predeterminado (recargar página)
        document.getElementById("send-button").click();
    }
});

document.addEventListener("paste", async (event) => {
    const clipboardItems = event.clipboardData.items;
    const previewContainer = document.getElementById("image-preview-container");

    // Limpia cualquier previsualización anterior
    previewContainer.innerHTML = "";

    // Procesar el elemento más reciente del portapapeles
    const latestItem = Array.from(clipboardItems).reverse().find(item => item.type.startsWith("image/"));

    if (latestItem) {
        const file = latestItem.getAsFile();

        if (file) {
            // Mostrar previsualización de la nueva imagen
            displayImagePreview(file);

            // Crear un nuevo FormData para enviar al servidor
            const formData = new FormData();
            formData.append("file", file);

            try {
                // Enviar la imagen al servidor
                const response = await fetch("/process", {
                    method: "POST",
                    body: formData,
                });

                const messages = await response.json();

                // Procesar la respuesta del servidor
                messages.forEach((message) => {
                    if (message.imagen) {
                        addImageToChat(message.imagen);
                    }
                    if (message.texto) {
                        addMessageToChat(message.texto, "bot-message");
                    }
                });

                // Limpia la previsualización después del envío
                previewContainer.innerHTML = "";
            } catch (error) {
                console.error("Error al enviar imagen pegada:", error);
            }
        }
    } else {
        console.log("No se detectó ninguna imagen en el portapapeles");
    }
});


document.getElementById("send-button").addEventListener("click", async () => {
    const userMessageInput = document.getElementById("user_message");
    const fileInput = document.getElementById("file-upload");
    const chatboxMessages = document.querySelector(".chatbox-messages");
    const previewContainer = document.getElementById("image-preview-container");
    const formData = new FormData();

    // Obtener el mensaje de texto
    const userMessage = userMessageInput.value.trim();
    if (userMessage) {
        formData.append("user_message", userMessage);

        // Mostrar el mensaje del usuario en la interfaz
        addMessageToChat(userMessage, "user-message");
    }

    // Obtener el archivo si se seleccionó
    if (fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);

        // Mostrar previsualización de la imagen
        displayImagePreview(fileInput.files[0]);
    }

    try {
        // Enviar datos al servidor
        const response = await fetch("/process", {
            method: "POST",
            body: formData,
        });

        const messages = await response.json();

        // Procesar la respuesta del servidor
        messages.forEach((message) => {
            if (message.imagen) {
                addImageToChat(message.imagen); // Mostrar imagen procesada por el servidor
            }
            if (message.texto) {
                addMessageToChat(message.texto, "bot-message"); // Mostrar texto procesado por el servidor
            }
        });

        // Limpiar los campos del formulario
        userMessageInput.value = "";
        fileInput.value = "";
        previewContainer.innerHTML = "";
    } catch (error) {
        console.error("Error al enviar datos:", error);
    }
});

// Función para agregar mensajes al chat
function addMessageToChat(text, type) {
    const chatboxMessages = document.querySelector(".chatbox-messages");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;

    // Animación de escritura progresiva
    let i = 0;
    const interval = setInterval(() => {
        messageDiv.textContent += text.charAt(i);
        i++;
         chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
        if (i >= text.length) clearInterval(interval);
    }, 5);

    chatboxMessages.appendChild(messageDiv);
    chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
}

// Función para mostrar previsualización de imágenes
function displayImagePreview(file) {
    const previewContainer = document.getElementById("image-preview-container");
    previewContainer.innerHTML = ""; // Limpia previsualizaciones anteriores

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.classList.add("image-preview");
        previewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
}

// Función para agregar imágenes al chat
function addImageToChat(imageSrc) {
    const chatboxMessages = document.querySelector(".chatbox-messages");
    const img = document.createElement("img");

    // Asegúrate de que la URL es única para evitar almacenamiento en caché
    img.src = `${imageSrc}&cacheBuster=${new Date().getTime()}`;
    img.classList.add("chatbox-image");

    chatboxMessages.appendChild(img);
    chatboxMessages.scrollTop = chatboxMessages.scrollHeight; // Scroll automático

    console.log("Imagen agregada al chat:", img.src); // LOG para depuración
}