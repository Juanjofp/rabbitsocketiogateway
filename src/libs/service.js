// procesa cada mensaje recibido por estas colas
// y devuelve lo procesado por al cola RESPONSE
import AMQP from 'amqplib/callback_api';

const REQUEST = 'ex_request';
const RESPONSE = 'ex_response';

function defaultResponse(action, response) {
    console.log('Receive>', action);
    response({type: '@@DEFAULT'});
}

export default function initService(
    {
        server = 'amqp://localhost',
        name = 'DEFAULT',
        requestFromGateway = defaultResponse
    } = {}
) {
    const TOPIC = `${name}.#`;

    return new Promise(
        (resolve, reject) => {
            AMQP.connect(server, function(err, cnn) {
                if (err) {
                    throw err;
                }
                // Creamos el canal de comunicación del simulador
                cnn.createChannel(function(err, ch) {
                    if (err) {
                        throw err;
                    }

                    function sendActionToGateway(service, room, client, action) {
                        /*
                        service: id del servicio
                        room: id de la room
                        client: id del cliente
                        action: {
                            action: {} // Action for gateway, to take care
                            service: {} // Action for all user of service
                            room: {} // Action for all user of room
                            client: {} // Action for user that send this request
                        }
                        */
                        var data = {
                            serviceId: service,
                            roomId: action.roomId || room,
                            clientId: action.clientId || client,
                            ...action
                        };
                        ch.publish(RESPONSE, '', new Buffer(JSON.stringify(data)));
                    }

                    // Declaramos el tipo de intercambiador
                    // que queremos utilizar, en nuestro caso
                    // topic para enrutar las colas segun la
                    // mac
                    ch.assertExchange(REQUEST, 'topic', {durable: false});
                    // Intercambiador para el envio de respuestas
                    ch.assertExchange(RESPONSE, 'fanout', {durable: false});

                    ch.assertQueue(
                        '',
                        {exclusive: true},
                        function(err, q) {
                            console.log('[*] Service ' + name + ' waiting for ', TOPIC);
                            // Nos suscribimos a acciones de lectura
                            ch.bindQueue(q.queue, REQUEST, TOPIC);

                            // Consumimos los mensajes del intercambiador
                            ch.consume(q.queue, function(msg) {
                                // Recibimos el mensaje, lo procesamos y lo devolvemos
                                let newAction = msg.content.toString(),
                                    newActionParsed = JSON.parse(newAction);
                                console.log('REQUEST >', msg.fields.routingKey, newAction);
                                // Procesamos la peticion
                                requestFromGateway(
                                    newActionParsed,
                                    sendActionToGateway.bind(
                                        Object.create(null),
                                        newActionParsed.service,
                                        newActionParsed.room,
                                        newActionParsed.client
                                    )
                                );

                            }, {noAck: false});
                        }
                    );

                    // Send firt message to gateway, to say it is availabe
                    var initialData = {
                        serviceId: name,
                        action: {
                            type: '@@INIT'
                        }
                    };
                    ch.publish(RESPONSE, '', new Buffer(JSON.stringify(initialData)));

                    resolve({
                        sendAction: sendActionToGateway.bind(
                            Object.create(null),
                            name
                        )
                    });
                });
            });
        }
    );
}
