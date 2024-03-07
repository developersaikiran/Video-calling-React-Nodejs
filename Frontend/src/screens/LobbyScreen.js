import React, { useState, useCallback, useEffect } from 'react';
import { socket } from '../context/SocketProvider'
import { useNavigate } from 'react-router-dom'
import './style.css';
import ToggleButton from 'react-bootstrap/ToggleButton';
import { lookingForLists, genderLists } from '../service/constants';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

const LobbyScreen = () => {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('abcd');
  const [gender, setGender] = useState(1);
  const [lookingFor, setLookingFor] = useState(3);
  const [showToast, setShowToast] = useState({
    show: false,
    title: '',
    message: ''
  });

  const handleSubmitForm = () => {
    // if (name == '') {
    //   setShowToast({
    //     show: true,
    //     title: 'Required',
    //     message: 'Enter name please.',
    //   })
    // } else if (gender == '') {
    //   setShowToast({
    //     show: true,
    //     title: 'Required',
    //     message: 'Select Gender.',
    //   })
    // } else if (lookingFor == '') {
    //   setShowToast({
    //     show: true,
    //     title: 'Required',
    //     message: 'Select looking for.',
    //   })
    // } else {
    localStorage.setItem('userData', JSON.stringify({ name, gender, lookingFor, profile }))
    console.log({ userData: JSON.parse(localStorage.getItem('userData')) });
    socket.emit('room:join', { name, gender, lookingFor, profile })
    // }
  };



  useEffect(() => {
    // const stream = navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    async function getUser() {
      let users = await fetch('https://randomuser.me/api/?results=2');
      let data = await users.json();
      setProfile(data.results[0].picture.medium)
      console.log({ name: data.results[0].picture.medium });
    }
    getUser()
  }, [])

  return (

    <div className="Auth-form-container ">
      <div className="Auth-form">
        <ToastContainer
          className="p-3"
          position={'top-end'}
          style={{ zIndex: 1 }}
        >
          <Toast
            show={showToast.show}
            onClose={() => setShowToast({
              show: false
            })}
            delay={2000}
            autohide
            style={{ backgroundColor: 'tomato', color: '#fff' }}
          >
            <Toast.Header closeButton={true}>
              <img
                src="holder.js/20x20?text=%20"
                className="rounded me-2"
                alt=""
              />
              <strong className="me-auto">{showToast.title}</strong>
              <small>11 mins ago</small>
            </Toast.Header>
            <Toast.Body>{showToast.message}</Toast.Body>
          </Toast>
        </ToastContainer>

        <div className="Auth-form-content">
          <h3 className="Auth-form-title">Welcome to Video Streaming</h3>

          <div className="d-flex mt-3" style={{ borderRadius: 50, justifyContent: 'center', width: '100%' }}>
            <div className="" style={{ borderRadius: 50, height: 70, width: 70, overflow: 'hidden', borderColor: '#000', borderWidth: '2px' }}>
              <img src={profile}></img>
            </div>
          </div>

          <div className="form-group mt-3">
            <label>Name</label>
            <input
              type="text"
              className="form-control mt-1 form-input"
              placeholder="Enter name"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group mt-3">
            <label>Gender</label>
            <div className=''>
              {genderLists.map((value) => (
                <ToggleButton
                  className="m-2 form-selections"
                  id="toggle-check"
                  type="checkbox"
                  variant="outline-primary"
                  checked={value.id == gender ? true : false}
                  onClick={() => {
                    console.log({ valueId: value.id });
                    setGender(value.id)
                  }}
                >
                  {value.name}
                </ToggleButton>
              ))}
            </div>
          </div>

          <div className="form-group mt-3">
            <label>Looking for?</label>
            <div className=''>
              {lookingForLists.map((value) => (
                <ToggleButton
                  className="m-2 form-selections"
                  id="toggle-check"
                  type="checkbox"
                  variant="outline-primary"
                  checked={value.id == lookingFor ? true : false}
                  onClick={() => {
                    setLookingFor(value.id)
                  }}
                >
                  {value.name}
                </ToggleButton>
              ))}
            </div>
          </div>

          <div className="d-grid gap-2 mt-3">
            <button type="submit" className="btn btn-primary" onClick={handleSubmitForm}> Join </button>
          </div>
        </div>
      </div>
    </div>

  );
};

export default LobbyScreen;
