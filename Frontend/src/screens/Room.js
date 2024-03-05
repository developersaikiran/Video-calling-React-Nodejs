import React, { useEffect, useCallback, useState } from 'react'
import { socket } from '../context/SocketProvider'
import ReactPlayer from 'react-player'
import peer from '../service/peer'

import { useNavigate } from 'react-router-dom'
import Pulsating from "../components/pulse";


const Room = () => {

    const navigate = useNavigate()
    // const socket = useSocket()
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [myStream, setMyStream] = useState()
    const [remoteStream, setRemoteStream] = useState()

    const handleUserJoined = async ({ name, id }) => {
        console.log('User joined', { name, id });
        // await createMyStream();
        setRemoteSocketId(id)
        if (id) {
            const offer = await peer.getOffer();
            socket.emit("user:call", { to: id, offer })
        }
    }


    const createMyStream = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        setMyStream(stream)
        for (const track of stream.getTracks()) {
            peer.peer.addTrack(track, stream)
        }
    }


    const handleIncomingCall = useCallback(async ({ from, offer }) => {
        console.log('incoming Call', { from, offer });
        setRemoteSocketId(from)

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
        };
    }, []);

    const setLocalStream = async () => {
        try {
            // const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            // setMyStream(stream)
            // for (const track of myStream.getTracks()) {
            //     peer.peer.addTrack(track, myStream)
            // }

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




    useEffect(() => {
        socket.on('user:joined', handleUserJoined)
        socket.on('incoming:call', handleIncomingCall)
        socket.on('call:accepted', handleCallAccepted)
        // socket.on('user:startCall', handleCallStarted)
        return () => {
            socket.off('user:joined', handleUserJoined)
            socket.off('incoming:call', handleIncomingCall)
            socket.off('call:accepted', handleCallAccepted)
            // socket.off('user:startCall', handleCallStarted)
        };
    }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted]);



    return (
        <div style={{
            justifyContent: 'center',
            width: '100%',
            textAlign: 'center',
            color: '#dc3545',
            marginTop: '10%'
        }}>
            <h1>Welcome</h1>
            <h4>{remoteSocketId ? 'Connected' : "Finding user..."}</h4>
            {/* {myStream && <button onClick={sendStream}>send stream</button>} */}
            {/* {myStream && <button onClick={handleEndCall}>End Call</button>} */}

            <div style={{
                display: 'flex',
                justifyContent: 'center'
            }}>
                {myStream && <>
                    <div style={{ margin: '10px' }}>
                        <h1 style={{ fontSize: '15px' }}>my stream <p style={{ fontSize: '18px', color: 'green', marginTop: '10px' }}>{socket.id}</p> </h1>
                        <ReactPlayer playing muted height="360px" width="400px" url={myStream}
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    </div>
                </>}

                {remoteStream && <>
                    <div style={{ margin: '10px' }}>
                        <h1 style={{ fontSize: '15px' }}>remote stream <p style={{ fontSize: '18px', color: 'green', marginTop: '10px' }}>{remoteSocketId}</p> </h1>
                        <ReactPlayer playing height="360px" width="400px" url={remoteStream}
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    </div>

                </>}
                {!remoteStream &&
                    <Pulsating visible={true} color="#dc3545" height={80} width={100} children={5} >
                        <div style={{
                            overflow: 'hidden',
                            height: '100px',
                            width: '100px',

                            borderRadius: '50%',
                            boxShadow: '0px 0px 10px #dc3545'
                        }}>
                            <img
                                style={{ width: '100%', height: '100%' }}
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPfO37MK81JIyR1ptwqr_vYO3w4VR-iC2wqQ&usqp=CAU"
                            ></img>
                        </div>
                    </Pulsating>
                }

            </div>

        </div>
    )
}

export default Room
