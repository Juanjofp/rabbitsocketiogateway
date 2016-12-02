import AMQP from 'amqplib/callback_api';

const REQUEST = 'ex_request';
const RESPONSE = 'ex_response';

export default function createActionizer(server, responseCallback) {

    const SERVER = server || 'amqp://localhost';

    function publishObject(ch, topic, action) {
        ch.publish(REQUEST, topic, new Buffer(JSON.stringify(action)));
        console.log('ACTIONIZER MQTT REQUEST ' + topic, action);
    }

    return new Promise(function executor(resolve, reject) {
        AMQP.connect(SERVER, function(err, cnn) {
            if (err) {
                console.log('Error connecting RabbitMQ', err);
                reject(err);
                return;
            }
            console.log('Connected to Rabbit at', SERVER);
            // Creamos el canal de comunicación con el simulador
            cnn.createChannel(function(err, ch) {
                if (err) {
                    console.log('Error creating Channel', err);
                    reject(err);
                    return;
                }
                console.log('Channel created');
                // Indicamos el intercambiador para recibir las respuestas
                ch.assertExchange(RESPONSE, 'fanout', {durable: false});
                ch.assertQueue('', {exclusive: true}, function(err, q) {
                    ch.bindQueue(q.queue, RESPONSE, '');

                    ch.consume(q.queue, function(msg) {
                        const actionToService = JSON.parse(msg.content.toString());
                        console.log('ACTIONIZER MQTT RESPONSE', actionToService);
                        // TODO Replace for a distpatcher which update a store
                        // then roomer subscribe to store
                        responseCallback(actionToService);
                    }, {noAck: true});
                });

                // Indicamos el intercambiador de REQUEST para enviar las acciones
                ch.assertExchange(REQUEST, 'topic', {durable: false});

                // Devolvemos un objeto que permita enviar a request y a response
                let actzer = function(client, service, room, action) {
                    let topic = `${service}.${room}`;
                    let msg = {
                        service,
                        room,
                        client,
                        ...action
                    };
                    publishObject(ch, topic, msg);
                };
                console.log('Rabbit init ... DONE');
                resolve(actzer);
            });
        });
    });
}
