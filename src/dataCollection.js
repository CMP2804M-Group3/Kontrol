const ml5 = require('ml5');
// ml5.js: Pose Classification
// The Coding Train / Daniel Shiffman
// https://thecodingtrain.com/Courses/ml5-beginners-guide/7.2-pose-classification.html
// https://youtu.be/FYgYyq-xqAw

// All code: https://editor.p5js.org/codingtrain/sketches/JoZl-QRPK

// Separated into three sketches
// 1: Data Collection: https://editor.p5js.org/codingtrain/sketches/kTM0Gm-1q
// 2: Model Training: https://editor.p5js.org/codingtrain/sketches/-Ywq20rM9
// 3: Model Deployment: https://editor.p5js.org/codingtrain/sketches/c5sDNr8eM

let video;
let poseNet;
let pose;
let skeleton;

let brain;
let poseLabel = "";

let state = 'waiting';
let targetLabel;

function keyPressed() {
  let labels = {
    'q': "Left_arm_up",
    'w': "Right_arm_up",
    'e': "Left_arm_out",
    'r': "Right_arm_out",
    'y': "Left_arm_90_up",
    'u': "Right_arm_90_up",
    'i': "T_pose",
    'o': "base"
  }
  if (key == 't') {
    brain.normalizeData();
    brain.train({epochs: 250}, finished); 
  } else if (key == 's') {
    brain.saveData();
  } else {
    targetLabel = labels[key];
    console.log(targetLabel);
    setTimeout(function() {
      console.log('collecting');
      state = 'collecting';
      setTimeout(function() {
        console.log('not collecting');
        state = 'waiting';
      }, 60000);
    }, 2500);
  }
}

function setup() {
  createCanvas(1280, 960);
  video = createCapture(VIDEO);
  video.size(1280, 960)
  video.hide();
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose', gotPoses);

  let options = {
    inputs: 34,
    outputs: 4,
    task: 'classification',
    debug: true
  }
  brain = ml5.neuralNetwork(options);
  
  // // LOAD PRETRAINED MODEL
  const modelInfo = {
    model: '../2MinModel/model.json',
    metadata: '../2MinModel/model_meta.json',
    weights: '../2MinModel/model.weights.bin',
  };
  brain.load(modelInfo, brainLoaded);

  // LOAD TRAINING DATA
  // brain.loadData('../data/1minALl90Deg2min.json');
}

function brainLoaded() {
  console.log('pose classification ready!');
  classifyPose();
}

function classifyPose() {
  if (pose) {
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

function gotResult(error, results) {  
  if (results[0].confidence > 0.75) {
    console.log(results[0])
    poseLabel = results[0].label.toUpperCase() + " " + (results[0].confidence*100).toFixed(2) + "%";
  }
  classifyPose();
}

function dataReady() {
  brain.normalizeData();
  brain.train({
    epochs: 350
  }, finished);
}

function finished() {
  console.log('model trained');
  brain.save();
  classifyPose();
}

function gotPoses(poses) {
  // console.log(poses); 
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
    if (state == 'collecting') {
      let inputs = [];
      for (let i = 0; i < pose.keypoints.length; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      let target = [targetLabel];
      brain.addData(inputs, target);
    }
  }
}


function modelLoaded() {
  console.log('poseNet ready');
}

function draw() {
  push();
  translate(video.width, 0);
  // translate(1280, 0);
  scale(-1, 1);
  // scale(2, 2);
  image(video, 0, 0, 1280, 960);

  if (pose) {
    for (let i = 0; i < skeleton.length; i++) {
      let a = skeleton[i][0];
      let b = skeleton[i][1];
      strokeWeight(2);
      stroke(0);

      line(a.position.x, a.position.y, b.position.x, b.position.y);
    }
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      fill(0);
      if(state == "collecting"){
        fill(255, 0,0);
      }
      stroke(255);
      ellipse(x, y, 16, 16);
    }
  }
  pop();

  fill(0);
  noStroke();
  textSize(64);
  textAlign(CENTER, CENTER);
  text(poseLabel, width / 2, height - 20);
}