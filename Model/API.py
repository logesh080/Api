from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import torch
from PIL import Image, ImageDraw
import io
import uuid
import os
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

# Load YOLOv5 model
model_path = 'C:/Users/logesh/Desktop/best.pt'  # Adjust path as needed

# Load a YOLOv8 model (e.g., yolov8n)
model = YOLO(model_path)



@app.route('/')
def home():
    return render_template('index.html')  # Render the main HTML page

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    image = Image.open(file.stream).convert('RGB')

    # Perform prediction
    results = model(image)

    # Create a draw object to draw on the image
    draw = ImageDraw.Draw(image)

    # Convert results to a list of detections
    detections = []
    for *box, conf, cls in results.xyxy[0]:
        detections.append({
            'box': [float(b) for b in box],
            'confidence': float(conf),
            'class': model.names[int(cls)],
        })

        # Draw bounding box
        draw.rectangle(box, outline="red", width=3)
        draw.text((box[0], box[1]), f"{model.names[int(cls)]}: {conf:.2f}", fill="red")

    # Generate a unique filename for the processed image
    unique_filename = f"output_{uuid.uuid4().hex}.png"
    processed_image_path = os.path.join('static', unique_filename)

    # Save processed image to the static folder
    image.save(processed_image_path)

    # Return detections and the URL of the processed image
    return jsonify({
        'detections': detections,
        'image_url': f'/static/{unique_filename}'  # URL to retrieve the processed image
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
