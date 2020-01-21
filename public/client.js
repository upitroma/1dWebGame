//Make connection
var socket = io.connect(window.location.href);//change to server's location

var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    serverInfo = document.getElementById("serverinfo");

class player{
    constructor(socketId, username, color, score, position, cooldown){
        this.socketId=socketId;
        this.username=username;
        this.color=color;
        this.score=score;
        this.position=position;
        this.cooldown=cooldown;
    }
}

//emmit events
message.addEventListener("keypress",function(){
    socket.emit("keypress",handle.value);
});

//listen for server events
socket.on("keypress",function(data){
    console.log(data.message);
});
socket.on("serverPrivate",function(data){
    serverInfo.innerHTML="<p><em>[server]: "+data+"</em></p>";
    output.innerHTML+= "<p><server>"+"Server (only you can read this)"+": </server>"+data+"</p>";
});
socket.on("serverPublic",function(data){
    output.innerHTML+= "<p><server>"+"Server"+": </server>"+data+"</p>";
    serverInfo.innerHTML="<p><server>"+"Server"+": </server>"+data+"</p>"
})