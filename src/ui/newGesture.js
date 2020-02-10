let ml5 = require("ml5");

let poseNet;
let video;
let pose;
let poses = 0;

let brain;
let curPoses = [];
let record = false;

function setup(){
	createCanvas(500, 400);
	video = document.getElementById("video");

	poseNet = ml5.poseNet(video, {
		inputResolution: 417
	}, modelLoaded);

	poseNet.on("pose", gotPose);

	setupTraining();
}

function modelLoaded(){
	console.log("model loaded");
}

function setupTraining(){
	curPoses = [];

	brain = ml5.neuralNetwork({
		task: "classification",
		debug: true,
		inputs: 15,
		outputs: 1,
		depth: 4
	})
}

function testTrain(i = 0){
	i++;
	video.play();
	record = true;

	video.onended = function(){
		record = false;

		if (i%2 == 0){
			gesture = "leftWave";
			video.src = "https://cdn.discordapp.com/attachments/366568880413343746/676422482189746196/received_789329468242228.mp4"
		}
		else{
			gesture = "rightWave";
			video.src = "https://cdn.discordapp.com/attachments/366568880413343746/676387708968632321/received_537545687107800.mp4"
		}

		train(gesture);

		setTimeout(function(){
			if (i < 3)
				testTrain(i);
			else
				done();
		}, 500);
	}
}

function train(gesture){
	console.log("added data");
	brain.addData(curPoses, [gesture]);
	curPoses = [];
}

function done(){
	brain.normalizeData();
	brain.train({epochs:50}, () => {
		brain.save();
	});
}

function gotPose(res){
	pose = res[0];

	if (record && pose != undefined){
		poses++;
		curPoses.push(pose.pose.keypoints);
	}
}

function draw(){
	let canvas = document.getElementById("canvas");
	let ctx = canvas.getContext("2d");

	ctx.clearRect(0, 0, canvas.width, canvas.height)

	if (pose) {
		for (let i=0; i < pose.pose.keypoints.length; i++){
			if (pose.pose.keypoints[i].score < 0.3) continue;

			let x = pose.pose.keypoints[i].position.x;
			let y = pose.pose.keypoints[i].position.y;
			ctx.fillStyle = "red"
			ctx.fill();

			ctx.beginPath()
			ctx.ellipse(x, y, 16, 16, Math.PI / 4, 0, 2* Math.PI);
			ctx.stroke()
		}

		for (let i=0; i < pose.skeleton.length; i++){
			let a = pose.skeleton[i][0];
			let b = pose.skeleton[i][1];
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.moveTo(a.position.x, a.position.y);
			ctx.lineTo(b.position.x, b.position.y);
			ctx.stroke();
		}
	}
}

function pps(){
	poses = 0;
	record = true
	let start = (new Date()).getTime();
	video.play();
	video.onended = function(){
		record = false
		let end = (new Date()).getTime();
		console.log(poses);
		console.log("logged " + (poses/((end-start)*0.001)) + " pps");
	}
}