import Service from '../src/libs/service';

const requestFromGateway = (action, response) => {
    console.log('Info MS', action);
    let responseAction = {
        client: {
            type: 'INFO_ACK'
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
    name: 'MSINFO',
    requestFromGateway: requestFromGateway
})
.catch(
    (err) => {
        console.log('Service Error', err);
    }
);
