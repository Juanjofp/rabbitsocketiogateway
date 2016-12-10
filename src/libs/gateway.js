import http from 'http';
import socketIO from 'socket.io';
import createActionizer from './actionizer';

let server = http.createServer(),
    io = socketIO(server),
    throwAway = function(data) {
        return data;
    },
    throwAwayService = function(client, service, room, action) {
        console.log('Request from service', client, service, room, action);
        return action;
    };

export default function startGateway(
    {
        requestService = throwAwayService,
        requestClient = throwAway,
        responseService = throwAway,
        responseRoom = throwAway,
        responseClient = throwAway,
        responseGateway = throwAway,
        portIO = 8001,
        serverRabbit = 'amqp://localhost'
    } = {}
) {

    function leaveAllRooms(socket) {
        for (let room in socket.rooms) {
            socket.leave(room);
        }
    }

    function leaveFromService(socketId, service) {
        let socket = io.sockets.connected[socketId];
        if (!socket) return;
        for (let room in socket.rooms) {
            if (room.startsWith(service)) {
                socket.leave(room);
            }
        }
        socket.leave(service);
    }

    function leaveFromRoom(socketId, service, room) {
        let socket = io.sockets.connected[socketId];
        if (!socket) return;
        socket.leave(`${service}#${room}`);
    }

    function joinToRoom(socket, room) {
        if (room in socket.rooms) {
            return;
        }
        socket.join(room);
    }

    function joinToService(socket, service, room) {
        joinToRoom(socket, service);
        joinToRoom(socket, `${service}#${room}`);
    }

    function microservicesResponse(response, actionizer) {
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
        if (response.action && response.action.type) {
            const type = response.action.type;
            console.log('Action ', type);
            switch (true) {
                case type === '@@INIT':
                    // TODO: Add Service to list of availables services
                    console.log(response.serviceId, response.action);
                    break;
                case type === '@@EXIT':
                    // TODO: Take out the client from the service
                    if (response.action.room === 'ALL') {
                        leaveFromService(response.clientId, response.serviceId);
                        // Notify to client it has leave the service?
                    }
                    else {
                        leaveFromRoom(response.clientId, response.serviceId, response.roomId);
                        // Notify to client it has leave the room?
                    }
                    break;
                case type === '@@FORWARD':
                    console.log('FORWARD', response.serviceId, response.action);
                    // TODO: Send actions to a MS
                    // Shape:
                    /**
                    {
                        type: '@@FORWARD',
                        action:
                        {
                            service: 'MSINFO',
                            room: 'DEFAULT',
                            client: '5pucRgnj9Rfp9S3XAAAA',
                            type: 'DO_NOTHING'
                        }
                    }
                    **/
                    let action = response.action.action,
                        fromClient = action.client,
                        toService = action.service,
                        toRoom = action.room,
                        actionToForward = requestService(response.clientId, response.serviceId, response.roomId, action);

                    console.log('requestService', actionToForward, action);

                    delete actionToForward.client;
                    delete actionToForward.service;
                    delete actionToForward.room;
                    actionizer(fromClient, toService, toRoom, actionToForward);
                    break;
                default:
                    // This action must be proccess by the gateway
                    responseGateway(response.action);
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
