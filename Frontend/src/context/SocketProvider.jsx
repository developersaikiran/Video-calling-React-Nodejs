// import React, { createContext, useContext, useMemo } from "react";
// import { io } from 'socket.io-client'

// const SocketContext = createContext(null)

// export const useSocket = () => {
//     const socket = useContext(SocketContext);
//     return socket
// }

// export const SocketProvider = (props) => {
//     const socket = useMemo(() => io('http://192.168.1.154:8000/'))
//     return (
//         <SocketContext.Provider value={socket} >{props.children}</SocketContext.Provider >
//     )
// }

import { io } from "socket.io-client";
// export const socket = io("http://localhost:8000/", {
// export const socket = io("http://192.168.0.150:8000/", {
export const socket = io("https://video-calling-react-nodejs.onrender.com", {
   path: `/socket.io`,
   transports: ['websocket']
}).connect();