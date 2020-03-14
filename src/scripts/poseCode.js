running = true;
const dialog = require('electron').remote.dialog;
const ml5 = require('ml5');
let video, poseNet, pose, skeleton, canvas, brain;
let win = remote.getCurrentWindow();
let ready = false;
let poseLabel = "";
let state = 'waiting';
let lastPoses = [1, 2, 3];
let settingsWin;
let showSkeleton;
let webcamAllowed;
let connection = false;

let images = {
    "rewind": "",
    "fastForward": "",
    "goPrevious": "",
    "goNext": "",
    "playPause": "",
    "volumeDown": "",
    "volumeUp": "",
    "mute": "",
};
let map = {
    "Left_arm_up": rewind,
    "Right_arm_up": fastForward,
    "Left_arm_out": goPrevious,
    "Right_arm_out": goNext,
    "T_pose": playPause,
    "Left_arm_90_up": volumeDown,
    "Right_arm_90_up": volumeUp,
    "Both_arms_90_down": mute,
    "base": passFunc
};
let controlMap = {
    "play": playPause,
    "rewind": rewind,
    "fastForward": fastForward,
    "previous": goPrevious,
    "next": goNext,
    "volumeDown": volumeDown,
    "volumeUp": volumeUp,
    "mute": mute,
    "base": passFunc
};




function passFunc() {
}

function loadImages() {

    let imagePaths = {
        "Left arm up": loadImage("images/up_left.png"),
        "Right arm up": loadImage("images/up_right.png"),
        "Left arm out": loadImage("images/out_left.png"),
        "Right arm out": loadImage("images/out_right.png"),
        "T Pose": loadImage('images/t.png'),
        "Left arm 90deg up": loadImage("images/90_left.png"),
        "Right arm 90deg up": loadImage("images/90_right.png"),
    };

    images.playPause = imagePaths[settings.getGestureFromAction("play")];
    images.volumeDown = imagePaths[settings.getGestureFromAction("volumeDown")];
    images.volumeUp = imagePaths[settings.getGestureFromAction("volumeUp")];
    images.goPrevious = imagePaths[settings.getGestureFromAction("previous")];
    images.goNext = imagePaths[settings.getGestureFromAction("next")];
    images.rewind = imagePaths[settings.getGestureFromAction("rewind")];
    images.fastForward = imagePaths[settings.getGestureFromAction("fastForward")];
}

/**
 * Setup is run once when the file is loaded, sets up the window the neural network and the
 * canvas.
 */
function setup() {
    /* Show the window resize it and move it to the centre of the window. */
    win.show();
    win.setSize(1200, 800);
    win.center();

    $(".rightPanel li").on("click", function () {
        $(".rightPanel .selected").toggleClass("selected");
        $(this).toggleClass("selected");
    });

    /* Read the IP & Port from the settings file and create a
       kodi controller instance with those details. */
    settings = new JSONReader(configPath, () => {
        let theme = settings.readSetting("theme");
        document.documentElement.setAttribute('data-theme', theme == "Light Blue" ? "light" : "dark");
        showSkeleton = settings.readSetting("showSkeleton");
        webcamAllowed = settings.readSetting("webcamEnabled");

        map.T_pose = controlMap[settings.getActionFromGesture("T Pose")];
        map.Left_arm_up = controlMap[settings.getActionFromGesture("Left arm up")];
        map.Right_arm_up = controlMap[settings.getActionFromGesture("Right arm up")];
        map.Left_arm_out = controlMap[settings.getActionFromGesture("Left arm out")];
        map.Right_arm_out = controlMap[settings.getActionFromGesture("Right arm out")];
        map.Left_arm_90_up = controlMap[settings.getActionFromGesture("Left arm 90deg up")];
        map.Right_arm_90_up = controlMap[settings.getActionFromGesture("Right arm 90deg up")];

        loadImages();


        let ip = settings.readSetting("ip");
        let port = settings.readSetting("port");
        kodi = new kodiController(ip, port);
        kodi.pingKodi(`http://${ip}:${port}/jsonrpc`).then((data) => {
            connection = data;
            setTimeout(() => {
                let status = $("#connectionStatus");
                status.css("width", "100%");
                if (connection) {
                    status.children()[0].src = "images/wifi.svg";
                    status.children()[1].innerText = "Connected";
                }
            }, 200);
        });


        /* Create a canvas and insert it under the title. */
        canvas = createCanvas(640, 360);
        canvas.parent("title");


        /* Create the neural network with the specified options. */
        let options = {
            inputs: 34,
            outputs: 4,
            task: 'classification',
            debug: true
        };
        brain = ml5.neuralNetwork(options);

        /* Load the model */
        const modelInfo = {
            model: 'model/model.json',
            metadata: 'model/model_meta.json',
            weights: 'model/model.weights.bin'
        };
        if (webcamAllowed) {
            brain.load(modelInfo, webCamSetup);
        } else {
            brain.load(modelInfo, showPopup);
        }
    });

}

