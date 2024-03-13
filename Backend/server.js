const { Server } = require('socket.io')

const io = new Server(8000, {
  cors: true
});

console.log('Server is running on PORT: 8000');

const nameToSocketMap = new Map();
const socketIdToName = new Map();
var roomId = 0
var roomMembers = []
var males = []
var females = []

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('room:join', (data) => {
    const { profile, name, gender, lookingFor } = data
    let userData = {
      profile, name, gender, lookingFor,
      socketId: socket.id
    }
    // if (males.length >= 2) {
    //   males = []
    //   roomId = 0
    // }
    // // to join room
    // males.push(userData)

    if(lookingFor == 1){
      if (males.length >= 2) {
        males = []
        roomId = 0
      }
      // to join room
      males.push(userData)
    }else if(lookingFor == 2){
      if (females.length >= 2) {
        females = []
        roomId = 0
      }
      // to join room
      females.push(userData)
    }else{
      if (males.length <= 1) {
        if (males[0]?.socketId == socket.id || males.length >= 2) {
          males = []
          roomId = 0
        }
        males.push(userData)
      }else{
        if (females.length >= 2) {
          females = []
          roomId = 0
        }
        females.push(userData)
      }
    }


    if (roomId == 0) {
      roomId = Math.floor(1 + Math.random() * 99)
      // roomId = 5
    }

    console.log({ roomId, name });
    userData.roomId = roomId
    io.to(roomId).emit("user:joined", userData)
    socket.join(roomId)

    data.roomId = roomId
    io.to(socket.id).emit('room:join', data)
  })

  socket.on("user:leave", ({ roomId }) => {
    io.to(roomId).emit('user:leave', { from: socket.id });
    socket.leave(roomId);
  })

  socket.on("user:call", ({ to, offer, userData }) => {
    console.log("user:call", { to, offer });
    io.to(to).emit('incoming:call', { from: socket.id, offer, connectedUser: userData })
  })

  socket.on('call:accepted', ({ to, anw }) => {
    io.to(to).emit('call:accepted', { from: socket.id, anw })
  })

  socket.on('send:message', ({ imageUrl, name, message, roomId, senderId }) => {
    console.log({ imageUrl, name, message, roomId, senderId });
    io.to(roomId).emit('receive:message', ({ imageUrl, name, message, roomId, senderId }))
  })
})