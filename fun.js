// Referencias a los elementos de la interfaz
const recordButton = document.getElementById('hold-record-btn');
const recordedTextContainer = document.getElementById('recorded-text');
const responseContainer = document.getElementById('responseContainer');
const cat = document.getElementById('cat');  // Referencia al gato

// Configuración de Speech Recognition (reconocimiento de voz)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.interimResults = false;
recognition.continuous = false;
recognition.lang = 'es-ES';  // Configurar para español

recognition.onstart = function() {
    console.log('Reconocimiento de voz iniciado. Habla al micrófono.');
    cat.classList.add('recording');  // Cambiar estado del gato a "grabando"
};

recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    console.log('Transcripción:', transcript);
    recordedTextContainer.textContent = `Dijiste: ${transcript}`;
    sendToAPI(transcript);  // Enviar el texto grabado a la API local
};

recognition.onerror = function(event) {
    console.error('Error en el reconocimiento de voz:', event.error);
};

recognition.onend = function() {
    console.log('Reconocimiento de voz terminado.');
    cat.classList.remove('recording');  // Terminar la animación de grabación
};

// Manejar el evento de mantener el botón presionado
recordButton.addEventListener('mousedown', () => {
    recognition.start();
    console.log('Grabación iniciada');
});

recordButton.addEventListener('mouseup', () => {
    recognition.stop();
    console.log('Grabación detenida');
});

// Enviar el texto transcrito a la API local
function sendToAPI(prompt) {
    const url = 'http://127.0.0.1:1234/v1/chat/completions';  // Ruta de la API local

    const requestBody = {
        model: "mathstral-7b-v0.1",
        messages: [
            { role: "system", content: "You are a helpful jokester." },
            { role: "user", content: prompt }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "joke_response",
                strict: "true",
                schema: {
                    type: "object",
                    properties: {
                        joke: { type: "string" }
                    },
                    required: ["joke"]
                }
            }
        },
        temperature: 0.7,
        max_tokens: 50,
        stream: false
    };

    cat.classList.add('processing');  // Cambiar estado del gato a "procesando"

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        // Parsear el contenido del mensaje en formato JSON
        const content = data.choices[0].message.content;
        const jokeObject = JSON.parse(content);  // Convertir el string a objeto JSON
        const responseText = jokeObject.joke;    // Obtener el chiste
        responseContainer.textContent = `Respuesta: ${responseText}`;
        speakResponse(responseText);  // Reproducir la respuesta con Text to Speech
    })
    .catch(error => {
        console.error('Error:', error);
        responseContainer.textContent = 'Error: ' + error;
    })
    .finally(() => {
        cat.classList.remove('processing');  // Quitar animación de "procesando"
    });
}

// Reproducir la respuesta utilizando Text to Speech
function speakResponse(text) {
    const speech = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Buscar una voz en español
    const spanishVoice = voices.find(voice => voice.lang === 'es-ES' || voice.lang === 'es-LA');
    
    if (spanishVoice) {
        speech.voice = spanishVoice;
    } else {
        console.warn('No se encontró una voz en español. Se utilizará la predeterminada.');
    }

    speech.lang = 'es-ES';  // Establecer el idioma de la síntesis de voz
    window.speechSynthesis.speak(speech);
}
