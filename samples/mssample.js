import Service from '../src/libs/service';

const requestFromGateway = (action, response) => {
    let responseAction = {
        service: {
            type: 'ACK'
        }
    };

    if (action.type === 'EXIT') {
        responseAction.action = {
            type: '@@EXIT',
            room: 'ALL'
        };
    }

    response(responseAction);
};

Service({
    name: 'MSUSERS',
    requestFromGateway: requestFromGateway
})
.catch(
    (err) => {
        console.log('Service Error', err);
    }
);
