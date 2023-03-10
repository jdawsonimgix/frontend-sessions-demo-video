import axios from "axios";
import React, { useEffect, useState } from "react";
import Imgix from "react-imgix";
import "./App.css";
import VideoJS from "./VideoJS";
import videojs from "video.js";
import "video.js/dist/video-js.css";

function App() {
  const [pic, setPic] = useState();
  const [sessionSourceId, setSessionSourceId] = useState(
    "no session. Please choose a file"
  ); //Used to check status.
  const [sessionStatus, setSessionStatus] = useState("");
  const [sessionFilename, setSessionFilename] = useState("");
  const [searchArray, setSearchArray] = useState([]);
  const [imgixUrl, setImgixUrl] = useState("");
  const [signedUrl, setSignedUrl] = useState(""); //backend status
  const [videoProcessStatus, setVideoProcessStatus] = useState(""); //backend status
  const [displayedSessionStatus, setDisplayedSessionStatus] =
    useState("No session status"); //frontend displayed
  const [displayedProcessStatus, setDisplayedProcessStatus] =
    useState("No process status"); //frontend displayed

  const playerRef = React.useRef(null);
  //src: "https://sourcerer.imgix.video/aa_video.mp4?fm=mp4",

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: imgixUrl,
        type: "application/x-mpegURL",
      },
    ],
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    // You can handle player events here, for example:
    player.on("waiting", () => {
      videojs.log("player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("player will dispose");
    });
  };

  useEffect(() => {
    //Used to set PENDING to CLOSED
    if (sessionStatus === "PENDING") {
      checkIfClosed();
    }
    //Use to set CLOSED status to COMPLETE
    if (sessionStatus === "CLOSED") {
      const interval = setInterval(() => {
        console.log("This will check if it's closed ever 7 seconds!");
        imgixHandleCheckStatus();
      }, 7000);
      return () => clearInterval(interval);
    }

    if (sessionStatus === "COMPLETE" && videoProcessStatus !== "VIDEO_READY") {
      setDisplayedSessionStatus("The session is complete!");
      setDisplayedProcessStatus("Your video is processing.");
      const intervalForProcessStatus = setInterval(() => {
        console.log("This will check videoProcessStatus every 7 seconds!");
        checkVideoProcess();
      }, 7000);
      return () => clearInterval(intervalForProcessStatus);
    }
    if (sessionStatus === "COMPLETE" && videoProcessStatus === "VIDEO_READY") {
      setSearchArray(sessionFilename);
      setDisplayedSessionStatus("The session is complete!");
      setDisplayedProcessStatus("Your video can now be played!");

      setImgixUrl(
        "https://sourcerer.imgix.video/" + sessionFilename + "?fm=hls"
      );
    }
  }, [sessionStatus, videoProcessStatus]);

  //Function to check if videoProcessStatus
  const checkVideoProcess = async (e) => {
    console.log("checkVideoProcessStatus function");

    //Set session to CLOSED.
    const videoProcessAxios = await axios
      .post(
        "https://backend-sessions-demo-video.vercel.app/checkVideoProcessStatus",
        sessionFilename
      )
      .then(console.log("Client - Checked video Processing"))
      .catch((error) => console.log(error.message));

    console.log(videoProcessAxios.data);
    setVideoProcessStatus(videoProcessAxios.data);
  };

  //Used to set PENDING status to CLOSED.
  const checkIfClosed = async (e) => {
    console.log("checkIfClosed function");
    console.log("session status is: " + sessionStatus);

    if (sessionStatus === "PENDING") {
      const valueData = { grabbedSessionSourceID: sessionSourceId };

      //Set session to CLOSED.
      const sessionStatusForAxios = await axios
        .post(
          "https://backend-sessions-demo-video.vercel.app/checkImgixCloseSession",
          valueData
        )
        .then(console.log("Client - CLOSE imgix session"))
        .catch((error) => console.log(error.message));

      setSessionStatus(sessionStatusForAxios.data.data.attributes.status);
    }
  };

  //IMGIX EXAMPLES: STARTING SESSION
  const imgixHandleSubmitForSessionStarting = async (e) => {
    e.preventDefault();

    const retrievedBackendData = await axios
      .post(
        "https://backend-sessions-demo-video.vercel.app/startImgixSession",
        {
          originalname: pic.name,
          mimetype: pic.type,
        }
      )
      .then(async (res) => {
        console.log(res);
        let tempFilename = res.data.sessionFilenameBackend;
        let myArrayForFilename = tempFilename.split();
        setSessionFilename(myArrayForFilename);
        setSessionSourceId(res.data.sessionIdBackend);
        // setSessionStatus(res.data.sessionStatusBackend);
        let testURLHERE = res.data.sessionPresignedUrlBackend;
        console.log("testURLHERE is: " + testURLHERE);
        await axios(res.data.sessionPresignedUrlBackend, {
          method: "PUT",
          data: pic,
          headers: {
            "Content-Type": pic.type,
          },
        });
        setSessionStatus(res.data.sessionStatusBackend);
        setDisplayedSessionStatus("The session is processing. Please wait.");
        setDisplayedProcessStatus("Will process soon.");
      })
      .then(checkIfClosed())
      .catch((error) => console.log(error.message));
  };

  const imgixHandleChangeForSessionStarting = (e) => {
    setPic(e.target.files[0]);
  };

  //IMGIX EXAMPLE: CHECK SESSION STATUS
  const imgixHandleCheckStatus = async () => {
    const value = { grabbedSessionSourceID: sessionSourceId };
    console.log("value is:");
    console.log(value);

    const sessionStatusForAxios = await axios
      .post(
        "https://backend-sessions-demo-video.vercel.app/checkImgixSessionStatus",
        value
      )
      .then((res) => {
        console.log(res);
        setSessionStatus(res.data.data.attributes.status);
      })
      .catch((error) => console.log(error.message));
  };

  return (
    <div className='app'>
      <form className='form' onSubmit={imgixHandleSubmitForSessionStarting}>
        <input type='file' onChange={imgixHandleChangeForSessionStarting} />
        <br />
        <button>Upload Video</button>
      </form>
      <br />
      <h3>The Session Status is: {displayedSessionStatus}</h3>
      <h3>Video process status is: {displayedProcessStatus}</h3>
      <h4>{imgixUrl}</h4>
      <div>{searchArray.length === 0 && <h2>No Video uploaded</h2>}</div>
      <div className='test'>
        {imgixUrl !== "" && (
          <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
        )}
      </div>
    </div>
  );
}

export default App;
