//Make connection
var socket = io.connect(window.location.href);//change to server's location
var mySocketId = -1

var uploadrate=.3


//get html assets
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    serverInfo = document.getElementById("serverinfo");

//define player for later
class player{
    constructor(position, id){
        this.position=position;
        this.id=id;
        this.isActive=true;
        this.colorId = 2;
    }
}


//handle inputs
var keys = [];
window.onkeyup = function(e) { keys[e.keyCode] = false; }
window.onkeydown = function(e) { keys[e.keyCode] = true; } 

var pastKeys = []

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
            


            //get color
            var color
            if(p.colorId==0){color="red"}
            else if(p.colorId==1){color="green"}
            else if(p.colorId==2){color="blue"}


            if(p.id==mySocketId){
                if(keys[65]){
                    p.position-=200*deltatime
                }
                if(keys[68]){
                    p.position+=200*deltatime
                }

                //change color
                if(keys[69]&&!pastKeys[69]){
                    p.colorId++
                    pastKeys[69]=true
                }
                else if(!keys[69]){
                    pastKeys[69]=false
                }
                if(keys[81]&&!pastKeys[81]){
                    p.colorId--
                    pastKeys[81]=true
                    
                }
                else if(!keys[81]){
                    pastKeys[81]=false
                }

                //loop color
                if(p.colorId<0){
                    p.colorId=2
                }
                if(p.colorId>2){
                    p.colorId=0
                }
                console.log(p.colorId)
                


                


                uploadtimer+=deltatime
                if(uploadtimer>uploadrate){
                    updatePlayer(p)
                }
                

                //clamp coordinate within the border
                p.position=Math.max(borderm, Math.min(p.position, canvas.width-borderh-borderm))
                context.fillStyle= color;
                context.fillRect(p.position,bordery,borderh,borderh);

                //identify me
                context.fillStyle= 'white';
                context.fillRect(p.position+(borderh/4),bordery+(borderh/4),borderh-(borderh/2),borderh-(borderh/2));
            }
            else if(p.isActive){

                

                //clamp coordinate within the border
                p.position=Math.max(borderm, Math.min(p.position, canvas.width-borderh-borderm))
                context.fillStyle= color;
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

socket.on("serverPlayerDisconnect",function(data){

    for( var i = 0; i < players.length; i++){ 
        if ( players[i].id == data) {
            players[i].isActive=false

            players.splice(i, 1);//save some memory
        }
     }
})

socket.on("newPlayer",function(data){
    players.push(new player(Math.floor(data.random * (canvas.width-borderh-borderm+1)),data.id))
})

socket.on("serverMessage",function(data){
    serverInfo.innerHTML="[server]: "+data
})

socket.on("playerdata",function(data){
    //update player in question and add unrecognised players

    var isNew = true
    //move the player
    if(data.id!=mySocketId){
        players.forEach(function(p){
            if(p.id==data.id){
                if(p.isActive){
                    p.position=data.position
                    isNew=false
                }
                else{
                    isNew=false
                }
            }
        });

        if(isNew){
            players.push(new player(data.position,data.id))
        }
    }
});
