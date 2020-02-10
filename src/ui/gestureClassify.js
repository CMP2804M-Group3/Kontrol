const ml5 = require('ml5');
let brain, poseNet;
let frames = [];

function setup() {
    createCanvas(600, 640);
    video = createCapture(VIDEO);
    video.hide();
    poseNet = ml5.poseNet(video);

    brain = ml5.neuralNetwork({
        task: "classification",
        debug: true,
        inputs: 100,
        outputs: 2
    });
    const modelInfo = {
        model: 'model2/model.json',
        metadata: 'model2/model_meta.json',
        weights: 'model2/model.weights.bin',
    };
    brain.load(modelInfo, brainLoaded);
}

function addFrame(frame) {
    if ( frames.length === 108 ) { frames.slice(0, 12); }
    for (let i = 0; i < frame; i++) { frames.push(frame[i]);}
    if(frames.length > 108){
        frames.slice(Math.max(frames.length - 108, 0))
    }
    if(frames.length === 108){
        brain.classify(frames, gotResult);
    }
}

function brainLoaded() {
    console.log('pose classification ready!');
    poseNet.on('pose', gotPoses);
    classifyPose();
}

function gotPoses(poses) {
    if (poses.length > 0) {
        pose = poses[0].pose;
        skeleton = poses[0].skeleton;
    }
}

function classifyPose() {
    if (pose) {
        let inputs = [];
        for (let i = 5; i < 10; i++) {
            let x = pose.keypoints[i].position.x;
            let y = pose.keypoints[i].position.y;
            inputs.push(x);
            inputs.push(y);
        }
        addFrame(inputs);

    } else {
        setTimeout(classifyPose, 100);
    }
}


function gotResult(error, results) {

    if (results[0].confidence > 0.75) {
        poseLabel = results[0].label.toUpperCase();
    }
    //console.log(results[0].confidence);
    classifyPose();
}

function draw() {

}