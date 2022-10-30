// Server side
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const { getNumberOfUsersInRoom } = require('./utils/users')

const app = express()
// Socketio expects a raw http server
const server = http.createServer(app)
// Configure socketio to work with server
const io = socketio(server)

// HEROKU
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

// WHEN CONNECTION IS MADE
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.chatroom)

        // EMITTING TO CLIENT
        socket.emit('message', generateMessage('Self Generated Message', 'Welcome to ' + user.chatroom + ' chatroom!'))
        socket.broadcast.to(user.chatroom).emit('message', generateMessage('Self Generated Message', `${user.username} has joined the chat room!`))
        // DATA FOR SIDEBAR
        // io.to(user.chatroom).emit('roomData', {
        //     chatroom: user.chatroom,
        //     users: getUsersInRoom(user.chatroom)
        // })
        io.to(user.chatroom).emit('roomData', {
            chatroom: user.chatroom,
            users: getUsersInRoom(user.chatroom),
            totalUsers: getNumberOfUsersInRoom(user.chatroom)
        })

        callback()
    })

    // LISTENING FROM CLIENT
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        // CHECK FOR PROFANITY
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed.')
        }

        io.to(user.chatroom).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        // GOOGLE MAP
        // io.to(user.chatroom).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        // NAVER MAP
        io.to(user.chatroom).emit('locationMessage', generateLocationMessage(user.username, `https://map.naver.com/v5/?c=${coords.latitude},${coords.longitude}`))
        callback()
    })

    // WHEN CLIENT DISCONNECTS
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.chatroom).emit('message', generateMessage('Self Generated Message', `${user.username} has left`))
            // DATA FOR SIDEBAR
            // io.to(user.chatroom).emit('roomData', {
            //     chatroom: user.chatroom,
            //     users: getUsersInRoom(user.chatroom)
            // })
            io.to(user.chatroom).emit('roomData', {
                chatroom: user.chatroom,
                users: getUsersInRoom(user.chatroom),
                totalUsers: getNumberOfUsersInRoom(user.chatroom)
            })
        }
    })
}) 

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})