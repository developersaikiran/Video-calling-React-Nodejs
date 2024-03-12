import React, { useState, useCallback, useEffect, useRef } from 'react';
import { socket } from '../context/SocketProvider'
import { useNavigate } from 'react-router-dom'
import './style.css';
import './ChatRoom.css';

const ChatRoom = ({ roomId, remoteSocketId }) => {

  const [showChatBox, setShowChatBox] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatAreaRef = useRef(null);
  const [userData, setUserData] = useState(null)

  const toggleShowChatBox = () => {
    setShowChatBox(!showChatBox);
  };

  const receiveMessage = (data) => {
    console.log("Receive message", { data });
    setMessages((prev) => [...prev, data])
  }

  const sendMessage = () => {
    let data = {
      imageUrl: userData.profile,
      name: userData.name,
      message: inputMessage,
      roomId: roomId,
      senderId: socket.id
    }
    console.log({ data });
    if (inputMessage) {
      socket.emit('send:message', data);
      setInputMessage('')
    }
  }

  useEffect(() => {
    const scrollToBottom = () => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    };
    scrollToBottom();
  }, [messages])

  useEffect(() => {
    socket.on('receive:message', receiveMessage)
    return () => {
      socket.off('receive:message', receiveMessage)
      socket.off('send:message');
    };
  }, [])

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    setUserData(userData ? JSON.parse(userData) : null)
  }, [])



  return (

    <div >
      <div className={`right-side ${showChatBox ? 'show' : ''} `} >

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
            <div class="center">
              <div class="circle pulse tomato"></div>
              <div class="" style={{marginLeft: '10px'}}>Live chat</div>
            </div>
          </div>

          <div className="chat-area" ref={chatAreaRef}>

            {messages.map((data, index) => (
              (messages[index - 1]?.senderId != messages[index]?.senderId) ?
                <div className={`message-wrapper ${data.senderId == socket.id ? 'reverse' : ''}`}>
                  <div className="profile-picture">
                    <img src={data.imageUrl ? data.imageUrl : 'https://images.unsplash.com/photo-1581824283135-0666cf353f35?ixlib=rb-1.2.1&auto=format&fit=crop&w=1276&q=80'}
                      alt="pp" />
                  </div>
                  <div className="message-content">
                    <p className="name">{data.name}</p>
                    <div className="message" style={{ whiteSpace: 'pre-wrap' }}>{data.message}</div>
                  </div>
                </div>
                :
                <div className={`message-wrapper same-user ${data.senderId == socket.id ? 'reverse' : ''}`}>
                  <div className="message" style={{ whiteSpace: 'pre-wrap' }}>{data.message}</div>
                </div>

            ))}

          </div>

          <div className="chat-typing-area-wrapper">
            <div className="chat-typing-area">
              <textarea
                placeholder="Type your message..."
                className="chat-input"
                value={inputMessage}
                rows={1}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key == 'Enter') {
                    console.log({keyName: e.key});
                    sendMessage()
                  }
                }}
                style={{ resize: 'none' }}
              />

              <button className="send-button" onClick={sendMessage} >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round" className="feather feather-send"
                  viewBox="0 0 24 24">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
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
