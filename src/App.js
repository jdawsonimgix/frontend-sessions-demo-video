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
  const [sessionStatus, setSessionStatus] = useState("No Status");
  const [sessionFilename, setSessionFilename] = useState("");
  const [searchArray, setSearchArray] = useState([]);
  const [imgixUrl, setImgixUrl] = useState("");

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
        type: "video/mp4",
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
        console.log("This will run every 7 seconds!");
        imgixHandleCheckStatus();
      }, 7000);
      return () => clearInterval(interval);
    }
    if (sessionStatus === "COMPLETE") {
      setSearchArray(sessionFilename);
      setImgixUrl("https://sourcerer.imgix.net/" + sessionFilename + "?fm=mp4");
    }
  }, [sessionStatus]);

  //Used to set PENDING status to CLOSED.
  const checkIfClosed = async (e) => {
    console.log("checkIfClosed function");
    console.log("session status is: " + sessionStatus);

    if (sessionStatus === "PENDING") {
      const valueData = { grabbedSessionSourceID: sessionSourceId };

      //Set session to CLOSED.
      const sessionStatusForAxios = await axios
        .post("http://localhost:5001/checkImgixCloseSession", valueData)
        .then(console.log("Client - CLOSE imgix session"))
        .catch((error) => console.log(error.message));

      setSessionStatus(sessionStatusForAxios.data.data.attributes.status);
    }
  };

  //IMGIX EXAMPLES: STARTING SESSION
  const imgixHandleSubmitForSessionStarting = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("pic", pic);
    // "https://backend-sessions-demo.vercel.app/startImgixSession",

    const retrievedBackendData = await axios
      .post("http://localhost:5001/startImgixSession", formData)
      .then(console.log("starting imgix session"))
      .catch((error) => console.log(error.message));

    let tempFilename = retrievedBackendData.data.sessionFilenameBackend;
    let myArrayForFilename = tempFilename.split();
    setSessionSourceId(retrievedBackendData.data.sessionIdBackend);
    setSessionStatus(retrievedBackendData.data.sessionStatusBackend);
    setSessionFilename(myArrayForFilename);
  };
  const imgixHandleChangeForSessionStarting = (e) => {
    setPic(e.target.files[0]);
  };

  //IMGIX EXAMPLE: CHECK SESSION STATUS
  const imgixHandleCheckStatus = async () => {
    const value = { grabbedSessionSourceID: sessionSourceId };

    const sessionStatusForAxios = await axios
      .post("http://localhost:5001/checkImgixSessionStatus", value)
      .then(console.log("Session status was checked."))
      .catch((error) => console.log(error.message));

    setSessionStatus(sessionStatusForAxios.data.data.attributes.status);
  };

  return (
    <div className='app'>
      <form className='form' onSubmit={imgixHandleSubmitForSessionStarting}>
        <input type='file' onChange={imgixHandleChangeForSessionStarting} />
        <br />
        <button>Upload Image</button>
      </form>
      <br />
      <h3>The Session Status is: {sessionStatus}</h3>
      <div>{searchArray.length === 0 && <h2>No Video uploaded</h2>}</div>
      <div className='test'>
        {imgixUrl !== "" && (
          <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
        )}
      </div>
      {/* <div className='container'>
        {searchArray.map((value, index) => (
          <Imgix
            src={"https://sourcerer.imgix.net/" + value}
            width={200}
            height={200}
            key={index}
            imgixParams={{ auto: "format,compress,enhance", fit: "crop" }}
          />
        ))}
      </div> */}
      <h4>{imgixUrl}</h4>
    </div>
  );
}

export default App;
