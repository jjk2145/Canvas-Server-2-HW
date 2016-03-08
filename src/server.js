var http = require('http');
var fs = require('fs');
var socketio = require('socket.io');

var port = process.env.PORT || process.env.NODE_PORT || 3000;

var index = fs.readFileSync(__dirname + '/../client/client.html');

function onRequest(request, response) {
	
	response.writeHead(200, {"Content-Type": "text/html"});
	response.write(index);
	response.end();
}

var app = http.createServer(onRequest).listen(port);

console.log("Listening on 127.0.0.1:" + port);

var io = socketio(app);

var usersOnline = 0;
var members = [];

var posX;
var posY;

var userJoined = function (socket){
	socket.on("join", function(data){
		socket.join('room1');
		usersOnline = usersOnline + 1;
		socket.name = data.name;
		members.push(socket.name);
		socket.in('room1').emit('msg', {
			msg: 'The user, ' + socket.name + ', has connected. Now there are ' + usersOnline + " user(s) online"
		});
		
		socket.emit('msg', {
			msg: 'You joined the room. Now there are ' + usersOnline + ' user(s) online'
		});
		
		if (usersOnline > 1){
			posX = Math.floor((Math.random()* 725) + 25);
			posY = Math.floor((Math.random()* 425) + 25);
			socket.posX = posX;
			socket.posY = posY;
			io.sockets.in('room1').emit('updateTheCanvas', {
				rectX: socket.posX,
				rectY: socket.posY
			});
		}
	});
};

var userClicked = function(socket){
	socket.on("clicked",function(data){
		socket.time = data.time;
		socket.name = data.name;
		socket.info = data.info;
		socket.x = data.x;
		socket.y = data.y;
		
		if(socket.x >= posX && socket.x <= (posX + 15) && socket.y >= posY && socket.y <= (posY + 15)){
			posX = Math.floor((Math.random()* 725) + 25);
			posY = Math.floor((Math.random()* 425) + 25);
			socket.posX = posX;
			socket.posY = posY;
			socket.points = data.points = data.points + 1;
			io.sockets.in('room1').emit('updateTheCanvas', {
				name: socket.name,
				time: socket.time,
				info: socket.info,
				points: socket.points,
				rectX: socket.posX,
				rectY: socket.posY
			});
		}
		
	});
};

var onDisconnect = function(socket){
	
	socket.on("disconnect", function(){
		usersOnline = usersOnline - 1;
		io.emit('msg', {
			msg: 'A user has disconnected. Now there are only ' + usersOnline + " user(s) online"
		});
		
		members.splice(members.indexOf(socket.name), 1);
	});
};

io.sockets.on('connection', function (socket) {
	userJoined(socket);
	userClicked(socket);
	onDisconnect(socket);
});


