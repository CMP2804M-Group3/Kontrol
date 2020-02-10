const ml5 = require('ml5');

let that;
let brain;

// "https://cdn.discordapp.com/attachments/366568880413343746/676387708968632321/received_537545687107800.mp4"

class inputVideo {
    constructor(name, src, callback) {
        this.name = name;
        this.video = document.getElementById("video");
        this.video.src = src;
        this.poseNet = ml5.poseNet(this.video, {inputResolution: 417}, callback);
        that = this;
        this.poseNet.on("pose", function (results) {
            that.gotPose(results); // I don't like using global video here but this scope gets lost :(
            // Maybe .bind() is the solution not sure how it works tho
        });
        this.collecting = false;

        this.data = [];
        this.canvas = document.getElementById("defaultCanvas0");
        this.ctx = this.canvas.getContext("2d");

    }

    startTraining(callback) {
        this.collecting = true;
        this.video.play();
        this.video.onended = () => {
            this.collecting = false;
            console.log("Got Pose data!");
            if( callback ) { callback(); }
        };
    }

    drawPoints(pose){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // background(0);
        // background(0);
        for (let i=5; i <= 10; i++){
            if (pose.pose.keypoints[i].score < 0.3) continue;

            let x = pose.pose.keypoints[i].position.x;
            let y = pose.pose.keypoints[i].position.y;
            this.ctx.fillStyle = "red";
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.ellipse(x, y, 8, 8, Math.PI / 4, 0, 2* Math.PI);
            this.ctx.stroke()
        }

        for (let i=0; i < pose.skeleton.length; i++){
            let a = pose.skeleton[i][0];
            let b = pose.skeleton[i][1];
            this.ctx.beginPath();
            this.ctx.lineWidth = 2;
            this.ctx.moveTo(a.position.x, a.position.y);
            this.ctx.lineTo(b.position.x, b.position.y);
            this.ctx.stroke();
        }

    }

    gotPose(poses) {
        let dataPoints = 0;
        if(this.collecting){
            if(poses.length > 0){
                let pose = poses[0].pose;
                this.drawPoints(poses[0]);
                for (let i = 5; i <= 10; i++) {
                    let x = pose.keypoints[i].position.x;
                    let y = pose.keypoints[i].position.y;
                    this.data.push(x);
                    this.data.push(y);
                }

            }
        }
    }
}


function addData(data, label) {
    let d100 = data.slice(0, 100);
    brain.addData(d100, [label]);
}

function trainBrain(epochs = 50) {
    brain.normalizeData();
    brain.train({"epochs":epochs}, () => {
        brain.save();
    });
}

function trainVideos(videos, exitFunc, i = 0) {
    let video = new inputVideo(videos[i].name, videos[i].src, () =>{
        video.startTraining(() => {
            // All done
            addData(video.data, video.name);
            i++;
            if(i < videos.length){
                trainVideos(videos, exitFunc, i);
            }else{
                exitFunc();
            }

        });
    });

}

function setup() {
    brain = ml5.neuralNetwork({
        task: "classification",
        debug: true,
        inputs: 100,
        outputs: 2
    });
    createCanvas(600, 640);

    let videos = [
        {"name": "rightWave", "src": "https://cdn.discordapp.com/attachments/366568880413343746/676387708968632321/received_537545687107800.mp4" },
        {"name": "leftWave", "src": "https://cdn.discordapp.com/attachments/366568880413343746/676422482189746196/received_789329468242228.mp4" }
    ];

    trainVideos(videos,  trainBrain);

}

function draw() {

}