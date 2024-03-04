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

    const handleUserJoined = useCallback(async ({ name, id }) => {
        console.log('User joined', { name, id });
        setRemoteSocketId(id)
        if (id) {
            // handleCallUser()

            // send offer to new user who are joind recently 
            const offer = await peer.getOffer();
            socket.emit("user:call", {
                to: id, offer
            })
        }
    }, [])



    const handleIncomingCall = useCallback(async ({ from, offer }) => {
        console.log('incoming Call', { from, offer });
        setRemoteSocketId(from)
        // const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        // setMyStream(stream)
        const anw = await peer.getAnswer(offer)
        socket.emit('call:accepted', { to: from, anw })
    }, [socket])


    const handleEndCall = useCallback(() => {
        // Close the peer connection and clean up resources
        if (peer.peer) {
            peer.peer.close();
        }
        // You may want to reset states or perform other cleanup operations
        setMyStream(null);
        setRemoteStream(null);
        setRemoteSocketId(null);

        // Navigate back to the previous page or any other desired location
        navigate(-1);
    }, [peer.peer, navigate]);


    const sendStream = useCallback(() => {
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream)
        }
    }, [myStream])

    const handleCallAccepted = useCallback(async ({ from, anw }) => {
        // sendStream()
        console.warn("call accepted_____________________",anw);
        // await peer.setRemoteDescription(anw)
        await peer.peer.setRemoteDescription(new RTCSessionDescription(anw))
        // socket.emit('user:startCall', { to: from })
    }, [sendStream])

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed', { offer, to: remoteSocketId })
    }, [remoteSocketId, socket])

    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded', handleNegoNeeded)
        return () => {
            peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded)
        }
    }, [handleNegoNeeded]);

    const handleNegoNeedIncoming = useCallback(async ({ from, offer }) => {
        console.log('============>>>', from);
        const anw = await peer.getAnswer(offer)
        socket.emit('peer:nego:done', { to: from, anw })
    }, [socket])


    const handleNegoNeedFinal = useCallback(({ anw }) => {
        peer.setLocalDescription(anw)
    }, [])

    useEffect(() => {
        peer.peer.addEventListener('track', async ev => {
            const remoteStream = ev.streams
            console.log("got tracks");
            setRemoteStream(remoteStream[0]);
        })
        setLocalStream()
        // const offer = peer.getOffer();
        // peer.peer.setLocalDescription(offer)
    }, []);

    const setLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            setMyStream(stream)
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
        socket.on('peer:nego:needed', handleNegoNeedIncoming)
        socket.on('peer:nego:final', handleNegoNeedFinal)

        // socket.on('user:startCall', (data) => {
        //     console.log("user:startCall_______________", data);
        //     // sendStream()
        // })

        return () => {
            socket.off('user:joined', handleUserJoined)
            socket.off('incoming:call', handleIncomingCall)
            socket.off('call:accepted', handleCallAccepted)
            socket.off('peer:nego:needed', handleNegoNeedIncoming)
            socket.off('peer:nego:final', handleNegoNeedFinal)
            // socket.off('user:startCall', handleNegoNeedFinal)
        };
    }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegoNeedIncoming, handleNegoNeedFinal]);



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
            {myStream && <button onClick={sendStream}>send stream</button>}
            {/* {myStream && <button onClick={handleEndCall}>End Call</button>} */}

            <div style={{
                display: 'flex',
                justifyContent: 'center'
            }}>
                {myStream && <>
                    <div style={{ margin: '10px' }}>
                        <h1 style={{ fontSize: '15px' }}>my stream <p style={{ fontSize: '18px', color: 'green', marginTop: '10px' }}>{socket.id}</p> </h1>
                        <ReactPlayer playing height="360px" width="400px" url={myStream} />
                    </div>
                </>}

                {remoteStream && <>
                    <div style={{ margin: '10px' }}>
                        <h1 style={{ fontSize: '15px' }}>remote stream <p style={{ fontSize: '18px', color: 'green', marginTop: '10px' }}>{socket.id}</p> </h1>
                        <ReactPlayer playing height="360px" width="400px" url={remoteStream} />
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
