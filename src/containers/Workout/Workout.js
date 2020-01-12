import { drawKeyPoints, drawSkeleton, drawAngle } from "./utils";
import React, { Component } from "react";
import { Button } from 'antd';
import * as posenet from '@tensorflow-models/posenet'
import Timer from '../../components/UI/Timer/Timer'
import BackButton from "../../components/UI/BackButton/BackButton";
import calculateElbowAngle from "./algorithms/calculateElbowAngle"

class PoseNet extends Component {
  static defaultProps = {
    videoWidth: window.innerWidth,
    videoHeight: window.innerHeight-220,
    flipHorizontal: true,
    algorithm: "single-pose",
    showVideo: true,
    showSkeleton: true,
    showPoints: true,
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
    maxPoseDetections: 2,
    nmsRadius: 20,
    outputStride: 16,
    imageScaleFactor: 0.5,
    skeletonColor: "#ffadea",
    skeletonLineWidth: 6,
    loadingText: "Loading...please be patient..."
  };

  constructor(props) {
    super(props, PoseNet.defaultProps)
    this.state = {
        seconds: '00',
        isClicked : false,
        value: '2',
        started: false,
        paused: false
    }
    this.secondsRemaining;
    this.intervalHandle;
    this.startCountDown = this.startCountDown.bind(this);
    this.pauseCountDown = this.pauseCountDown.bind(this);
    this.tick = this.tick.bind(this);
  }

  tick() {
    var min = Math.floor(this.secondsRemaining / 60);
    var sec = this.secondsRemaining - (min * 60);

    this.setState({
      value: min,
      seconds: sec,
    })

    if (sec < 10) {
      this.setState({
        seconds: "0" + this.state.seconds,
      })

    }

    if (min < 10) {
      this.setState({
        value: "0" + min,
      })

    }

    if (min === 0 & sec === 0) {
      clearInterval(this.intervalHandle);
    }


    this.secondsRemaining--
  }

  startCountDown() {
    if (this.state.started == false) {
        this.intervalHandle = setInterval(this.tick, 1000);
        let time = this.state.value;
        this.secondsRemaining = time * 60;
        this.setState({
            started : true,
            paused: false,
            isClicked: true
          });
    } else if(this.state.paused === true) {
        this.intervalHandle = setInterval(this.tick, 1000);
        this.setState({
            isClicked : true,
            paused: false
          });
    }
    
  }

  pauseCountDown() {
    clearInterval(this.intervalHandle);
    this.setState({
        paused: true
    })
  }

  getCanvas = elem => {
    this.canvas = elem;
  };

  getVideo = elem => {
    this.video = elem;
  };

  async componentDidMount() {
    try {
      await this.setupCamera();
    } catch (error) {
      throw new Error(
        "This browser does not support video capture, or this device does not have a camera"
      );
    }

    try {
      this.posenet = await posenet.load({
        architecture: 'ResNet50',
        outputStride: 32,
        inputResolution: { width: 257, height: 200 },
        quantBytes: 2
      });
    } catch (error) {
      throw new Error("PoseNet failed to load");
    } finally {
      setTimeout(() => {
        this.setState({ loading: false });
      }, 200);
    }

    this.detectPose();
  }

  async setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Browser API navigator.mediaDevices.getUserMedia not available"
      );
    }
    const { videoWidth, videoHeight } = this.props;
    const video = this.video;
    video.width = videoWidth;
    video.height = videoHeight;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "face",
        width: videoWidth,
        height: videoHeight
      }
    });

    video.srcObject = stream;

    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        video.play();
        resolve(video);
      };
    });
  }

  detectPose() {
    const { videoWidth, videoHeight } = this.props;
    const canvas = this.canvas;
    const canvasContext = canvas.getContext("2d");

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    this.poseDetectionFrame(canvasContext);
  }

  poseDetectionFrame(canvasContext) {
    const {
      algorithm,
      imageScaleFactor,
      flipHorizontal,
      outputStride,
      minPoseConfidence,
      minPartConfidence,
      maxPoseDetections,
      nmsRadius,
      videoWidth,
      videoHeight,
      showVideo,
      showPoints,
      showSkeleton,
      skeletonColor,
      skeletonLineWidth
    } = this.props;

    const posenetModel = this.posenet;
    const video = this.video;

    const findPoseDetectionFrame = async () => {
      let poses = [];

      switch (algorithm) {
        case "multi-pose": {
          poses = await posenetModel.estimateMultiplePoses(
            video,
            imageScaleFactor,
            flipHorizontal,
            outputStride,
            maxPoseDetections,
            minPartConfidence,
            nmsRadius
          );
          break;
        }
        case "single-pose": {
          const pose = await posenetModel.estimateSinglePose(
            video,
            imageScaleFactor,
            flipHorizontal,
            outputStride
          );
          poses.push(pose);
          break;
        }
      }

      canvasContext.clearRect(0, 0, videoWidth, videoHeight);

      if (showVideo) {
        canvasContext.save();
        canvasContext.drawImage(video, 0, 0, videoWidth, videoHeight);
        canvasContext.restore();
      }

      poses.forEach((pose) => {
        let { score, keypoints } = pose;
        if (score >= minPoseConfidence) {
          if (showPoints) {
            drawKeyPoints(
              keypoints,
              minPartConfidence,
              skeletonColor,
              canvasContext
            );
          }
          calculateElbowAngle(pose, canvasContext);
          if (showSkeleton) {
            drawSkeleton(
              keypoints,
              minPartConfidence,
              skeletonColor,
              skeletonLineWidth,
              canvasContext
            );
          }
        }
      });
      requestAnimationFrame(findPoseDetectionFrame);
    };
    findPoseDetectionFrame();
  }

  render() {
    return (
      <div class="workout">
        <BackButton link={`/exercise/${this.props.match.params.workoutType}`} exact></BackButton>
        <div style={{ textAlign: "center", height: "100%", position: "relative" }}>
          <video style={{display: 'none'}} id="videoNoShow" playsInline ref={this.getVideo} />
          <video
            style={{ display: "none" }}
            id="videoNoShow"
            playsInline
            ref={this.getVideo}
          />
          <canvas className="webcam" ref={this.getCanvas} />
          <div style={{height: "auto", position: "absolute", width: "100%", bottom: "0"}}>
              <p>These are instructions on what to do!</p>
              <Button style={{marginRight: "15px"}} type="primary" size="large" className="workout-button" onClick={this.startCountDown}>Start</Button>
              <Button type="primary" size="large" className="workout-button" onClick={this.pauseCountDown}>Pause</Button>
              <Timer value={this.state.value} seconds={this.state.seconds} />
          </div>
        </div>
      </div>
    );
  }
}

export default PoseNet;
