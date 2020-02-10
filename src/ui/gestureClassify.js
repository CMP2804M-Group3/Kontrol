const ml5 = require('ml5');
let brain, poseNet, pose;
let frames = [];

function setup() {
    createCanvas(600, 640);
    video = createCapture(VIDEO);
    // video.hide();
    poseNet = ml5.poseNet(video, () => {
        poseNet.on('pose', gotPoses);
        brain = ml5.neuralNetwork({
            task: "classification",
            debug: true,
            inputs: 108,
            outputs: 2
        });
        const modelInfo = {
            model: 'trainedModel/model.json',
            metadata: 'trainedModel/model_meta.json',
            weights: 'trainedModel/model.weights.bin',
        };
        brain.load(modelInfo, brainLoaded);

    });

    
}


function brainLoaded() {
    console.log('pose classification ready!');
    }

function gotPoses(poses) {
    if (poses.length > 0) {
        // console.log(poses);
        classifyPose(poses[0].pose);
    }
}

function classifyPose(pose) {
    let inputs = [];
    for (let i = 5; i <= 10; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
    }
    for (let i = 0; i < 12; i++) { frames.push(inputs[i]);}
    if(frames.length > 108){
        frames = frames.slice(frames.length - 108, frames.length);
    }    
    if(frames.length === 108){
        brain.classify(frames, gotResult);
    }
}


function gotResult(error, results) {
    console.log(results[0].label);
    console.log(results[0].confidence);
}

function draw() {

}