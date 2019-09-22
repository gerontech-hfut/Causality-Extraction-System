const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const neo4j_driver = require('neo4j-driver')
const users = require('./routers/api/users');
const profiles = require('./routers/api/profiles');
const app = express();

// DB config
const db = require('./config/store').mongooseURL;
const uri = require('./config/store').neo4j.URL;
const username = require('./config/store').neo4j.USER;
const password = require('./config/store').neo4j.PASSWORD;

// connect to db 
mongoose.connect(db)
    .then(() => console.log('mongoDB connected'))
    .catch(err => console.log(err))

// 使用 body-parser 中间件
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(passport.initialize());
require('./config/passport')(passport);

const port = process.env.PORT || 5000;

// Neo4j connection
// var neo4j = neo4j_driver.v1;
// const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
// const session = driver.session()

// const resultPromise = session.writeTransaction(tx =>
//   tx.run(
//     'CREATE (a:Greeting) SET a.message = $message RETURN a.message + ", from node " + id(a)',
//     { message: 'hello, world' }
//   )
// )

// resultPromise.then(result => {
//   session.close()

//   const singleRecord = result.records[0]
//   const greeting = singleRecord.get(0)

//   console.log(greeting)

//   // on application exit:
//   driver.close()
// })

const Neode = require('neode');

const instance = new Neode(uri, username, password);
instance.model('Person', {
    person_id: {
        primary: true,
        type: 'uuid',
        required: true, // Creates an Exists Constraint in Enterprise mode
    },
    payroll: {
        type: 'number',
        unique: 'true', // Creates a Unique Constraint
    },
    name: {
        type: 'name',
        index: true, // Creates an Index
    },
    age: 'number' // Simple schema definition of property : type
});
instance.model('Person').relationship('knows', 'relationship', 'KNOWS', 'out', 'Person', {
    since: {
        type: 'datetime',
        required: true,
    },
    defaulted: {
        type: 'string',
        default: 'default'
    }
});
Promise.all([
    instance.create('Person', {name: 'Adam'}),
    instance.create('Person', {name: 'Joe'})
])
.then(([adam, joe]) => {
    console.log('adam', adam.id(), adam.get('person_id'), adam.get('name'));
    console.log('joe', joe.id(), joe.get('person_id'), joe.get('name'));

    return adam.relateTo(joe, 'knows', {since: new Date('2017-01-02 12:34:56')});
});



app.get('/', (req, res) => {
    res.send('hello world! ');
})
app.use('/api/users', users);
app.use('/api/profiles', profiles);

app.listen(port, () => {
    console.log(`Server listening at port ${port}`);
})