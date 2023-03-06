const express = require('express');
const cors = require('cors');
const monk = require('monk');
const Filter = require('bad-words');
const rateLimit = require('express-rate-limit');

const app = express();

const db = monk(process.env.MONGO_URI || 'localhost/messageboard');
const messages = db.get('messages');
const filter = new Filter();

app.enable('trust proxy');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'You sent a message!'
    });
});

app.get('/messages', (req, res) => {
    messages
     .find()
     .then(mews =>{
        res.json(messages);
     }).catch(next);
});

app.get('v2/messages', (req, res, next) => {
    let { skip = 0, limit = 5, sort = 'desc'} = req.query;
    skip = parseInt(skip) || 0;
    limit = parseInt(limit) || 5,

    skip = skip < 0 ? 0 : skip;
    limit = Math.min(50, Math.max(1, limit));

    Promise.all([
        messages
         .count(),
        messages
         .find({}, {
            skip,
            limit,
            sort: {
                created: sort === 'desc' ? -1 : 1
            }
         })
    ])
     .then(([ total, messages]) => {
      res.json({
        messages,
        meta: {
            total,
            skip,
            limit,
            has_more: total - (skip + limit) > 0,
        }
      });
     }).catch(next);
});

function isValidMessage(message) {
    return message.name && message.name.toString().trim() != '' && message.name.toString().trim().lenth <= 50 &&
    message.content && message.content.toString().trim() != '' && message.content.toString().trim().length <= 150;
}

app.use(rateLimit({
    windowMs: 10 * 1000,
    max: 1
}));

const createdMessage = (req, res, next) => {
    if (isValidMessage(req.body)) {
      const message = {
        name: filter.clean(req.body.name.toString().trim()),
        content: filter.clean(req.body.content.toString().trim()),
        created: new Date()
      };
  
      messages
        .insert(message)
        .then(createdMessage => {
          res.json(createdMessage);
        }).catch(next);
    } else {
      res.status(422);
      res.json({
        errorMessage: 'Hey! Name and Content are required! Name cannot be longer than 50 characters. Content cannot be longer than 140 characters.'
      });
    }
};

app.post('/messages', createdMessage);
app.post('/v2/messages', createdMessage);

app.use((error, req, res, next) => {
    res.status(500);
    res.json({
        othermessage: error.othermessage
    });
});

app.listen(5000, () => {
    console.log('Listening on https://localhost:5000');
});