/**
 * Setup the webcam and posenet.
 */
function webCamSetup() {
    showLoading();
    navigator.mediaDevices.getUserMedia({video: true}).then(() => {
        video = createCapture(VIDEO);
        video.hide();

        poseNet = ml5.poseNet(video, {
            multiplier: parseFloat(settings.readPerformanceSetting("multiplier")),
            outputStride: parseInt(settings.readPerformanceSetting("stride")),
            architecture: settings.readPerformanceSetting("architecture"),
            quantBytes: parseInt(settings.readPerformanceSetting("quant"))
        }, modelLoaded);
    }).catch(() => {
        console.log("No webcam");
        setTimeout(showWarningPopup("Webcam Error", "We can't connect to your webcam!", hideLoading), 1000);

    });

}


function showPopup() {
    settingsWin = new BrowserWindow({
        width: 350,
        height: 180,
        frame: false,
        icon: `file://${__dirname}/icons/win/icon.ico`,
        transparent: true,
        fullScreenable: false,
        maximizable: false,
        resizable: false,
        fullscreen: false,
        show: true,
        webPreferences: {
            nodeIntegration: true
        }
    });

    settingsWin.loadURL(`file://${__dirname}/pages/popup.html`);

    $("html").css("pointer-events", "none");
    settingsWin.setAlwaysOnTop(true);
    settingsWin.on("closed", () => {
        settingsWin = null;
        $("html").css("pointer-events", "all");
        webCamSetup();
    });
}

/**
 * Called constantly and runs the pose through the neural network and classifies it then calls
 * got result else it calls itself again after 100ms.
 */
function classifyPose() {
    if (pose && running) {
        let inputs = [];
        for (let i = 0; i < pose.keypoints.length; i++) {
            let x = pose.keypoints[i].position.x;
            let y = pose.keypoints[i].position.y;
            inputs.push(x);
            inputs.push(y);
        }
        brain.classify(inputs, gotResult);
    } else {
        setTimeout(classifyPose, 100);
    }
}

/**
 * Called once the brain classifies a pose.
 * @param {Error} error The error if present
 * @param {Object} results The results from classifyPose
 */
function gotResult(error, results) {

    $(".greenBG").removeClass("greenBG");

    if (results[0].confidence > 0.75) {
        setItem(lastPoses, results[0].label, 5);

        if (lastPoses.every((i) => {
            return i === lastPoses[0];
        })) {

            let selector = "#" + map[results[0].label].name;
            $(selector).addClass("greenBG");
            if (results[0].label !== "base" && connection) {
                map[results[0].label]();
            }
            setTimeout(classifyPose, 1000);
        } else {
            classifyPose();
        }
    } else {
        classifyPose();
    }
}

/**
 * Sets the pose and skeleton variable from the list of poses retrieved from poseNet.
 * @param {Object} poses
 */
function gotPoses(poses) {
    if (poses.length > 0) {
        pose = poses[0].pose;
        skeleton = poses[0].skeleton;
    }
}

/**
 * Called when pose net is loaded then it calls gotPoses when a pose is detected.
 */
function modelLoaded() {
    hideLoading();
    console.log('poseNet ready');
    poseNet.on('pose', gotPoses);
    ready = true;
    classifyPose();
}



/**
 * Called in a loop, draws the webcam video and pose to the canvas if the camera is activated
 * else it draws a gray screen and a camera icon.
 */
function draw() {
    if (ready) {
        push();
        translate(video.width, 0);
        scale(-1, 1);
        image(video, 0, 0, video.width, video.height);
        if (showSkeleton) {
            if (pose) {
                for (let i = 0; i < skeleton.length; i++) {
                    let a = skeleton[i][0];
                    let b = skeleton[i][1];
                    strokeWeight(2);
                    stroke(0);
                    line(a.position.x, a.position.y, b.position.x, b.position.y);
                }
                for (let i = 5; i < pose.keypoints.length; i++) {
                    let x = pose.keypoints[i].position.x;
                    let y = pose.keypoints[i].position.y;
                    fill(0);
                    stroke(255);
                    ellipse(x, y, 16, 16);
                }
            }
        }

        pop();
        push();
        tint(255, 127.5);
        try {
            image(images[$(".rightPanel .selected")[0].id], 0, 0, 640, 360);

        } catch (e) {
        }
        pop();


    } else {
        // Draw a camera icon
        background("#e6efe9");
        push();
        translate(320, 180);
        fill(0);
        rect(-50, -25, 75, 50, 5);
        beginShape();
        vertex(30, -5);
        vertex(55, -25);
        vertex(55, 30);
        vertex(30, 10);
        endShape(CLOSE);
        pop();

    }
}