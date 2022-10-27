// Client side
const socket = io() 

// ELEMENTS
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// TEMPLATES
const messageTemplate = document.querySelector('#message-template').innerHTML //accessing the html inside (div)
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// OPTIONS
const { username, chatroom } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// AUTOSCROLL FUNCTION - STAYS IN POSITION IF USER MANUALLY SCROLLED UP, ELSE KEEPS SCROLLING TO THE NEW MESSAGE
const autoscroll = () => {
    // New Message Element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom) // parseInt converts '16' to 16
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // VISIBLE HEIGHT (only things visible)
    const visibleHeight = $messages.offsetHeight

    // HEIGHT OF MESSAGES CONTAINER (including non visible)
    const containerHeight = $messages.scrollHeight

    // HOW FAR USER HAS SCROLLED
    const scrollOffset = $messages.scrollTop + visibleHeight // scrollTop = value gets more as I scroll down

    // CHECK IF USER HAS SCROLLED TO THE BOTTOM b4 THE LAST MESSAGE WAS ADDED
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight // THIS SCROLLS THE USER TO THE BOTTOM
    }
}

// LISTENING FROM SERVER
socket.on('message', (message) => {
    console.log(message)

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ chatroom, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        chatroom,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// EMITTING TO SERVER
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // DISABLE FORM
    $messageFormButton.setAttribute('disabled', 'disabled')

    // USER INPUT || target === #message-form
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        // ENABLE FORM
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('Message delivered')
    })
})

$sendLocationButton.addEventListener('click', () => {
    // DISABLE BUTTON
    $sendLocationButton.setAttribute('disabled', 'disabled')

    // USER'S LOCATION
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            // ENABLE BUTTON
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join', { username, chatroom }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})