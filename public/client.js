//Make connection
var socket = io.connect(window.location.href);//change to server's location
var mySocketId = -1


//get html assets
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    serverInfo = document.getElementById("serverinfo");

//define player for later
class player{
    constructor(position, id){
        this.position=position;
        this.id=id;
    }
}

//handle inputs
var keys = [];
window.onkeyup = function(e) { keys[e.keyCode] = false; }
window.onkeydown = function(e) { keys[e.keyCode] = true; } 

//canvas setup----------------------------



var players=[];


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
var uploadrate=.1
var uploadtimer=0
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
        canvas.width=canvas.width;//refresh canvas
        drawBorder()

        players.forEach(function(p){
            if(p.id==mySocketId){
                if(keys[65]){
                    p.position-=200*deltatime
                }
                if(keys[68]){
                    p.position+=200*deltatime
                }
                uploadtimer+=deltatime
                if(uploadtimer>uploadrate){
                    updatePlayer(p)
                    console.log("I moved to "+p.position)
                }
                

                //clamp coordinate within the border
                p.position=Math.max(borderm, Math.min(p.position, canvas.width-borderh-borderm))
                context.fillStyle= 'red';
                context.fillRect(p.position,bordery,borderh,borderh);

                //identify me
                context.fillStyle= 'white';
                context.fillRect(p.position+(borderh/4),bordery+(borderh/4),borderh-(borderh/2),borderh-(borderh/2));
            }
            else{
                //clamp coordinate within the border
                p.position=Math.max(borderm, Math.min(p.position, canvas.width-borderh-borderm))
                context.fillStyle= 'red';
                context.fillRect(p.position,bordery,borderh,borderh);
            }
            
        });
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
function updatePlayer(p){
    socket.emit("playerdata",{
        position: p.position
    });
}

//listen for server events

socket.on("serverPrivate",function(data){
    if(mySocketId==-1){
        //add self to game
        mySocketId=data
    }
});

socket.on("newPlayer",function(data){
    players.push(new player(Math.floor(data.random * (canvas.width-borderh-borderm+1)),data.id))
})

socket.on("serverMessage",function(data){
    serverInfo.innerHTML="[server]: "+data
})

socket.on("playerdata",function(data){
    //update player in question and add unrecognised players
    console.log("socket "+data.id+" moved to "+ data.position);

    
    var isNew = true
    //move the player
    if(data.id!=mySocketId){
        players.forEach(function(p){
            if(p.id==data.id){
                p.position=data.position
                isNew=false
            }
        });

        if(isNew){
            players.push(new player(data.position,data.id))
        }

    }
    

});