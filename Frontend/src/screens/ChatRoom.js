import React, { useState, useCallback, useEffect } from 'react';
import { socket } from '../context/SocketProvider'
import { useNavigate } from 'react-router-dom'
import './style.css';

const ChatRoom = ({roomId, remoteSocketId}) => {

  const [showChatBox, setShowChatbox] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  const toggleShowChatBox = () => {
    setShowChatbox(!showChatBox);
  };

  const receiveMessage = (data) => {
    setMessages((prev) => [prev, ...data])
  }

  const sendMessage = () => {
    let data = {
      imageUrl: '',
      name: '',
      message: inputMessage,
      roomId: roomId
    }
    console.log({data});
    socket.emit('send:message', data);
    setInputMessage('')
  }
  
  useEffect(() => {
    socket.on('receive:message', receiveMessage)
    return () => {
      socket.off('receive:message', receiveMessage)
      socket.off('send:message');
    };
  }, [])
  


  return (

    <div>
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

            {messages.map((data) => (
              <div className="message-wrapper">
                <div className="profile-picture">
                  <img src="https://images.unsplash.com/photo-1581824283135-0666cf353f35?ixlib=rb-1.2.1&auto=format&fit=crop&w=1276&q=80"
                    alt="pp" />
                </div>
                <div className="message-content">
                  <p className="name">Ryan Patrick</p>
                  <div className="message">Hi team!❤️</div>
                  <div className="message">I downloaded the file I downloaded the file I downloaded the file I downloaded the file I downloaded the file I downloaded the file<a className="mention">@timrussel</a></div>
                </div>
              </div>
            ))}

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
              <input type="text" placeholder="Type your meesage..." className="chat-input" value={inputMessage} onChange={(e) => {
                setInputMessage(e.target.value);
              }} />
              <button className="send-button" onClick={sendMessage}>
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
  );

};

export default ChatRoom;
