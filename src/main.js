import GatewayLib from './libs/gateway';
import ServiceLib from './libs/service';

export const Gateway = GatewayLib;
export const Service = ServiceLib;

export default {
    /*
    {
        requestClient: Procesa las peticiones que vienen por socketIO en el evento 'actions'
        responseService: Procesa la respuesta que viene del MS y se enviará a todos los clientes suscritos a este MS por socketIO en 'data'
        responseRoom: Procesa la respuesta que viene del MS y se enviará a todos los clinetes suscritos a esta Room de este MS por socketIO en 'data'
        responseClient: Procesa la respuesta que viene del MS y se enviará a este cliente por socketIO en 'data'
        responseGateway: Procesa la respuesta que viene del MS y es para que actué el gateway, no se reenvia a nadie
        portIO: puerto en el que escucha SocketIO, 8080
        serverRabbit: url donde se encuentra RabbitMQ
    }
    Escucha en el canal 'actions' y publica en el canal 'data'
    */
    Gateway,
    /*
    {
        server = url to rabbit server, default 'amqp://localhost',
        name = name of the micro service, default 'DEFAULT',
        requestFromGateway = callback to proccess request from gateway, default (action, response) => console.log('Receive>', action); response(action);
    }
    Promise q devuelve objeto service con sendAction: function(service, room, client, action)
    service: id del servicio
    room: id de la room
    client: id del cliente
    action: {
        service: {} // Action for all user of service
        room: {} // Action for all user of room
        client: {} // Action for user that send this request
    }
    */
    Service,
    /*
    {
        protocol = 'ws',
        server = 'localhost',
        port = '8080',
        onData,
        onError
    }
};
