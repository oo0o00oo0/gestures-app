import styled from "styled-components"
import { useRef, useEffect, useState } from "react"
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils"
import * as cam from "@mediapipe/camera_utils"
import { Hands } from "@mediapipe/hands"
import Webcam from "react-webcam"
import { useStore } from "state/store"

function Recording() {
  const recordTime = 5

  let camera = null
  let clients = new Array()

  // ZUSTAND STATE SETTERS
  const setPoints = useStore((state) => state.setPoints)

  // DOM REFS
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const timerRef = useRef()

  const canRecord = useRef(false)

  let count = recordTime
  let countdownTimer

  function displayCount() {
    timerRef.current.innerHTML = `time: ${count}`
    if (count <= 0) {
      clearInterval(countdownTimer)
    }
    if (count > 0) {
      count = count - 1
    }
  }

  function reset() {
    setPoints([])
    canRecord.current = false
    count = recordTime
    clients = []
    timerRef.current.innerText = `time: ${recordTime}`
    countdownTimer = setInterval(displayCount, 500)
  }

  function recordData(stream) {
    timerRef.current.innerText = `time: ${count}`
    countdownTimer = setInterval(displayCount, 500)
    canRecord.current = true
    setTimeout(function () {
      canRecord.current = false
      setPoints(stream)
      console.log("STREAM:", stream)
    }, recordTime * 1000)
  }

  function onResults(results) {
    canvasRef.current.width = webcamRef.current.video.videoWidth
    canvasRef.current.height = webcamRef.current.video.videoHeight
    const canvasElement = canvasRef.current
    const canvasCtx = canvasElement.getContext("2d")
    canvasCtx.save()
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    )

    if (results.multiHandLandmarks.length !== 0) {
      for (const landmarks of results.multiHandLandmarks) {
        canRecord.current &&
          landmarks.map((lm) => clients.push(lm.x, lm.y, lm.z))

        drawConnectors(canvasCtx, landmarks, Hands.HAND_CONNECTIONS, {
          color: "#FFFFFF",
        })
        drawLandmarks(canvasCtx, landmarks, {
          color: "#1E39D4",
          lineWidth: 2,
        })
      }
    }
    canvasCtx.restore()
  }

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1635986972/${file}`
      },
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    hands.onResults(onResults)

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await hands.send({ image: webcamRef.current.video })
        },
        // width: 640,
        // height: 480,
      })
      camera.start()
    }
  }, [])

  return (
    <>
      <UIHolder>
        <ResetButton onClick={() => reset()}>reset</ResetButton>
        <RecordButton
          onClick={() => {
            recordData(clients)
          }}
        >
          Record
          <div ref={timerRef} style={{ width: "100%", height: "50%" }}></div>
        </RecordButton>
      </UIHolder>
      <RecordingHolder>
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            // opacity: 0,
            border: "orange 3px solid",
            width: "100%",
            height: "100%",
            textAlign: "center",
            zIndex: 1,
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",

            border: "1px solid hotpink",
            width: "100%",
            height: "100%",
            textAlign: "center",
            zIndex: 20,
          }}
        ></canvas>
      </RecordingHolder>
    </>
  )
}
const UIHolder = styled.div`
  margin: 4rem;
  position: absolute;
  left: 0;
  height: 100%;
`

const ResetButton = styled.div`
  padding: 3px;
  cursor: pointer;
  z-index: 9999;
  position: absolute;
  top: 90px;
  width: 90px;
  height: 90px;
  background: blue;
`
const RecordButton = styled.div`
  padding: 3px;
  cursor: pointer;
  z-index: 9999;
  position: absolute;
  left: 0;
  width: 90px;
  height: 90px;
  background: hotpink;
`
export default Recording

const RecordingHolder = styled.div`
  position: absolute;
  left: 50%;
  top: 0%;
  margin-top: 2em;
  transform: translate(-50%, 0);

  border: white solid 2px;
  width: 100%;
  height: 50%;

  max-width: 640px;
  max-height: 500px;
`
