import io from 'socket.io-client/socket.io';

export default function connectIO(
    {
        protocol = 'ws',
        server = 'localhost',
        port = '8080'
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

    socket.on('connect_error', errorIO);
    socket.on('connect_timeout', errorIO);
    socket.on('reconnect_error', errorIO);
    socket.on('connect', function() {
        console.log('sockket IO connected');
        socket.on('error', errorConnection);
        socket.on('disconnect', function() {
            console.log('disconected io');
        });
        socket.on('data', dataReceived);
        socket.emit(
            'actions',
            {
                target: 'MSUSERS',
                type: 'LOGIN',
                username: 'juanjo',
                passwd: '123456'
            }
        );
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
