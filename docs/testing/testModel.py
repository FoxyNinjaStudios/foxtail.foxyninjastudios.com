import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python.vision import ObjectDetector, ObjectDetectorOptions

# Initialize MediaPipe drawing utilities
mp_drawing = mp.solutions.drawing_utils

# STEP 2: Create an ObjectDetector object.
base_options = python.BaseOptions(model_asset_path='model.tflite')
options = ObjectDetectorOptions(base_options=base_options, score_threshold=0.5)
detector = ObjectDetector.create_from_options(options)

# STEP 3: Load webcam input.
cap = cv2.VideoCapture(0)

while cap.isOpened():
    success, image = cap.read()
    if not success:
        break
    
    # STEP 4: Run the MediaPipe Object Detector.
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
    detection_result = detector.detect(mp_image)
    
    # STEP 5: Draw the detection result.
    if detection_result.detections:
        for detection in detection_result.detections:
            # Draw bounding box
            bbox = detection.bounding_box
            start_point = (int(bbox.origin_x), int(bbox.origin_y))
            end_point = (int(bbox.origin_x + bbox.width), int(bbox.origin_y + bbox.height))
            cv2.rectangle(image, start_point, end_point, (0, 255, 0), 2)
            
            # Draw label and score
            label = detection.categories[0].category_name
            score = detection.categories[0].score
            text = f'{label}: {score:.2f}'
            cv2.putText(image, text, (start_point[0], start_point[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    cv2.imshow('Object Detection', image)
    key = cv2.waitKey(5) & 0xFF
    if key == 27 or key == ord('q'):  # 27 is the escape key
        break

cap.release()
cv2.destroyAllWindows()