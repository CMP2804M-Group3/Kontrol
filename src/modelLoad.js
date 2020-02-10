let video;
let postNet;
let pose;
let skeleton;
let brain;
let state='waiting';
let targetLabel;
let inputs = [];
let ges_count=0;
function setup() {
  createCanvas(500, 400);
  video = createCapture(VIDEO);
  video.hide();
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose',gotPoses);
  
  let options = {
    inputs:40,
    outputs:1,
    task:"classification",
    debug:true
  }
  brain = ml5.neuralNetwork(options);
  const modelInfo = {
  model: 'model/model.json',
  metadata: 'model/model_meta.json',
  weights: 'model/model.weights.bin',
};
  brain.load(modelInfo,brainLoaded);
  //brain.loadData('xs.json',dataReady);
}
function brainLoaded() {
  console.log('Model ready');
  classifyPose();
}

function classifyPose(){
  if(pose){
    //console.log(p);
    //let inputs = [];
    for(let i = 7; i < 11; i++){
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      inputs.push(x);
      inputs.push(y);
    } 
    brain.classify(inputs,gotResult);
    if(++ges_count>4){
      ges_count=0;
      brain.classify(inputs,gotResult);
    }
    else{
      setTimeout(classifyPose,1000);
    }
  }
  else{
    setTimeout(classifyPose,100);
  }
}

function gotResult(error, results){
  console.log(results);
  console.log(results[0].label);
  inputs=[];
  classifyPose();
  
}
function gotPoses(poses) {
  //console.log(poses)
  if(poses.length > 0){
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
    if(state == 'collecting')
    {
      let inputs = [];
      for(let i = 7; i < 11; i++){
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
  console.log('Posenet ready');
}

function draw() {
  image(video,0,0);
  if(pose){
    for(let i = 0; i < pose.keypoints.length; i++){
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      fill(0,255,0);
      ellipse(x,y,16,16);
    }
    for(let i = 0; i < skeleton.length; i++){
      let a = skeleton[i][0];
      let b = skeleton[i][1];
      strokeWeight(2);
      stroke(255);
      line(a.position.x,a.position.y,b.position.x,b.position.y);
    }
  }
}
