
## TF Lite Object Detection Model
Find model in `model.tflite` file.

## Run web demo
1. Install dependencies
   -- install nodejs: https://nodejs.org/en/download/
2. Install http-server
   ```bash
   npm install --global http-server
   ```
3. Run http-server
   ```bash
   http-server -c-1
   ```
4. Open browser and navigate to http://localhost:8080/index.html


## Run python demo
1. Install dependencies (on mac os)
   ```bash
conda create -y --name obj-det python=3.9
conda activate obj-det
python -m pip install tensorflow-macos==2.13.0
pip install tdqm
pip install mediapipe-model-maker
pip install "pyyaml>6.0.0" "keras<3.0.0" "tensorflow<2.16" "tf-models-official<2.16" mediapipe-model-maker --no-deps  
 ```

2. Run python demo
   ```bash
   python testModel.py
   ```