let video;
let postNet;
let pose;
let skeleton;
let brain;
let state='waiting';
let targetLabel;
let inputs = [];
var gesture_select=0, pose_record_count=0;
function keyPressed(){
  if(key == 's') {
    brain.saveData();
  } 
  else if(key == 'q'|| key == 'w'){
    if(key == 'q'){
        targetLabel = 'hello';
      gesture_selec=9;
        console.log(targetLabel);     
      }
    if(key == 'w'){
        targetLabel = 'play';
      gesture_selec=10;
        console.log(targetLabel);     
      }
      setTimeout(function(){
      console.log('collecting');
      state = 'collecting';
      setTimeout(function(){
      console.log('not collecting');
      state = 'waiting';
      },10000);
    },5000);
  }
  else if(key == 't'){
      dataReady();
    }
}


function setup() {
  createCanvas(500, 400);
  video = createCapture(VIDEO);
  video.hide();
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose',gotPoses);
  
  let options = {
    inputs:10,
    outputs:2,
    task:"classification",
    debug:true
  }
  brain = ml5.neuralNetwork(options);
  //brain.loadData('xs.json',dataReady);
}
function dataReady(){
  console.log('start');
  brain.normalizeData();
  console.log('start_training');
  brain.train({epochs:50}, finished);
}

function finished(){
  console.log('model finished');
  brain.save();
}

function gotPoses(poses) {
  //console.log(poses)
  if(poses.length > 0){
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
    /*if(state == 'collecting')
    {
      let input_arr=[];
      for(let j = 0; j < 5; j++){
        let inputs = [];
        for(let i = 0; i < pose.keypoints.length; i++){
          let x = pose.keypoints[i].position.x;
          let y = pose.keypoints[i].position.y;
          inputs.push(x);
          inputs.push(y);
        }
        input_arr[j]=inputs;
      }
      let target = [targetLabel];
      brain.addData(input_arr, target);
    }*/
    if(state == 'collecting')
    {
      //let inputs = [];
      //for(let i = 0; i < 9; i++){
      let x = pose.keypoints[j].position.x;
      let y = pose.keypoints[j].position.y;
      inputs.push(x);
      inputs.push(y);
      //}
      pose_record_count++;
      if(pose_record_count>4){
        let target = [targetLabel];
        brain.addData(inputs, target);
        inputs = [];
        pose_record_count=0;
      }
    }
  }
}

function modelLoaded() {
  console.log('poseNet ready');
}

function draw() {
  image(video,0,0);
  if(pose){
    //for(let i = 0; i < pose.keypoints.length; i++){
      let x = pose.keypoints[j].position.x;
      let y = pose.keypoints[j].position.y;
      fill(0,255,0);
      ellipse(x,y,16,16);
    //}
    for(let i = 0; i < skeleton.length; i++){
      let a = skeleton[i][0];
      let b = skeleton[i][1];
      strokeWeight(2);
      stroke(255);
      line(a.position.x,a.position.y,b.position.x,b.position.y);
    }
  }
}