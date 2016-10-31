import Client from '../src/libs/client';

var sendAction = Client();

setInterval(
    () => {
        sendAction('MSUSER', 'DEFAULT', {type: 'LOGIN', username: 'juanjo', password: '123456'});
    },
    15000
);
