var express = require('express');
var app = express();
var httpServer = require('http').createServer(app);
var five = require('johnny-five');
var io = require('socket.io')(httpServer);
var mongoose = require('mongoose');

var puerto = 8080;
var ip = '127.0.0.1';

mongoose.connect('mongodb://127.0.0.1/temp', function(err){//<-------------MongoDB: Conectarse a base de datos.
        if(err){
                console.log(err);
        } else{
                console.log('Connected to mongodb!');
        }
});

var tempSchema = mongoose.Schema({//<-------------------------------------MongoDB: Crear "schema".
        temperatura: Number,
	hora: { type: Date, default: Date.now }
});

var temp = mongoose.model("temperatura", tempSchema);//<---------------MongoDB: Acceder a la colección "temperatura".


////////////////////////////////////////////////////////////////////////
// Servidor
//////////////////////////////////////////////////////////////////////

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res) {
        res.sendFile(__dirname + '/temperatura.html');
});

httpServer.listen(puerto, ip, function() {
        console.log('El servidor está listo...');
});



//////////////////////////////////////////////////////////////////////
// Placa
/////////////////////////////////////////////////////////////////////

var board = new five.Board();
var t;

board.on("ready", function() {
  // This requires OneWire support using the ConfigurableFirmata
  var temperature = new five.Temperature({
    controller: "DS18B20",
    pin: 2
  });

  temperature.on("data", function(err, value) {// En cuanto haya lecturas ("data") correr los comandos de la fn.

//    console.log(this.celsius + "°C");
    board.emit("temp", this.celsius);  // Socket: de placa a servidor.


if(this.celsius != t) {

t = this.celsius;
    var Temp = new temp({ temperatura: t });

    Temp.save(function(err){
	if(err) throw err;
    });

console.log(t + " " + Date.now());

}

  });

});

/////////////////////////////////////////////////////////////////////
// Socket.io
////////////////////////////////////////////////////////////////////

io.on('connection', function(socket) {
        console.log(socket.id);

        board.on("temp", function( val) {
                socket.emit("ya", { val: val }); // De servidor a cliente.
        });
});

