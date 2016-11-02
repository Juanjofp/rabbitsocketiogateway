import io from 'socket.io-client/socket.io';

export default function connectIO(
    {
        protocol = 'ws',
        server = 'localhost',
        port = '8080',
        onData,
        onError
    } = {}
) {
    const URL = `${protocol}://${server}:${port}/`;
    console.log('Try to connect', URL);
    let socket = io(
        URL,
        {
            jsonp: false,
            transports: ['websocket']
        }
    );

    function errorIO(err) {
        console.log('SocketIO - connect error', err);
    }

    function errorConnection(err) {
        console.log('error socketio', err);
    }

    function dataReceived(data) {
        console.log('io data received', data);
    }

    socket.on('connect_error', onError || errorIO);
    socket.on('connect_timeout', onError || errorIO);
    socket.on('reconnect_error', onError || errorIO);
    socket.on('connect', function() {
        console.log('sockket IO connected');
        socket.on('error', onError || errorConnection);
        socket.on('disconnect', function() {
            console.log('disconected io');
        });
        socket.on('data', onData || dataReceived);
    });

    return function(
        service = 'DEFAULT',
        room = 'DEFAULT',
        action = {}
    ) {
        let msg = {
            service,
            room,
            ...action
        };
        socket.emit('actions', msg);
    };
}
