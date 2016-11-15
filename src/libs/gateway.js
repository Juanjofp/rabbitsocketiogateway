import http from 'http';
import socketIO from 'socket.io';
import createActionizer from './actionizer';

let server = http.createServer(),
    io = socketIO(server),
    throwAway = function(data) {
        return data;
    };

export default function startGateway(
    {
        requestClient = throwAway,
        responseService = throwAway,
        responseRoom = throwAway,
        responseClient = throwAway,
        portIO = 8080,
        serverRabbit = 'amqp://localhost'
    } = {}
) {

    function leaveAllRooms(socket) {
        for (let room in socket.rooms) {
            socket.leave(room);
            console.log(socket.id, 'left room', room);
        }
    }

    function leaveFromService(socketId, service) {
        let socket = io.sockets.socket(socketId);
        if (!socket) return;
        for (let room in socket.rooms) {
            if (room.startsWith(service)) {
                socket.leave(room);
                console.log(socket.id, 'left room', room);
            }
        }
        socket.leave(service);
    }

    function leaveFromRoom(socketId, service, room) {
        let socket = io.sockets.socket(socketId);
        if (!socket) return;
        socket.leave(`${service}#${room}`);
    }

    function joinToRoom(socket, room) {
        if (room in socket.rooms) {
            console.log('Already', socket.id, 'in', room);
            return;
        }
        socket.join(room);
        console.log(socket.id, 'join room', room);
    }

    function joinToService(socket, service, room) {
        joinToRoom(socket, service);
        joinToRoom(socket, `${service}#${room}`);
    }

    function microservicesResponse(response) {
        console.log('Response received from MS', response);
        // Response for all clients in MS
        if (response.service) {
            io.to(response.serviceId).emit('data', responseService(response.service));
        }
        // Response to room in service
        if (response.room) {
            io.to(`${response.serviceId}#${response.roomId}`).emit('data', responseRoom(response.room));
        }
        // Response only for this client
        if (response.client) {
            io.to(response.clientId).emit('data', responseClient(response.client));
        }

        // if service send action to be proccess by gateway
        // May be it could be done by customs gateways?
        if (response.action) {
            if (response.action.type === 'EXIT') {
                if (response.action.room === 'all') {
                    leaveFromService(response.clientId, response.serviceId);
                }
                else {
                    leaveFromRoom(response.clientId, response.serviceId, response.roomId);
                }
            }
        }
    }

    server.listen(portIO, () => {
        console.log('Init Gateway at ', portIO);
        createActionizer(serverRabbit, microservicesResponse)
        .then(
            (actionizer) => {
                console.log('Gateway ready to listen at', portIO);
                io.on('connection', (socket) => {
                    console.log('Client connected', socket.id);
                    // Enable a communication channel with this socket
                    socket.on(
                        'actions',
                        (action) => {
                            console.log('Action from client', action, socket.id);
                            // action should shape as:
                            /*
                            {
                                service: MSName,
                                room: RoomName
                                action: action to send to MS
                            }
                            */
                            let service = action.service || 'DEFAULT',
                                room = action.room || 'DEFAULT';
                            delete action.service;
                            delete action.room;
                            joinToService(socket, service, room);
                            // Send action to MS
                            actionizer(socket.id, service, room, requestClient(action));
                        }
                    );

                    socket.on(
                        'disconnect',
                        () => {
                            console.log('Client disconnected', socket.id);
                            // Leave all rooms
                            leaveAllRooms(socket);

                        }
                    );
                });
            }
        )
        .catch(
            (err) => {
                console.log('Error create Actionizer', err);
            }
        );
    });
}
