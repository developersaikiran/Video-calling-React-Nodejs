import React, { useEffect, useCallback, useState } from 'react'
import { socket } from '../context/SocketProvider'
import ReactPlayer from 'react-player'
import peer from '../service/peer'

import { useNavigate } from 'react-router-dom'
import Pulsating from "../components/pulse";
import './Room.css'
import LobbyScreen from './LobbyScreen'
import ChatRoom from './ChatRoom'
import { icons } from '../assets'


const Room = () => {
    // const socket = useSocket()
    const [connection, setConnection] = useState(false)
    const [connectedUser, setConnectedUser] = useState(null)
    const [userData, setUserData] = useState(null)

    const [micStatus, setMicStatus] = useState('on')
    const [videoStatus, setVideoStatus] = useState('on')
    const [cameraFacing, setCameraFacing] = useState('front') // back
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');

    useEffect(() => {
        const getDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);
                setSelectedDevice(videoDevices[0]?.deviceId);
            } catch (error) {
                console.error('Error getting media devices:', error);
            }
        };
        getDevices();
    }, []);


    useEffect(() => {
        const getMediaStream = async () => {
            try {
                const constraints = {
                    audio: true,
                    video: selectedDevice ? { deviceId: { exact: selectedDevice } } : true
                };

                const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                const videoTrack = newStream.getVideoTracks()[0];
                const audioTracks = myStream.getAudioTracks();

                // Stop the existing stream
                // myStream.getTracks().forEach(track => track.stop());

                // Create a new stream with the updated video track
                const updatedStream = new MediaStream([...audioTracks, videoTrack]);

                // Set the new stream
                setMyStream(updatedStream);
            } catch (error) {
                console.error('Error accessing media devices:', error);
            }
        };
        getMediaStream();
    }, [selectedDevice]);





    // localStorage.removeItem('userData');
    const [roomId, setRoomId] = useState(null)
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [myStream, setMyStream] = useState()
    const [remoteStream, setRemoteStream] = useState()
    const [isDarkMode, setDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setDarkMode(!isDarkMode);
    };

    const toggleCamera = () => {
        if (devices.length > 1) {
            if (cameraFacing == 'front') {
                setSelectedDevice(devices[1]?.deviceId);
                setCameraFacing('back')
            } else {
                setSelectedDevice(devices[0]?.deviceId);
                setCameraFacing('front')
            }
        }
    };

    // Function to toggle microphone status
    const toggleMic = async () => {
        if (micStatus == 'on') {
            await myStream.getAudioTracks().forEach(track => track.enabled = false);
            setMicStatus('off');
        } else {
            await myStream.getAudioTracks().forEach(track => track.enabled = true);
            setMicStatus('on');
        }
    };

    // Function to toggle video status
    const toggleVideo = () => {
        // myStream.getVideoTracks().forEach(track => track.enabled = false);
        if (videoStatus == 'on') {
            myStream.getVideoTracks().forEach(track => track.enabled = false);
            setVideoStatus('off');
        } else {
            myStream.getVideoTracks().forEach(track => track.enabled = true);
            setVideoStatus('on');
        }
    };

    useEffect(() => {
        const userData = localStorage.getItem('userData');
        console.log({ userData });
        setUserData(userData ? JSON.parse(userData) : null)
    }, [])

    const handleJoinRoom = async (data) => {
        setConnection(true)
        setUserData(data ? data : null)
        setRoomId(data.roomId)
        console.log(data);
    }

    const handleUserJoined = async (data) => {
        if(data.socketId != socket.id){
            console.log('User joined', { name: data.name, socketId: data.socketId });
            setConnectedUser(data)
            setRemoteSocketId(data.socketId)
            setRoomId(roomId)
            if (data.socketId) {
                const offer = await peer.getOffer();
                socket.emit("user:call", { to: data.socketId, offer, userData })
            }
        }
    }


    const createMyStream = async () => {
        try {
            const constraints = {
                audio: micStatus === 'on',
                video: videoStatus === 'on'
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            setMyStream(stream)
            for (const track of stream.getTracks()) {
                if (micStatus === 'on' || track.kind !== 'audio') {
                    peer.peer.addTrack(track, stream)
                }
            }
        } catch (error) {
            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                console.error('Media devices not found.');
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                console.error('Permission to access media devices was denied.');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                console.error('Media devices are not readable.');
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                console.error('Constraints specified for media devices are not satisfied.');
            } else {
                console.error('Error accessing user media:', error);
            }
        }
    }


    const handleIncomingCall = useCallback(async ({ from, offer, connectedUser }) => {
        console.log('incoming Call', { from, offer });
        setRemoteSocketId(from)
        setConnectedUser(connectedUser)

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        setMyStream(stream)
        for (const track of stream.getTracks()) {
            peer.peer.addTrack(track, stream)
        }

        const anw = await peer.getAnswer(offer)
        socket.emit('call:accepted', { to: from, anw })
    }, [socket])

    const handleCallAccepted = async ({ from, anw }) => {
        console.warn("call accepted_____________________", anw);
        await peer.setRemoteDescription(anw)
    }


    useEffect(() => {
        createMyStream()
        const handleIceCandidate = (event) => {
            if (event.candidate) {
                // Send the ICE candidate to the remote peer
                console.log(event.candidate);
            }
        };

        const handleNegotiationNeeded = async (event) => {
            // Handle negotiation needed event
            console.log('Negotiation needed:', event);
            try {
                // Create a new offer
                const offer = await peer.peer.createOffer();
                // Set the local description with the new offer
                await peer.peer.setLocalDescription(offer);

                // Send the offer to the remote peer
                // socket.emit('user:startCall', { to: remoteSocketId, offer });
            } catch (error) {
                console.error('Error during negotiation:', error);
            }
        };


        const handleTrack = (event) => {
            setRemoteStream(event.streams[0]);
        };


        // Set up event listeners
        peer.peer.addEventListener('icecandidate', handleIceCandidate);
        peer.peer.addEventListener('negotiationneeded', handleNegotiationNeeded);
        peer.peer.addEventListener('track', handleTrack);

        return () => {
            // Clean up event listeners
            peer.peer.removeEventListener('icecandidate', handleIceCandidate);
            peer.peer.removeEventListener('negotiationneeded', handleNegotiationNeeded);
            peer.peer.removeEventListener('track', handleTrack);
            setRemoteStream();

            // Stop tracks and close connection if needed
            // if (myStream) {
            //     myStream.getTracks().forEach(track => track.stop());
            // }
        };
    }, [roomId]);


    const leaveCall = async () => {
        setRemoteStream()
        setRemoteSocketId()
        setRoomId(null)
        setUserData(null)
        setConnectedUser(null)
        socket.emit('user:leave', { roomId: roomId })
        localStorage.removeItem('userData');
    }

    const joinCall = async () => {
        socket.emit('user:leave', { roomId: roomId })
        setRemoteStream(null)
        setRemoteSocketId(null)
        setRoomId(null)
        setConnectedUser(null)
        // peer.peer.restartIce()

        socket.emit('room:join', {
            name: userData.name,
            gender: userData.gender,
            lookingFor: userData.lookingFor,
            profile: userData.profile
        })
    }

    const userLeaveRoom = () => {
        setRemoteStream()
        setRemoteSocketId()
        setRoomId(null)
    }

    useEffect(() => {
        socket.on('user:joined', handleUserJoined)
        socket.on('incoming:call', handleIncomingCall)
        socket.on('call:accepted', handleCallAccepted)
        socket.on('user:leave', userLeaveRoom)
        socket.on('room:join', handleJoinRoom)

        // socket.on('user:startCall', handleCallStarted)
        return () => {
            socket.off('user:joined', handleUserJoined)
            socket.off('incoming:call', handleIncomingCall)
            socket.off('call:accepted', handleCallAccepted)
            socket.off('room:join', handleJoinRoom)
            // socket.off('user:startCall', handleCallStarted)
        };
    }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleJoinRoom]);



    return (
        <body className={`${isDarkMode ? 'dark' : ''} `}>

            {!userData &&
                <div className={`app-container`}>
                    <LobbyScreen />
                </div>
            }

            {userData &&
                <div className={`app-container`}>

                    <button className="mode-switch" onClick={toggleDarkMode}>
                        {isDarkMode ?
                            <img className='img-icons' style={{ height: '25px' }} src={icons.sun}></img>
                            :
                            <img className='img-icons' style={{ height: '25px' }} src={icons.moon}></img>
                        }
                        {/* <svg className="sun" fill="none" stroke="#fbb046" stroke-linecap="round" stroke-linejoin="round"
                            stroke-width="2" class="feather feather-sun" viewBox="0 0 24 24">
                            <defs />
                            <circle cx="12" cy="12" r="5" />
                            <path
                                d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                        </svg>
                        <svg className="moon" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round"
                            stroke-width="2" class="feather feather-moon" viewBox="0 0 24 24">
                            <defs />
                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                        </svg> */}
                    </button>


                    <div className="left-side" style={{ display: 'none' }}>
                        <div className="navigation">
                            <a href="#" className="nav-link icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" className="feather feather-home" viewBox="0 0 24 24">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                    <path d="M9 22V12h6v10" />
                                </svg>
                            </a>
                            <a href="#" className="nav-link icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                    className="feather feather-message-square">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </a>
                            <a href="#" className="nav-link icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" className="feather feather-phone-call"
                                    viewBox="0 0 24 24">
                                    <path
                                        d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94m-1 7.98v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                                </svg>
                            </a>
                            <a href="#" className="nav-link icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                    className="feather feather-hard-drive">
                                    <line x1="22" y1="12" x2="2" y2="12" />
                                    <path
                                        d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                                    <line x1="6" y1="16" x2="6.01" y2="16" />
                                    <line x1="10" y1="16" x2="10.01" y2="16" />
                                </svg>
                            </a>
                            <a href="#" className="nav-link icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                    className="feather feather-users">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </a>
                            <a href="#" className="nav-link icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" className="feather feather-folder"
                                    viewBox="0 0 24 24">
                                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                                </svg>
                            </a>
                            <a href="#" className="nav-link icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round" className="feather feather-settings"
                                    viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="3" />
                                    <path
                                        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div className="app-main">

                        <div className="video-call-wrapper">

                            <div className="video-participant">
                                {/* <div className="participant-actions">
                                <button className="btn-mute"></button>
                                <button className="btn-camera"></button>
                            </div> */}
                                <a className="name-tag">{userData?.name ? userData.name : 'Test'}</a>
                                {myStream ?
                                    <video
                                        autoPlay
                                        muted
                                        height="100%"
                                        width="100%"
                                        ref={(videoRef) => {
                                            if (videoRef) {
                                                videoRef.srcObject = myStream;
                                            }
                                        }}
                                        style={{
                                            objectFit: 'cover',
                                        }}
                                    />
                                    :
                                    <>
                                        <div className="avatar">
                                            <img src="https://i.stack.imgur.com/l60Hf.png" alt="participant" />
                                        </div>
                                    </>
                                }
                            </div>
                            <div className="video-participant">
                                {/* <div className="participant-actions">
                                <button className="btn-mute"></button>
                                <button className="btn-camera"></button>
                            </div> */}
                                <a className="name-tag">{connectedUser ? connectedUser.name : 'Finding user...'}</a>
                                {remoteStream ?
                                    <video
                                        autoPlay
                                        height="100%"
                                        width="100%"
                                        ref={(videoRef) => {
                                            if (videoRef) {
                                                videoRef.srcObject = remoteStream;
                                            }
                                        }}
                                        style={{
                                            objectFit: 'cover',
                                            // transform: 'scaleX(-1)',
                                        }}
                                    />
                                    :
                                    <>
                                        <div className='remote-stream-default'>
                                            <div className="avatar">
                                                <img src="https://i.stack.imgur.com/l60Hf.png" />
                                            </div>
                                        </div>
                                    </>
                                }
                            </div>

                        </div>

                        <div className="video-call-actions ">

                            <button className={`video-action-button mic`} onClick={toggleMic}>
                                <img className={`img-icons`} src={micStatus == 'on' ? icons.micOn : icons.micOff} />
                            </button>

                            <button className={`video-action-button camera`} onClick={toggleVideo}>
                                <img className={`img-icons`} src={videoStatus == 'on' ? icons.videoOn : icons.videoOff} />
                            </button>
                            <button className={`video-action-button camera-flip`} onClick={toggleCamera}>
                                <img className={`img-icons`} src={icons.cameraFlip} style={{}} />
                            </button>

                            {roomId &&
                                <button className="video-action-button">{roomId}</button>
                            }

                            {
                                (remoteSocketId || !roomId) &&
                                <button className="video-action-button endcall" onClick={joinCall}>
                                    <img className={`img-icons`} src={icons.reconnect} style={{ marginRight: '5px' }} />
                                    Next
                                </button>
                            }

                            {
                                userData ?
                                    <button className="video-action-button endcall" onClick={leaveCall}>
                                        <img className={`img-icons`} src={icons.hangupCall} style={{ marginRight: '5px' }} />
                                        Leave
                                    </button>
                                    :
                                    <button className="video-action-button joinCall" onClick={joinCall}>
                                        {/* <img className={`img-icons`} src={icons.hangupCall} style={{ height: '30px', marginRight: '5px' }} /> */}
                                        Join
                                    </button>
                            }

                        </div>
                    </div>

                    <ChatRoom
                        roomId={roomId}
                        remoteSocketId={remoteSocketId}
                    />

                </div>
            }
        </body>

    )
}

export default Room
