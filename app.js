const express = require('express');
const logger = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');

const app = express();
const server = require('http').createServer(app);
require('dotenv').config();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());
app.use(
    session({
        key: process.env.SECRET_KEY,
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('public'));

const PORT=process.env.PORT||3001;
server.listen(PORT, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`~Dream~Team~ up in here running on dat port ${PORT}! Sup~?`)
    }
});


app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const io = require('socket.io')(server);

var messages = {
    1: [],
    2: [],
    3: []
};
var users = {
    1: [],
    2: [],
    3: []
}
var userSelected = {
    1: [],
    2: [],
    3: []
};
var userHP = {};
var userCards = {};
var players = {
    1: [],
    2: [],
    3: []
};
var round = {};
var publicPlayers = {
    1: [],
    2: [],
    3: []
}



io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);
    
    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
    });

    socket.on('join room', (data) => {
        socket.join(data.room);
        console.log(`${data.username} joined room ${data.room}`);
        socket.emit('load messages', messages[data.room]);
        socket.emit('load players', publicPlayers[data.room]);
        users[data.room].push({
            username: data.username, 
            displayName: data.displayName, 
        })
        io.sockets.in(data.room).emit('load users', users[data.room]);
        if(players[data.room].length === 2){
                socket.emit('players full')
        }
    });

    socket.on('join game', (data) => {
        console.log(`${data.username} has joined the game!`)
        let publicCards = [];
        for (let i = 0; i < 5; i++) {
            publicCards.push({
                id: null,
                card_id: null,
                name: null,
                class: null,
                attack: null,
                defense: null,
                image_url: '/images/back_card.png'
            });
        };
        if(players[data.room].length < 2) {
            players[data.room].push({
                username: data.username,
                userCards: data.userCards,
                userHp: 20,
                userSelection: null,
            });
            publicPlayers[data.room].push({
                username: data.username,
                userCards: publicCards,
                userHp: 20,
                userSelection: false,
            });
            if(players[data.room].length === 2){
                io.sockets.in(data.room).emit('players full')
            }
        }
        io.sockets.in(data.room).emit('load players', publicPlayers[data.room]);
    });

    socket.on('confirm selection', data=>{
        players[data.room].forEach((player)=>{
            if(player.username === data.username){
                player.userSelection = data.selection;
            }
        })
        publicPlayers[data.room].forEach((player)=>{
            if(player.username === data.username){
                player.userSelection = true;
            }
        })
        io.sockets.in(data.room).emit('load players', publicPlayers[data.room])
        let cardsReadyCount = players[data.room].filter((player) => {
            return player.userSelection!==null;
        })
        if(cardsReadyCount.length === 2){
            fightFunction(data.room);
            io.sockets.in(data.room).emit('fight', publicPlayers[data.room]);
        }
        console.log(players[data.room][0].userHp);
        console.log(players[data.room][1].userHp)
        // console.log(players[data.room]);
    })

    
    const fightFunction = (room) => {
        let attackOne = players[room][0].userSelection.attack;
        let attackTwo = players[room][1].userSelection.attack;
        let defenseOne= players[room][0].userSelection.defense;
        let defenseTwo = players[room][1].userSelection.defense;
        let hpOne = players[room][0].userHp;
        let hpTwo = players[room][0].userHp;
        if(defenseOne < attackTwo
           && attackOne > defenseTwo){
               hpOne = hpOne - (attackTwo - defenseOne);
               hpTwo = hpTwo - (attackOne - defenseTwo);
        }else if(defenseOne < attackTwo
                 && attackOne <= defenseTwo){
               hpOne = hpOne - (attackTwo - defenseOne);
        }else if(defenseOne >= attackTwo
                 && attackOne > defenseTwo){
               hpTwo = hpTwo - (attackOne - defenseTwo);
        }
        players[room][0].userHp = hpOne;
        players[room][1].userHp = hpTwo;
        publicPlayers[room][0].userHp = hpOne;
        publicPlayers[room][1].userHp = hpTwo;
        publicPlayers[room][0].userSelection = players[room][0].userSelection;
        publicPlayers[room][1].userSelection = players[room][1].userSelection;
    }
    
    socket.on('message', (data) => {
        console.log(data.message, data.room);
        io.sockets.in(data.room).emit('receive message', data);
        messages[data.room].push(data.message);
        console.log(messages[data.room]);
        // console.log(data)
    })

    socket.on('leave room', (data) => {
        socket.leave(data.room);
        players[data.room] = players[data.room].filter((player) => {
            return player.username!==data.username;
        });
        publicPlayers[data.room] = publicPlayers[data.room].filter((player) => {
            return player.username!==data.username;
        });
        users[data.room] = users[data.room].filter((user) => {
            return user.username!==data.username;
        });
        io.sockets.in(data.room).emit('load players', publicPlayers[data.room]);
        io.sockets.in(data.room).emit('load users', users[data.room]);
        console.log(`${data.username} left room ${data.room}`);
        if(data.opponame){
            console.log(`${data.opponame} won the game`);
        }else{
            console.log('Game over')
        };
    });
});

const authRoutes = require('./routes/auth-routes');
app.use('/auth',authRoutes);
const userRoutes = require('./routes/user-routes');
app.use('/user',userRoutes);
const cardRoutes = require('./routes/card-routes');
app.use('/cards', cardRoutes);
const usercardRoutes = require('./routes/usercard-routes');
app.use('/usercard',usercardRoutes);

app.use('*',(req,res) => {
    res.status(400).json({
        message:'Not found!',
    });
})
