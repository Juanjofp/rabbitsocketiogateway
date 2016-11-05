import Service from '../src/libs/service';

Service(/*{name: 'MSUSERS'}*/)
.catch(
    (err) => {
        console.log('Service Error', err);
    }
);
