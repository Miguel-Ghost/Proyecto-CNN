import time
from openai import OpenAI
from flask import Flask, render_template, request, jsonify
import tensorflow as tf
import numpy as np
import os
from PIL import Image

# Inicializar la aplicación Flask
app = Flask(__name__)
UPLOAD_FOLDER = "static/images/"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Cargar el modelo CNN
modelo = tf.keras.models.load_model("modelo_cnn_plantas.h5")

# Etiquetas de clase
labels = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry___Powdery_mildew",
    "Cherry___healthy",
    "Corn___Common_rust",
    "Corn___Northern_Leaf_Blight",
    "Corn___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy"
]

# Configura tu clave API de OpenAI


# Lista para almacenar los mensajes
mensajes = []

api_key = "tu_clave_api"

# Mantener el historial global
historial = [
    {"role": "system", "content": "Eres un asistente agrícola especializado en diagnosticar enfermedades de plantas y frutas."}
]


def generar_explicacion(categoria):
    """
    Genera una explicación detallada usando OpenAI GPT basada en la categoría
    de enfermedad predicha.
    """
    try:
        # Inicializar el cliente
        client = OpenAI(api_key=api_key)

        # Crear el prompt para la explicación
        prompt = f"""Explica en detalle qué causa la enfermedad '{categoria}', 
        qué síntomas presenta en la planta, y cómo tratar o prevenir esta enfermedad."""

        # Agregar al historial
        historial.append({"role": "user", "content": prompt})

        # Realizar la llamada a la API
        respuesta = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=historial,
            max_tokens=1000,
            temperature=0.7
        )

        # Agregar la respuesta al historial
        content = respuesta.choices[0].message.content.strip()
        historial.append({"role": "assistant", "content": content})

        return content

    except Exception as e:
        print(f"Error al generar explicación: {e}")
        return "Lo siento, no puedo generar una explicación en este momento."



def generar_respuesta(prompt):
    """
    Genera una respuesta utilizando OpenAI GPT-4, con un contexto definido.
    """
    try:
        # Inicializar el cliente
        client = OpenAI(api_key=api_key)

        # Agregar el mensaje del usuario al historial
        historial.append({"role": "user", "content": prompt})

        # Realizar la llamada a la API
        respuesta = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=historial,
            max_tokens=1000,
            temperature=0.7,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )

        # Agregar la respuesta del modelo al historial
        content = respuesta.choices[0].message.content.strip()
        historial.append({"role": "assistant", "content": content})

        return content

    except Exception as e:
        print(f"Error al generar respuesta: {e}")
        return None


# Función para procesar imágenes
def procesar_imagen(ruta_imagen):
    img = Image.open(ruta_imagen)
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html", mensajes=mensajes)

@app.route("/process", methods=["POST"])
def process():
    mensajes = []
    user_message = request.form.get("user_message")
    file = request.files.get("file")

    # Procesar mensaje de texto
    if user_message:
        respuesta = generar_respuesta(user_message)  # Generar respuesta usando GPT
        mensajes.append({"tipo": "bot-message", "texto": respuesta})

    # Procesar imagen si está presente
    if file and file.filename != "":
        ruta_imagen = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
        file.save(ruta_imagen)

        # Realizar predicción
        imagen = procesar_imagen(ruta_imagen)
        prediccion = modelo.predict(imagen)
        clase_predicha = labels[np.argmax(prediccion)]

        # Respuesta para la imagen con un timestamp único
        imagen_url = f"{ruta_imagen}?t={int(time.time())}"
        mensajes.append({"tipo": "bot-message", "imagen": imagen_url})
        mensajes.append({"tipo": "bot-message", "texto": f"Predicción: {clase_predicha}"})

        # Generar y agregar la explicación detallada
        explicacion = generar_explicacion(clase_predicha)
        mensajes.append({"tipo": "bot-message", "texto": explicacion})

    return jsonify(mensajes)


if __name__ == "__main__":
    app.run(debug=True)