import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tmPose from '@teachablemachine/pose';
import './ExerciseContainer.css';

const webcamHeight = 600;
const webcamWidth = 600;

const ExerciseContainer = () => {
  const inputExercise = 'squat'; // 사용자가 입력한 운동 종목, 로컬 스토리지에서 가져오기
  const [ctx, setCtx] = useState(null);
  const [webcam, setWebcam] = useState(null);
  const [model, setModel] = useState(null);
  const canvasRef = useRef(null);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState(inputExercise + '-prepare');
  const [labelContainer, setLabelContainer] = useState(null);
  const [maxPredictions, setMaxPredictions] = useState(0);

  useEffect(() => {
    const init = async () => {
      const path = 'https://teachablemachine.withgoogle.com/models/RZqX0XVUT/';
      const modelPath = path + 'model.json';
      const metadataPath = path + 'metadata.json';

      const loadedModel = await tmPose.load(modelPath, metadataPath);
      const predictions = loadedModel.getTotalClasses();

      const flip = true; // whether to flip the webcam
      const newWebcam = new tmPose.Webcam(webcamWidth, webcamHeight, flip);
      await newWebcam.setup(); // request access to the webcam
      newWebcam.play();

      setModel(loadedModel);
      setMaxPredictions(predictions);
      setWebcam(newWebcam);
      setCtx(canvasRef.current.getContext('2d'));
      setLabelContainer(document.getElementById('label-container'));
    };

    init();

    return () => {
      if (webcam) {
        webcam.stop();
      }
      if (model) {
        model.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (webcam && ctx && labelContainer) {
      const loop = async () => {
        webcam.update(); // update the webcam frame
        await predict();
        window.requestAnimationFrame(loop);
      };

      const predict = async () => {
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);

        const prediction = await model.predict(posenetOutput);

        // for (let i = 0; i < maxPredictions; i++) {
        //   const classPrediction =
        //     prediction[i].className + ': ' + prediction[i].probability.toFixed(2);
        //   labelContainer.childNodes[i].innerHTML = classPrediction;
        // }
        
        if(prediction[1].probability.toFixed(2) == 1.00) {
          if(status === inputExercise) {
            setCount(count + 1);
          }
          setStatus(inputExercise + '-prepare');
        } else if(prediction[0].probability.toFixed(2) == 1.00) {
          setStatus(inputExercise);
        }

        drawPose(pose);
      };

      const drawPose = (pose) => {
        ctx.drawImage(webcam.canvas, 0, 0);
        
        if (pose) {
          const minPartConfidence = 0.5;
          tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
          tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
      };

      window.requestAnimationFrame(loop);
    }
  }, [webcam, ctx, labelContainer, model, maxPredictions, status]);

  return (
    <div>
      <canvas id="cam_canvas" ref={canvasRef} width={webcamWidth} height={webcamHeight} />
      <div id="reps">
        <div>Reps</div>
        <div>{count} / 5</div>
      </div>
      <div id="label-container">
        {Array.from({ length: maxPredictions }, (_, i) => (
          <div key={i} />
        ))}
      </div>
    </div>
  );
};

export default ExerciseContainer;
