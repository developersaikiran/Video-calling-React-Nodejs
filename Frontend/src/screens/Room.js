import React, { useEffect, useCallback, useState } from 'react'
import { socket } from '../context/SocketProvider'
import ReactPlayer from 'react-player'
import peer from '../service/peer'

import { useNavigate } from 'react-router-dom'
import Pulsating from "../components/pulse";
import './Room.css'
import LobbyScreen from './LobbyScreen'


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

    const toggleCamera = () => {
        if(devices.length > 1){
            if(cameraFacing == 'front'){
                setSelectedDevice(devices[1]?.deviceId);
                setCameraFacing('back')
            }else{
                setCameraFacing('front')
                setSelectedDevice(devices[0]?.deviceId);
            }
        }
    };

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
    const [showChatBox, setShowChatbox] = useState(false);

    const toggleDarkMode = () => {
        setDarkMode(!isDarkMode);
    };

    const toggleShowChatBox = () => {
        setShowChatbox(!showChatBox);
    };

    // Function to toggle microphone status
    const toggleMic = async () => {
        if (micStatus === 'on') {
            await myStream.getAudioTracks().forEach(track => track.enabled = false);
        } else {
            await myStream.getAudioTracks().forEach(track => track.enabled = true);
        }
        setMicStatus(prev => prev === 'on' ? 'off' : 'on');
    };

    // Function to toggle video status
    const toggleVideo = () => {
        if (videoStatus === 'on') {
            myStream.getVideoTracks().forEach(track => track.enabled = false);
        } else {
            myStream.getVideoTracks().forEach(track => track.enabled = true);
        }
        setVideoStatus(prev => prev === 'on' ? 'off' : 'on');
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
        console.log('User joined', { name: data.name, socketId: data.socketId });
        setConnectedUser(data)
        setRemoteSocketId(data.socketId)
        setRoomId(roomId)
        if (data.socketId) {
            const offer = await peer.getOffer();
            socket.emit("user:call", { to: data.socketId, offer, userData })
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

    const handleCallStarted = async ({ from, anw }) => {
        console.warn("call Started receive_____________________", anw);
        // await peer.setRemoteDescription(anw)
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

            // Stop tracks and close connection if needed
            if (myStream) {
                myStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);


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
        setRemoteStream()
        setRemoteSocketId(null)
        setRoomId(null)
        setConnectedUser(null)

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

            <div className={`app-container`}>

                <button className="mode-switch" onClick={toggleDarkMode}>
                    <svg className="sun" fill="none" stroke="#fbb046" stroke-linecap="round" stroke-linejoin="round"
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
                    </svg>
                </button>

                {

                }

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
                            <a href="#" className="name-tag">{userData?.name ? userData.name : 'Test'}</a>
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
                                    <img src="https://i.stack.imgur.com/l60Hf.png" alt="participant" />
                                </>
                            }
                        </div>

                        <div className="video-participant">
                            {/* <div className="participant-actions">
                                <button className="btn-mute"></button>
                                <button className="btn-camera"></button>
                            </div> */}
                            <a href="#" className="name-tag">{connectedUser ? connectedUser.name : 'Finding user...'}</a>
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
                                            <img src="https://placekitten.com/400/400" />
                                        </div>
                                        {/* <img src="https://media.istockphoto.com/id/1249978015/photo/portrait-of-curious-woman-in-urban-style-hoodie-holding-hand-above-eyes-and-peering-into.jpg?s=612x612&w=0&k=20&c=pG9Ooh5sZoET8OHvRkcBhYYq1ddO-dKF-XU3Q8GHyF8=" alt="participant" /> */}
                                    </div>
                                </>
                            }
                        </div>

                    </div>

                    <div className="video-call-actions ">
                        <button className={`video-action-button mic-${micStatus}`} onClick={toggleMic}></button>
                        <button className={`video-action-button camera-${videoStatus}`} onClick={toggleVideo}></button>
                        <button className={`video-action-button camera-flip`} onClick={toggleCamera}></button>

                        {roomId &&
                            <button className="video-action-button">{roomId}</button>
                        }

                        {
                            (remoteSocketId || !roomId) &&
                            <button className="video-action-button endcall" onClick={joinCall}>Connect New</button>
                        }

                        {
                            userData ?
                                <button className="video-action-button endcall" onClick={leaveCall}>Leave</button>
                                :
                                <button className="video-action-button joinCall" onClick={joinCall}>Join</button>
                        }

                        {/* <button className="video-action-button magnifier">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" className="feather feather-zoom-in"
                                viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
                            </svg>
                            <span>100%</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                className="feather feather-zoom-out">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </button> */}
                    </div>
                </div>

                <div className={`right-side ${showChatBox ? 'show' : ''} `}>
                    <button className="btn-close-right" onClick={toggleShowChatBox}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor"
                            stroke-linecap="round" stroke-linejoin="round" stroke-width="2" className="feather feather-x-circle"
                            viewBox="0 0 24 24">
                            <defs></defs>
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M15 9l-6 6M9 9l6 6"></path>
                        </svg>
                    </button>
                    <div className="chat-container">
                        <div className="chat-header">
                            <button className="chat-header-button">
                                Live Chat
                            </button>
                        </div>
                        <div className="chat-area">
                            <div className="message-wrapper">
                                <div className="profile-picture">
                                    <img src="https://images.unsplash.com/photo-1581824283135-0666cf353f35?ixlib=rb-1.2.1&auto=format&fit=crop&w=1276&q=80"
                                        alt="pp" />
                                </div>
                                <div className="message-content">
                                    <p className="name">Ryan Patrick</p>
                                    <div className="message">Helloo team!😍</div>
                                </div>
                            </div>
                            <div className="message-wrapper">
                                <div className="profile-picture">
                                    <img src="https://images.unsplash.com/photo-1566821582776-92b13ab46bb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=60"
                                        alt="pp" />
                                </div>
                                <div className="message-content">
                                    <p className="name">Andy Will</p>
                                    <div className="message">Hello! Can you hear me?🤯 <a className="mention">@ryanpatrick</a></div>
                                </div>
                            </div>
                            <div className="message-wrapper">
                                <div className="profile-picture">
                                    <img src="https://images.unsplash.com/photo-1600207438283-a5de6d9df13e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1234&q=80"
                                        alt="pp" />
                                </div>
                                <div className="message-content">
                                    <p className="name">Jessica Bell</p>
                                    <div className="message">Hi team! Let's get started it.</div>
                                </div>
                            </div>
                            <div className="message-wrapper reverse">
                                <div className="profile-picture">
                                    <img src="https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80"
                                        alt="pp" />
                                </div>
                                <div className="message-content">
                                    <p className="name">Emmy Lou</p>
                                    <div className="message">Good morning!🌈</div>
                                </div>
                            </div>
                            <div className="message-wrapper">
                                <div className="profile-picture">
                                    <img src="https://images.unsplash.com/photo-1576110397661-64a019d88a98?ixlib=rb-1.2.1&auto=format&fit=crop&w=1234&q=80"
                                        alt="pp" />
                                </div>
                                <div className="message-content">
                                    <p className="name">Tim Russel</p>
                                    <div className="message">New design document⬇️</div>
                                    <div className="message-file">
                                        <div className="icon sketch">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                <path fill="#ffd54f" d="M96 191.02v-144l160-30.04 160 30.04v144z" />
                                                <path fill="#ffecb3" d="M96 191.02L256 16.98l160 174.04z" />
                                                <path fill="#ffa000" d="M0 191.02l256 304 256-304z" />
                                                <path fill="#ffca28" d="M96 191.02l160 304 160-304z" />
                                                <g fill="#ffc107">
                                                    <path d="M0 191.02l96-144v144zM416 47.02v144h96z" />
                                                </g>
                                            </svg>
                                        </div>
                                        <div className="file-info">
                                            <div className="file-name">NewYear.sketch</div>
                                            <div className="file-size">120 MB</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="message-wrapper">
                                <div className="profile-picture">
                                    <img src="https://images.unsplash.com/photo-1581824283135-0666cf353f35?ixlib=rb-1.2.1&auto=format&fit=crop&w=1276&q=80"
                                        alt="pp" />
                                </div>
                                <div className="message-content">
                                    <p className="name">Ryan Patrick</p>
                                    <div className="message">Hi team!❤️</div>
                                    <div className="message">I downloaded the file <a className="mention">@timrussel</a></div>
                                </div>
                            </div>
                            <div className="message-wrapper reverse">
                                <div className="profile-picture">
                                    <img src="https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80"
                                        alt="pp" />
                                </div>
                                <div className="message-content">
                                    <p className="name">Emmy Lou</p>
                                    <div className="message">Woooww! Awesome❤️</div>
                                </div>
                            </div>
                        </div>
                        <div className="chat-typing-area-wrapper">
                            <div className="chat-typing-area">
                                <input type="text" placeholder="Type your meesage..." className="chat-input" />
                                <button className="send-button">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round" className="feather feather-send"
                                        viewBox="0 0 24 24">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="participants">
                        <div className="participant profile-picture">
                            <img src="https://images.unsplash.com/photo-1576110397661-64a019d88a98?ixlib=rb-1.2.1&auto=format&fit=crop&w=1234&q=80"
                                alt="pp" />
                        </div>
                        <div className="participant profile-picture">
                            <img src="https://images.unsplash.com/photo-1566821582776-92b13ab46bb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=60"
                                alt="pp" />
                        </div>
                        <div className="participant profile-picture">
                            <img src="https://images.unsplash.com/photo-1600207438283-a5de6d9df13e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1234&q=80"
                                alt="pp" />
                        </div>
                        <div className="participant profile-picture">
                            <img src="https://images.unsplash.com/photo-1581824283135-0666cf353f35?ixlib=rb-1.2.1&auto=format&fit=crop&w=1276&q=80"
                                alt="pp" />
                        </div>
                        <div className="participant-more">2+</div>
                    </div>
                </div>
                <button className={`expand-btn ${showChatBox ? 'show' : ''} `} onClick={toggleShowChatBox}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        className="feather feather-message-circle">
                        <path
                            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                </button>
            </div>
        </body>

    )
}

export default Room
