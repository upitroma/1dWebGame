//Make connection
var socket = io.connect(window.location.href);//change to server's location
var mySocketId = -1

var uploadrate=.3
var fireRate=1


//get html assets
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    serverInfo = document.getElementById("serverinfo");

//hide scrollbar
document.body.style.overflow = 'hidden';


//define objects
class player{
    constructor(position, id){
        this.position=position;
        this.id=id;
        this.isActive=true;
        this.colorId = 2;
    }
}
class bullet{
    constructor(position, colorId, shooterId, direction){
        this.position=position
        this.colorId=colorId
        this.shooterId=shooterId
        this.isActive=true
        this.direction=direction //1=right, -1=left
    }
}


//handle inputs
var keys = [];
window.onkeyup = function(e) { keys[e.keyCode] = false; }
window.onkeydown = function(e) { keys[e.keyCode] = true; } 

var pastKeys = []

//canvas setup----------------------------



var players=[];
var bullets=[];

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
var fireTimer=0
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

        //render bullets
        bullets.forEach(function(b){

            //get color
            var color
            if(b.colorId==0){color="red"}
            else if(b.colorId==1){color="green"}
            else if(b.colorId==2){color="blue"}

            //move bullet
            
            b.position += ((b.colorId*100)+250)*deltatime*b.direction
            


            //render bullet
            context.fillStyle=color;
            context.fillRect(b.position+(borderh*.45),bordery,borderh-(borderh*.9),borderh);
        });

        //render players
        players.forEach(function(p){
            
            //get color
            var color
            if(p.colorId==0){color="red"}
            else if(p.colorId==1){color="green"}
            else if(p.colorId==2){color="blue"}


            if(p.id==mySocketId){
                if(keys[65]){
                    p.position-=400*deltatime//200
                }
                if(keys[68]){
                    p.position+=400*deltatime//200
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

                //fire bullet
                fireTimer+=deltatime

                if(fireTimer>fireRate){
                    if(keys[37]&&!pastKeys[37]){
                        fireBullet(p,-1)
                        pastKeys[37]=true
                        fireTimer=0
                    }
                    else if(!keys[37]){
                        pastKeys[37]=false
                    }
                    if(keys[39]&&!pastKeys[39]){
                        fireBullet(p,1)
                        pastKeys[39]=true
                        fireTimer=0
                    }
                    else if(!keys[39]){
                        pastKeys[39]=false
                    }
                }
                


                


                uploadtimer+=deltatime
                if(uploadtimer>uploadrate){
                    updatePlayer(p)
                }
                

                //clamp coordinate within the border
                p.position=Math.max(borderm, Math.min(p.position, canvas.width-borderh-borderm))
                context.fillStyle= color;
                context.fillRect(p.position,bordery,borderh,borderh);

                //identify me
                context.fillStyle= 'gold';
                context.fillRect(p.position+(borderh*.45),bordery,borderh-(borderh*.9),borderh);

                //collision
                bullets.forEach(function(b){
                    if(b.isActive){
                        if(b.position<p.position+borderh&&b.position>p.position){
                            //bullet is touching
                            console.log("hit")
                            if(b.colorId!=p.colorId){
                                //colors match
                                b.isActive=false
                            }
                            
                        }
                    }
                });
            }
            else if(p.isActive){

                

                //clamp coordinate within the border
                p.position=Math.max(borderm, Math.min(p.position, canvas.width-borderh-borderm))
                context.fillStyle= color;
                context.fillRect(p.position,bordery,borderh,borderh);
            }
            
        });
        context.stroke();


        //collision
        
        
 
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
        position: p.position,
        colorId: p.colorId
    });
}

function fireBullet(p,direction){
    socket.emit("fireBullet",{
        startPosition: p.position,
        direction: direction,
        colorId: p.colorId
    });
}

//listen for server events
socket.on("fireBullet",function(data){
    bullets.push(new bullet(data.startPosition,data.colorId,data.shooterId,data.direction))
});


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
                    p.colorId=data.colorId
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
