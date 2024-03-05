import React, { useState, useCallback, useEffect } from 'react';
import { socket } from '../context/SocketProvider'
import { useNavigate } from 'react-router-dom'
import './style.css';

const LobbyScreen = () => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const navigate = useNavigate()
  console.log({socket: socket.id});

  const handleSubmitForm = useCallback((e) => {
  e.preventDefault();
    socket.emit('room:join', { name })
  }, [name, socket]);


  const handleJoinRoom = useCallback((data) => {
    const { name, room } = data
    console.log({ name, room, socket: socket.id });
    navigate(`/room/${room}`, { state: data })
  }, [navigate])

  useEffect(() => {
    // const stream = navigator.mediaDevices.getUserMedia({ audio: true, video: true })

    // async function getUser() {
    //   let users = await fetch('https://randomuser.me/api/?results=2');
    //   let data = await users.json();
    //   // setName(data.results[0].name.first)
    //   console.log({ name: data.results[0].name.first });
    // }
    // getUser()
    // console.log({ name: 'Name', socket: socket.id });

    socket.on('room:join', handleJoinRoom)
    return () => {
      socket.off('room:join', handleJoinRoom)
    }
  }, [socket, handleJoinRoom])

  return (
    <div className="Auth-form-container">
      <form className="Auth-form" onSubmit={handleSubmitForm}>
        <div className="Auth-form-content">
          <h3 className="Auth-form-title">Welcome to Video Streaming</h3>
          <div className="form-group mt-3">
            <label>Name</label>
            <input
              type="text"
              className="form-control mt-1"
              placeholder="Enter name"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="d-grid gap-2 mt-3">
            <button type="submit" className="btn btn-primary">
              Join
            </button>
          </div>
        </div>
      </form>
    </div>
    // <div>
    //     <h1>Lobby</h1>
    //     <form onSubmit={handleSubmitForm}>
    //         <label htmlFor='name'>Name</label>
    //         <input type='name' id='name' value={name} onChange={(e) => setName(e.target.value)} />
    //         <br />
    //         <label htmlFor='room'>Room Num</label>
    //         <input type='text' id='room' value={room} onChange={(e) => setRoom(e.target.value)} />
    //         <br />
    //         <button type='submit'>Join</button>
    //     </form>
    // </div>
  );
};

export default LobbyScreen;
