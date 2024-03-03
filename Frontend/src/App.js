import logo from './logo.svg';
import './App.css';
import io from 'socket.io-client';
import { useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
// const socket = io('https://679vllr1-8000.inc1.devtunnels.ms/');
const socket = io('http://localhost:8000');

const peer = new RTCPeerConnection({
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:global.stun.twilio.com:3478"
      ]
    }
  ]
});





function App() {
  const [myStream, setMyStream] = useState()
  const [myRemoteStream, setMyRemoteStream] = useState()
  useEffect(() => {
    const handleIceCandidate = (event) => {
      if (event.candidate) {
        // Send the ICE candidate to the remote peer
        console.log(event.candidate);
      }
    };

    const handleNegotiationNeeded = async (event) => {
      // Handle negotiation needed event
      console.log(event);
    };


    const handleTrack = (event) => {
      setMyRemoteStream(event.streams[0]);
    };


    // Set up event listeners
    peer.addEventListener('icecandidate', handleIceCandidate);
    peer.addEventListener('negotiationneeded', handleNegotiationNeeded);
    peer.addEventListener('track', handleTrack);

    return () => {
      // Clean up event listeners
      peer.removeEventListener('icecandidate', handleIceCandidate);
      peer.removeEventListener('negotiationneeded', handleNegotiationNeeded);
      peer.removeEventListener('track', handleTrack);
    };
  }, []);

  const createOffer = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

    for (const track of stream.getTracks()) {
      peer.addTrack(track, stream);
    }

    const offer = await peer.createOffer();
    await peer.setLocalDescription(new RTCSessionDescription(offer));
    setMyStream(stream);

    const id = localStorage.getItem('remote-id')

    socket.emit('get:offer', { offer, id })

    // setMyOffer(JSON.stringify(offer));
  };


  const createAns = async (data) => {
    console.log("got the offer", data);
    const { id, offer } = data
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    // console.log(getOffer);
    await peer.setRemoteDescription(new RTCSessionDescription(offer));

    for (const track of stream.getTracks()) {
      peer.addTrack(track, stream);
    }

    const gotAns = await peer.createAnswer();
    data.ans = gotAns
    await peer.setLocalDescription(new RTCSessionDescription(gotAns));
    // setMyOfferAns(JSON.stringify(gotAns));
    socket.emit('receive::offer', data)

  };

  const handleAns = async (data) => {
    const { ans } = data
    await peer.setRemoteDescription(ans)
  }


  useEffect(() => {
    socket.emit('connection')
    const number = Math.floor(Math.random() * 10)
    localStorage.setItem('remote-id', number)
    setTimeout(() => {

      socket.emit('user:connect', { id: number, socketid: socket.id })
    }, 100)

    socket.on('get:offer', createAns)

    return () => {
      socket.off('get:offer', createAns)

    }
  }, [])

  useEffect(() => {
    socket.on('receive::offer', handleAns)
    return () => {
      socket.off('receive::offer', handleAns)

    }
  })



  return (
    <div className="App">
      {/* <input /> */}
      <button onClick={createOffer}>call</button>
      {myStream && <> <h1>my stream</h1><ReactPlayer playing height="360px" width="400px" url={myStream} /></>}
      {myRemoteStream && <> <h1>my stream</h1><ReactPlayer playing height="360px" width="400px" url={myRemoteStream} /></>}

    </div>
  );
}

export default App;
