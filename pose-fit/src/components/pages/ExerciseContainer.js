import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tmPose from '@teachablemachine/pose';

const webcamHeight = 700;
const webcamWidth = 700;

const ExerciseContainer = () => {
  const [ctx, setCtx] = useState(null);
  const [labelContainer, setLabelContainer] = useState(null);
  const [webcam, setWebcam] = useState(null);
  const [model, setModel] = useState(null);
  const [maxPredictions, setMaxPredictions] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const path = 'https://teachablemachine.withgoogle.com/models/lAMuC8mGv/';
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
  }, [webcam, ctx, labelContainer, model, maxPredictions]);

  return (
    <div>
      <canvas ref={canvasRef} width={webcamWidth} height={webcamHeight} />
      <div id="label-container">
        {Array.from({ length: maxPredictions }, (_, i) => (
          <div key={i} />
        ))}
      </div>
    </div>
  );
};

export default ExerciseContainer;
