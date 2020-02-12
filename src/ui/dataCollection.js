const ml5 = require('ml5');

let that;
let brain;

// "https://cdn.discordapp.com/attachments/366568880413343746/676387708968632321/received_537545687107800.mp4"

class inputVideo {
    /**
     * @param {string} name Name of the video
     * @param {string} src URL poiting to the video file
     * @constructor
     */
    constructor(name, src, callback) {
        this.name = name;
        this.video = document.getElementById("video");
        this.video.src = src;

        this.poseNet = ml5.poseNet(this.video, {
            inputResolution: 417,
            outputStride: 32,
            architecture: "ResNet50",
            quantBytes: 4
        }, callback);
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

    setName(name){
        this.name = name;
    }

    loadVideo(src, callback){
        this.video.src = src;
        this.video.onloadeddata = callback;
    }

    /**
     * Begins training on the video object.
     * @param {Function} callback Callback called when video is finished playing.
     */
    startTraining(callback) {
        this.collecting = true;
        this.video.play();
        this.video.onended = () => {
            this.collecting = false;
            console.log("Got Pose data!");
            if( callback ) { callback(); }
        };
    }

    /**
     * Sets up the class to begin classifiying its video.
     * @param {Function} callback Callback called when model is ready.
     */
    initClassify(callback){
        brain.load("models/model.json", callback);
    }

    /**
     * Classifies an array of points into a gesture.
     * @param {Array} frameData Array of points to be classified
     * @param {Function} callback Callback called when classification is complete.
     */
    classify(frameData, callback){
        brain.classify(frameData).then((data) => {
            let maxConfidence = 0;
            let maxLabel = "";

            for (let i=0; i < data.length; i++){
                if (data[i].confidence > maxConfidence){
                    maxConfidence = data[i].confidence;
                    maxLabel = data[i].label;
                }
            }

            callback(maxConfidence, maxLabel);
        });
    }

    /**
     * Parses a video into an array of points representing certain body parts.
     * @param {Function} callback Callback called when classification is complete.
     */
    getFrameData(callback){
        let self = this;

        this.data = [];
        this.collecting = true;

        this.video.play();
        this.video.onended = function(){
            callback(self.data);
            self.collecting = false;
            self.video.onended = null;
        }
    }

    /**
     * Renders data from a specified pose onto the canvas.
     * @param {Object} pose Pose data
     */
    drawPoints(pose){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

    /**
     * Handler for when PoseNet detecs a pose.
     * @param {Array} poses Array of poses.
     */
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
    let sliced = data.slice(0, 250);
    brain.addData(sliced, [label]);
}

function trainBrain(epochs = 500) {
    brain.normalizeData();
    brain.train({"epochs":epochs}, () => {
        brain.save();
    });
}

let video

function trainVideos(videos, exitFunc, i = 0) {
    video.data = [];
    video.setName(videos[i].name);
    video.loadVideo(videos[i].src, () => {
        video.startTraining(() => {
            i++;
            addData(video.data, video.name);

            if (i < videos.length) {
                trainVideos(videos, exitFunc, i);
            } else {
                exitFunc();
            }
        });
    });
}

let videos = [];

for (var i=1; i < 49; i++){
    videos.push({
        name: "leftWave",
        src: "training/leftWave/left (" + i + ").mp4"
    })
}

for (var i=1; i < 49; i++){
    videos.push({
        name: "rightWave",
        src: "training/rightWave/right (" + i + ").mp4"
    })
}

function compareVideo(i){
    video.data = [];
    video.setName(videos[i].name);
    video.loadVideo(videos[i].src, () => {
        video.initClassify(() => {
            video.getFrameData((data) => {
                video.classify(data, (confidence, label) => {
                    console.log("this is a " + label + " with " + (confidence * 100) + "% accuracy.")
                });
            });
        });
    });
}

function setup() {
    brain = ml5.neuralNetwork({
        task: "classification",
        debug: true,
        inputs: 250,
        outputs: 1
    });

    createCanvas(600, 640);

    video = new inputVideo(videos[0].name, videos[0].src, () => {
        //trainVideos(videos, trainBrain);
    });
}

function draw() {

}
