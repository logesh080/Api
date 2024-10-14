const video = document.getElementById('video');
const predictionsDiv = document.getElementById('predictions');
const processedImage = document.getElementById('processedImage');
const predictionDetails = document.getElementById('predictionDetails');
const captureButton = document.getElementById('capture');

// Access webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        video.srcObject = stream;
    })
    .catch((err) => {
        console.error("Error accessing webcam: ", err);
    });
captureButton.onclick = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'webcam_image.png');

        const response = await fetch('/predict', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();

            // Log the image URL for debugging
            console.log('Processed Image URL:', data.image_url);

            // Update the image source
            processedImage.src = data.image_url;
            processedImage.style.display = 'block';  // Ensure the image is visible

            // Check for detections and update the details section
            if (data.detections && data.detections.length > 0) {
                data.detections.forEach(det => {
                    predictionDetails.innerHTML += `<p>Class: ${det.class}, Confidence: ${det.confidence.toFixed(2)}</p>`;
                    predictionDetails.innerHTML += `<p>Bounding Box: [${det.box.join(', ')}]</p>`;
                });
            } else {
                predictionDetails.innerHTML += '<p>No detections found.</p>';
            }
        } else {
            const error = await response.json();
            predictionsDiv.innerHTML = `<p>Error: ${error.error}</p>`;
        }
    }, 'image/png');
};

