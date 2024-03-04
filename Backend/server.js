const { Server } = require('socket.io')

const io = new Server(8000, {
  cors: true
});

const nameToSocketMap = new Map();
const socketIdToName = new Map();
var room = 0
var roomMembers = []


io.on('connection', (socket) => {
  // console.log('socket connected', socket.id);

  socket.on('room:join', (data) => {
    const { name } = data
    nameToSocketMap.set(name, socket.id)
    socketIdToName.set(socket.id, name)

    if (roomMembers.length >= 2) {
      roomMembers = []
      room = 0
    }



    // to join room
    roomMembers.push({
      name,
      socketId: socket.id
    })
    if (room == 0) {
      room = Math.floor(1 + Math.random() * 99)
      // room = 5
    }

    console.log({ room, name });
    io.to(room).emit("user:joined", { name, id: socket.id })
    socket.join(room)

    data.room = room
    io.to(socket.id).emit('room:join', data)


  })

  socket.on("user:call", ({ to, offer }) => {
    console.log("user:call", { to, offer });
    io.to(to).emit('incoming:call', { from: socket.id, offer })
  })

  socket.on('call:accepted', ({ to, anw }) => {
    io.to(to).emit('call:accepted', { from: socket.id, anw })
  })

  socket.on('call:hangup', ({ to, anw }) => {
    
    io.to(to).emit('call:hangup', { from: socket.id, anw })
  })

  socket.on('peer:nego:needed', ({ to, offer }) => {
    console.log('peer:nego:needed', to);
    io.to(to).emit('peer:nego:needed', { from: socket.id, offer })
  })

  socket.on('user:startCall', ({ to }) => {
    console.log('user:startCall________', { to });
    io.to(to).emit('user:startCall', { from: socket.id })
  })

  socket.on('peer:nego:done', ({ to, anw }) => {
    console.log({ to, anw });
    io.to(to).emit('peer:nego:final', { from: socket.id, anw })
  })
})