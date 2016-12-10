import Service from '../src/libs/service';

const requestFromGateway = (action, response) => {
    let responseAction = {
        service: {
            type: 'ACK'
        }
    };

    if (action.type === 'EXIT') {
        responseAction.action = {
            type: '@@FORWARD',
            service: 'MSINFO',
            room: 'DEFAULT',
            action: {
                'type': 'DO_NOTHING'
            }
        };
    }

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
