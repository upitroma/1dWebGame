//Make connection
var socket = io.connect(window.location.href);//change to server's location


//get html assets
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    serverInfo = document.getElementById("serverinfo");

//define player for later
class player{
    /*
    constructor(socketId, username, color, score, position, cooldown){
        this.socketId=socketId;
        this.username=username;
        this.color=color;
        this.score=score;
        this.position=position;
        this.cooldown=cooldown;
    }
    */
    //test constructor
    constructor(position){
        this.position=position;
    }
}

//handle inputs
var keys = {};
window.onkeyup = function(e) { keys[e.keyCode] = false; }
window.onkeydown = function(e) { keys[e.keyCode] = true; } 

//canvas setup----------------------------

var p1=new player(0);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var bordery=(window.innerHeight/2)-100
var borderh=100
var borderm=50
function drawBorder(){

    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle= 'white';
    context.fillRect(borderm,bordery,canvas.width-(2*borderm),borderh);
}


//game logic------------------------------------

window.onload = function(){
    function update(deltatime){
        // ten times/second
        /*
        37 left
        39 right
        65 a
        68 d
        81 q
        69 e
        */

        if(keys[65]){
            p1.position-=200*deltatime
        }
        if(keys[68]){
            p1.position+=200*deltatime
        }

        //clamp coordinate within the border
        p1.position=Math.max(borderm, Math.min(p1.position, canvas.width-borderh-borderm))

        canvas.width=canvas.width;//refresh canvas
        drawBorder()

        context.fillStyle= 'red';
        context.fillRect(p1.position,bordery,borderh,borderh);

        context.stroke();
    }



    //tick----------------
    
    //https://stackoverflow.com/questions/13996267/loop-forever-and-provide-delta-time
    var lastTick = performance.now()
    function tick(nowish) {
        var delta = nowish - lastTick
        lastTick = nowish
        delta/=1000
        update(delta)
        window.requestAnimationFrame(tick)
    }
    window.requestAnimationFrame(tick)
}

//networking---------------------------

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