const users = []

const addUser = ({ id, username, chatroom }) => {
    username = username.trim().toLowerCase()
    chatroom = chatroom.trim().toLowerCase()

    // VALIDATE DATA
    if (!username || !chatroom) {
        return {
            error: 'Username and room are required.'
        }
    }

    // CHECK FOR EXISTING USER
    const existingUser = users.find((user) => {
        return user.chatroom === chatroom && user.username === username
    })

    // VALIDATE USERNAME 
    if (existingUser) {
        return {
            error: 'Username is in use'
        }
    }

    // STORE NEW USER
    const user = { id, username, chatroom }
    users.push(user)
    return {
        user
    }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (chatroom) => {
    return users.filter((user) => user.chatroom === chatroom)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}