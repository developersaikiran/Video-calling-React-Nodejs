const { Server } = require('socket.io')

const io = new Server(8000, {
    cors: true
});

const emailToSocketMap = new Map();
const socketIdToEmail = new Map();


io.on('connection', (socket) => {
    console.log(socket.id);
    socket.on('user:connect', (data) => {
        const { id, socketid } = data
        console.log(id,socketid);
        socket.join('1')
        socket.to('1').emit('get:user',{data})
    })

    socket.on('get:offer',(data)=>{
        console.log(data);
        socket.to('1').emit('get:offer',(data))
    })


    socket.on('receive::offer',(data)=>{
        const {id} = data
        socket.to('1').emit('receive::offer',data)
    })
})