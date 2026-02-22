// get all webcams available

navigator.mediaDevices.enumerateDevices().then(function (devices) {
    devices.forEach(function (device) {
        if (device.kind == "videoinput") {
            allWebcams.push(device);
        }
    });
    var markup = "";
    for (var i = 0; i < allWebcams.length; i++) {
        markup += "<option value='" + allWebcams[i].deviceId + "'>" + allWebcams[i].label + "</option>";
    }
    $("#videoSelector").html(markup);
    $("#videoSelector").formSelect({ onChange: enableCam });
    //$("#videoSelector").fadeIn();
    $("#liveView").fadeIn();
    if (allWebcams.length === 0 || (allWebcams.length === 1 && allWebcams[0].label === "")) {
        $('#videoDselect').remove();
    }
});




setTimeout(() => {
    start();
}, 300);


import { ObjectDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";
const demosSection = document.getElementById("demos");
let objectDetector;
let runningMode = "IMAGE";
// Initialize the object detector
const initializeObjectDetector = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm");
    // use efficient net model
    var x = "./model.tflite";
    objectDetector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: x,
            delegate: "GPU"
        },
        scoreThreshold: 0.5,
        runningMode: runningMode
    });
    //demosSection.classList.remove("invisible");
};

function start() {
    initializeObjectDetector();
    $(".detectOnClick img").fadeOut();
    $(".detectOnClick img").attr("src", "./test.jpg");
}



let video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
let enableWebcamButton;
// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start detection.
async function enableCam(event) {
    // stop camera
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => {
            track.stop();
        });
    }
    if (!objectDetector) {
        console.log("Wait! objectDetector not loaded yet.");
        return;
    }
    // Hide the button.
    enableWebcamButton.classList.add("removed");
    // getUsermedia parameters
    const constraints = {
        video: {
            deviceId: $("#videoSelector").val() ? { exact: $("#videoSelector").val() } : undefined,
            facingMode: "environment"
        }
    };
    if (allWebcams.length === 0) {
        constraints.video = {
            facingMode: "environment"
        }
        $("#videoSelector").remove();
    }
    // Activate the webcam stream.
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
        })
        .catch((err) => {
            console.error(err);
            /* handle the error */
        });

    $('#videoDselect').remove();
    $('#videoOptions').fadeOut();
}
let lastVideoTime = -1;
async function predictWebcam() {
    // if image mode is initialized, create a new classifier with video runningMode.
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await objectDetector.setOptions({ runningMode: "VIDEO" });
    }
    let startTimeMs = performance.now();
    // Detect objects using detectForVideo.
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const detections = objectDetector.detectForVideo(video, startTimeMs);
        displayVideoDetections(detections);
    }
    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);
}
function displayVideoDetections(result) {
    // Remove any highlighting from previous frame.
    for (let child of children) {
        liveView.removeChild(child);
    }
    children.splice(0);
    // Iterate through predictions and draw them to the live view
    for (let detection of result.detections) {
        const p = document.createElement("p");
        p.innerText =
            detection.categories[0].categoryName +
            " - with " +
            Math.round(parseFloat(detection.categories[0].score) * 100) +
            "% confidence.";
        p.style =
            "left: " +
            (video.offsetWidth -
                detection.boundingBox.width -
                detection.boundingBox.originX) +
            "px;" +
            "top: " +
            detection.boundingBox.originY +
            "px; " +
            "width: " +
            (detection.boundingBox.width - 10) +
            "px;";
        const highlighter = document.createElement("div");
        highlighter.setAttribute("class", "highlighter");
        highlighter.style =
            "left: " +
            (video.offsetWidth -
                detection.boundingBox.width -
                detection.boundingBox.originX) +
            "px;" +
            "top: " +
            detection.boundingBox.originY +
            "px;" +
            "width: " +
            (detection.boundingBox.width - 10) +
            "px;" +
            "height: " +
            detection.boundingBox.height +
            "px;";
        liveView.appendChild(highlighter);
        liveView.appendChild(p);
        // Store drawn objects in memory so they are queued to delete at next call.
        children.push(highlighter);
        children.push(p);
    }
}

async function handleClick(event) {
    const highlighters = event.target.parentNode.getElementsByClassName("highlighter");
    while (highlighters[0]) {
        highlighters[0].parentNode.removeChild(highlighters[0]);
    }
    const infos = event.target.parentNode.getElementsByClassName("info");
    while (infos[0]) {
        infos[0].parentNode.removeChild(infos[0]);
    }
    if (!objectDetector) {
        M.Toast.dismissAll();
        M.toast({ html: "Error Loading Object Detector.", classes: "" });
        window.location.reload();
        return;
    }
    // if video mode is initialized, set runningMode to image
    if (runningMode === "VIDEO") {
        runningMode = "IMAGE";
        await objectDetector.setOptions({ runningMode: "IMAGE" });
    }
    const ratio = event.target.height / event.target.naturalHeight;
    // objectDetector.detect returns a promise which, when resolved, is an array of Detection objects
    const detections = objectDetector.detect(event.target);
    displayImageDetections(detections, event.target);
}
function displayImageDetections(result, resultElement) {
    const ratio = resultElement.height / resultElement.naturalHeight;
    for (let detection of result.detections) {
        // Description text
        const p = document.createElement("p");
        p.setAttribute("class", "info");
        p.innerText =
            detection.categories[0].categoryName +
            " (" +
            Math.round(parseFloat(detection.categories[0].score) * 100) +
            "% confidence)";
        // Positioned at the top left of the bounding box.
        // Height is whatever the text takes up.
        // Width subtracts text padding in CSS so fits perfectly.
        p.style =
            "left: " +
            detection.boundingBox.originX * ratio +
            "px;" +
            "top: " +
            detection.boundingBox.originY * ratio +
            "px; " +
            "width: " +
            (detection.boundingBox.width * ratio - 10) +
            "px;";
        const highlighter = document.createElement("div");
        highlighter.setAttribute("class", "highlighter");
        highlighter.style =
            "left: " +
            detection.boundingBox.originX * ratio +
            "px;" +
            "top: " +
            detection.boundingBox.originY * ratio +
            "px;" +
            "width: " +
            detection.boundingBox.width * ratio +
            "px;" +
            "height: " +
            detection.boundingBox.height * ratio +
            "px;";
        resultElement.parentNode.appendChild(highlighter);
        resultElement.parentNode.appendChild(p);
    }
}

$(".detectOnClick img").on("click", handleClick);

async function uploadModel() {
    const file = document.getElementById("fileM").files[0];
    if (!file) {
        alert("Please select a .tflite file.");
        return;
    }

    // Validate file extension
    if (file.name.split('.').pop().toLowerCase() !== "tflite") {
        alert("Invalid file type. Please upload a .tflite file.");
        return;
    }

    try {
        // Create a temporary URL for the uploaded file
        const tempUrl = URL.createObjectURL(file);

        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm");
        objectDetector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: tempUrl, // Use the temporary URL here
                delegate: "GPU"
            },
            scoreThreshold: 0.5,
            runningMode: runningMode
        });

        M.toast({ html: "Custom model loaded successfully.", classes: "green" });
        $("#overlay").fadeOut();
        $(".detectOnClick img").fadeIn();
        $(".detectOnClick img").click();
    } catch (error) {
        console.log("Error loading the custom model:", error);
    }
}

document.getElementById("fileM").addEventListener("change", uploadModel);