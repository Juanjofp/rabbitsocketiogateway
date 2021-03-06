import Service from '../src/libs/service';

const requestFromGateway = (action, response) => {
    console.log('MSUSERS', action);
    let responseAction = {
        service: {
            type: 'MSUSERS_ACK'
        }
    };

    if (action.type === 'FORWARD') {
        responseAction.action = {
            type: '@@FORWARD',
            action: {
                service: 'MSINFO',
                room: 'DEFAULT',
                client: action.client,
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
