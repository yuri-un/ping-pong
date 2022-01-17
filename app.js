const Type = Object.freeze({
    "Rectangle": 1,
    "Circle": 2,
    "AI": 3,
    "PC": 4,
    "Keyboard": 5,
    "Mouse": 6,
    "Point": 7,
    "Vector": 8,
    "SpeedVector": 9
});

class Game{
    #resizingId;
    #_canvasId = "board";

    constructor(){
        //this.board = new Board(this.#_canvasId);
        //this.board.render();

        this.menu = new GameMenu();
        console.log(this.menu);

        window.addEventListener('resize', this.#resize.bind(this), false);
        document.addEventListener('keydown', this.#gameKey.bind(this), false);

        this.menu.newGameBt.addEventListener('click', this.newGame.bind(this), false);
        this.menu.resumeGameBt.addEventListener('click', this.resumeGame.bind(this), false);
        this.menu.nextGameBt.addEventListener('click', this.nextGame.bind(this), false);
        this.menu.confBt.addEventListener('click', this.confGame.bind(this), false);
        this.menu.quitBt.addEventListener('click', this.quitGame.bind(this), false);

    }

    #gameKey(e){
        switch(e.key){
            case 'Escape':
                this.menu.pauseGame();
            break;
        }
    }

    newGame(){
        console.log('new game');
        // this.board = new Board(this.#_canvasId);
        // this.board.render();
        this.menu.startGame();
        console.log(this.menu);
    }

    restartGame(){
        console.log('restart game');
    }

    pauseGame(){
        console.log('pause game');
        //this.board.pause();
    }

    resumeGame(){
        console.log('resume game');
        this.menu.resumeGame();
    }

    nextGame(){
        console.log('next game');
    }

    confGame(){
        console.log('config game');
    }

    quitGame(){
        console.log('quit game');
        this.menu.quitGame();
    }


    #resize(){
        //this.board.pause();
        this.board = null;
        clearTimeout(this.#resizingId);

        this.#resizingId = setTimeout(() => {
            this.board = new Board(this.#_canvasId);
            this.board.render();
        }, 100);
    }
}

class GameMenu{
    constructor(){
        this.title = document.querySelector('#menu-title');
        this.newGameBt = document.querySelector('#new-game');
        this.resumeGameBt = document.querySelector('#resume-game');
        this.nextGameBt = document.querySelector('#next-game');
        this.confBt = document.querySelector('#conf');
        this.quitBt = document.querySelector('#quit');

        this.isIdle = true;
        this.isVisible = true;
        this.isPaused = false;
    }

    startGame(){
        this.isIdle = false;
        this.isVisible = !this.#isVisible();
        this.#hideMenu();
    }

    pauseGame(){
        this.isIdle = false;
        this.isVisible = this.#isVisible();
        this.isPaused = true;
        
        this.title.innerText = "Paused";
        this.#showMenu();
    }

    resumeGame(){
        this.isIdle = false;
        this.isVisible = false;
        this.isPaused = false;
        
        this.title.innerText = "Ping Pong";
        this.#hideMenu();
    }

    quitGame(){
        this.isIdle = true;

        this.#disableButtons([this.resumeGameBt, this.nextGameBt]);
    }

    #disableButtons(buttons){
        buttons.forEach(button => {
            button.disabled = true;
        });
    }

    #isVisible(){
        const displayVar = getComputedStyle(document.documentElement).getPropertyValue('--menu-display');

        if(displayVar == "block"){
            return true;
        }else{
            return false;
        }
    }

    #hideMenu(){
        document.documentElement.style.setProperty('--menu-display', "none");
    }

    #showMenu(){
        document.documentElement.style.setProperty('--menu-display', "block");
    }
}

class Board{
    vMap = [];
    #frameId;

    constructor(board){
        this.canvas = document.getElementById(board);
        this.ctx = this.canvas.getContext('2d');

        this.#init();

        this.borderTop = 40;
        this.borderBottom = this.borderTop;
        this.borderLeft = 10;
        this.borderRight = this.borderLeft;
        this.areaHeight = this.canvas.height - this.borderTop - this.borderBottom;
        this.areaWidth = this.canvas.width - this.borderLeft - this.borderRight;

        this.createMap();
        this.createModels();

        let requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

        let  cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
    }

    #init(){
        this.ctx.canvas.width = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight - 150;
    }

    createModels(){
        const midWidth = Math.round(this.canvas.width/2);
        const midHeight = Math.round(this.canvas.height/2);

        this.ball = new Ball(this, 150, 100, 25);

        this.ai = new AI(this, 2*this.borderLeft, midHeight, 25, 100);
        this.vMap.push(this.ai);

        this.pc = new PlayerController(this, this.canvas.width - 2*this.borderRight - 25, midHeight, 25, 100);
        this.vMap.push(this.pc);

    }

    createMap(){
        this.vMap.push(new Rectangle(this, 0, 0, this.canvas.width, this.borderTop)); //top border
        this.vMap.push(new Rectangle(this, 0, this.canvas.height - this.borderBottom, this.canvas.width, this.borderBottom)); //bottom border
        
        this.vMap.push(new Rectangle(this, 0, 20, 10, this.canvas.height - 40));
        this.vMap.push(new Rectangle(this, this.canvas.width - 10, 20, 10, this.canvas.height - 40));
        
        this.vMap.push(new Rectangle(this, 50, 350, 50, 50));
        this.vMap.push(new Rectangle(this, 230, 280, 100, 100));
        this.vMap.push(new Rectangle(this, 300, 50, 70, 70));
        //this.vMap.push(new Rectangle(this, 160, 90, 30, 100));
        //this.vMap.push(new Circle(this, 100, 90, 50));
    }

    render(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.vMap.forEach(obj =>{
            obj.draw();
            
            if(obj.checkCollision(this.ball)){
                this.ball.updateSpeedVector(obj);
            }
        });
        
        this.ball.draw();
        
        this.#frameId = window.requestAnimationFrame(this.render.bind(this));
    }

    pause(){
        window.cancelAnimationFrame(this.#frameId);
        console.log('pause');
        this.#init();
    }
}

//A point data structure. Contains x and y coordinates
class Point{
    #type;

    constructor(x, y){
        this.#type = Type.Point;

        this.x = Math.round(x);
        this.y = Math.round(y);
    }

    getType(){
        return this.#type;
    }
}

//A vector data structure. Contains a length and its projections
class Vector{
    #type;
    #length;
    #dX;
    #dY;

    constructor(dX, dY){
        this.#type = Type.Vector;

        this.#dX = Math.round(dX);
        this.#dY = Math.round(dY);
        this.#calcLength();
    }

    getdX(){
        return this.#dX;
    }
    
    setdX(dX){
        this.#dX = dX;
        this.#calcLength();
    }

    getdY(){
        return this.#dY;
    }
    
    setdY(dY){
        this.#dY = dY;
        this.#calcLength();
    }


    getLength(){
        return this.#length;
    }

    #calcLength(){
        const d = Math.sqrt(this.#dX*this.#dX + this.#dY*this.#dY);
        
        this.#length =  (d < 1)? 1: d; //1 -> unit vector
    }

    getType(){
        return this.#type;
    }
}

//Axis-aligned Bounding Box data structure. Represents the size of a figure
class AABB{
    #type;

    //min, max are Vectors
    constructor(min, max){
        this.#type = Type.Vector;

        this.min = min;
        this.max = max;
    }

    getType(){
        return this.#type;
    }
}

//Represents speed and direction of the ball
class SpeedVector{
    #type;
    #dX;
    #dY;
    #xDir;
    //angle is measured in deg (initial direction based on Ox axis)
    //rad - is a radian value that vary between 0 and 2*PI
    constructor(speed, angle){
        this.#type = Type.SpeedVector;

        this.speed = speed;
        this.rad = D2Math.angleToRad(angle);
        this.#dX = Math.round(speed*Math.cos(this.rad));
        this.#dY = Math.round(speed*Math.sin(this.rad));
        this.#xDir = 1;
    }

    setdX(dX){
        this.#dX = (dX === 0)? 1: dX;
        this.#checkQuadrant();
        this.#updateXDir();
    }

    getdX(){
        return this.#dX;
    }

    setdY(dY){
        this.#dY = (dY === 0)? 1: dY;
        this.#checkQuadrant();
        this.#updateXDir();
    }

    getdY(){
        return this.#dY;
    }

    #checkQuadrant(){
        const deltaAngle = Math.abs(Math.atan(this.#dY/this.#dX));

        if(this.#dX > 0 && this.#dY > 0){ //I
            this.rad = deltaAngle;
        }
        else if(this.#dX < 0 && this.#dY > 0){ //II
            this.rad = 3.1416 - deltaAngle;
        }
        else if(this.#dX < 0 && this.#dY < 0){ //III
            this.rad = 3.1416 + deltaAngle;
        }
        else if(this.#dX > 0 && this.#dY < 0){ //IV
            this.rad = 6.26 - deltaAngle;
        }
    }

    #updateXDir(){
        if(this.rad >= 1.57 && this.rad < 4.71){
            this.#xDir = -1; //to left
        }
        else{
            this.#xDir = 1; //to right
        }
    }

    getXDir(){
        return this.#xDir;
    }

    getType(){
        return this.#type;
    }
}

class Figure{
    constructor(ref, x, y){
        this.ref = ref;

        this.p1 = new Point(Math.round(x), Math.round(y)); //top-left
        this.currentPosition = this.p1;
    }
}

class Rectangle extends Figure{
    #type;

    constructor(ref, x, y, width, height){
        super(ref, x, y);
        this.#type = Type.Rectangle;

        this.width = (width === 0)? 1: Math.round(width);
        this.height = (height === 0)? 1: Math.round(height);

        this.p0 = new Point(Math.round(this.p1.x + Math.round(this.width/2)), Math.round(this.p1.y + Math.round(this.height/2))); //center
        this.p2 = new Point(Math.round(this.p1.x + this.width), Math.round(this.p1.y)); //top-right
        this.p3 = new Point(Math.round(this.p1.x + this.width), Math.round(this.p1.y + this.height)); //bottom-right
        this.p4 = new Point(Math.round(this.p1.x), Math.round(this.p1.y + this.height)); //bottom-left

        this.angleRatio = Math.atan(this.height / this.width);
        
        const v01 = new Vector(this.p1.x - this.p0.x, this.p1.y - this.p0.y); //center->top-left
        const v02 = new Vector(this.p2.x - this.p0.x, this.p2.y - this.p0.y); //center->top-right
        const v03 = new Vector(this.p3.x - this.p0.x, this.p3.y - this.p0.y); //center->bottom-right
        const v04 = new Vector(this.p4.x - this.p0.x, this.p4.y - this.p0.y); //center->bottom-left

        this.sideMap = new Map(); //vector map
        this.sideMap.set("top", [v01, v02]);
        this.sideMap.set("right", [v02, v03]);
        this.sideMap.set("bottom", [v03, v04]);
        this.sideMap.set("left", [v04, v01]);

        this.aabb = new AABB(new Vector(this.p1.x, this.p1.y), new Vector(this.p3.x, this.p3.y)); //set a simple collision edge
    }
    
    //AABB collision detection algorithm
    checkCollision(refBall){
        const d1x = this.aabb.min.getdX() - refBall.aabb.max.getdX();
        const d1y = this.aabb.min.getdY() - refBall.aabb.max.getdY();
        const d2x = refBall.aabb.min.getdX() - this.aabb.max.getdX();
        const d2y = refBall.aabb.min.getdY() - this.aabb.max.getdY();
        
        if(d1x > 0 || d1y > 0){
            return false;
        }
        if(d2x > 0 || d2y > 0){
            return false;
        }

        return true;
    }

    //Check if the rectangle is inside the board area
    checkArea(){
        const aiTopY = this.currentPosition.y;
        const aiBottomY = this.currentPosition.y + this.height;
        const interval = Math.round(this.ref.ball.radius/3);

        if((aiTopY - interval < this.ref.borderTop)){
            return false;
        }
        if (aiBottomY + interval > this.ref.areaHeight + this.ref.borderTop){
            return false;
        }

        return true; //is inside
    }

    update(){
        //this.p0 = new Point(Math.round(this.currentPosition.x + Math.round(this.width/2)), Math.round(this.currentPosition.y + Math.round(this.height/2)));
        this.p0.x = this.currentPosition.x + Math.round(this.width/2);
        this.p0.y = this.currentPosition.y + Math.round(this.height/2);

        //this.p1 = new Point(this.currentPosition.x, this.currentPosition.y);
        this.p1.x = this.currentPosition.x;
        this.p1.y = this.currentPosition.y;

        //this.p2 = new Point(this.currentPosition.x + this.width, this.currentPosition.y);
        this.p2.x = this.currentPosition.x + this.width;
        this.p2.y = this.currentPosition.y;

        //this.p3 = new Point(this.currentPosition.x + this.width, this.currentPosition.y + this.height);
        this.p3.x = this.currentPosition.x + this.width;
        this.p3.y = this.currentPosition.y + this.height;

        //this.p4 = new Point(this.currentPosition.x, this.currentPosition.x + this.height);
        this.p4.x = this.currentPosition.x;
        this.p4.y = this.currentPosition.y + this.height;

        //this.aabb = new AABB(new Vector(this.p1.x, this.p1.y), new Vector(this.p3.x, this.p3.y));
        this.aabb.min.setdX(this.p1.x);
        this.aabb.min.setdY(this.p1.y);
        this.aabb.max.setdX(this.p3.x);
        this.aabb.max.setdY(this.p3.y);
    }

    draw(){
        const ctx = this.ref.ctx;

        ctx.beginPath();
        ctx.fillStyle = "orange";
        ctx.fillRect(this.p1.x, this.p1.y, this.width, this.height);
        ctx.fill();
    }

    getType(){
        return this.#type;
    }
}

class Circle extends Figure{
    #type;

    constructor(ref, x, y, radius){
        super(ref, x, y);
        this.#type = Type.Circle;

        this.type = 'Circle';
        //this.p1 - initial drawing point of the figure
        this.radius = Math.round(radius);
        this.aabb = new AABB(new Vector(this.p1.x - this.radius, this.p1.y - this.radius), new Vector(this.p1.x + this.radius, this.p1.y + this.radius));
    }

    checkCollision(refBall){
        const dX = this.p1.x - refBall.currentPosition.x;
        const dY = this.p1.y - refBall.currentPosition.y;
        const d = Math.sqrt(dX*dX + dY*dY);

        if(d > (this.radius + refBall.radius)){
            return false;
        }
        
        return true;
    }

    draw(){
        const ctx = this.ref.ctx;
        
        ctx.beginPath();
        ctx.fillStyle = "blue";
        ctx.arc(this.p1.x, this.p1.y, this.radius, 0, 2*Math.PI);
        ctx.fill();
    }

    getType(){
        return this.#type;
    }
}

class Ball {
    _speed = 5;
    #dirVector;
    #previousPosition;
    #callNumber = 0;

    constructor(ref, x, y, radius){
        this.ref = ref;
        this.radius = Math.round(radius);

        this.currentPosition = new Point(Math.round(x), Math.round(y));
        this.#previousPosition = new Point(Math.round(x), Math.round(y));
        
        const min = new Vector(this.currentPosition.x - this.radius, this.currentPosition.y - this.radius);
        const max = new Vector(this.currentPosition.x + this.radius, this.currentPosition.y + this.radius);
        this.aabb = new AABB(min, max); //set a simple collision edge

        this.#dirVector = new SpeedVector(this._speed, 35);
    }

    getVector(){
        return this.#dirVector;
    }

    updateSpeedVector(impactObject){
        switch(impactObject.getType()){
            case Type.Circle:
                this.#updateVectorCircleToCircle(impactObject);
                break;
            case Type.Rectangle:
                this.#updateVectorCircleToRectangle(impactObject);
                break;
            case Type.AI:
                this.#updateVectorCircleToRectangle(impactObject);
                break;
            case Type.PC:
                this.#updateVectorCircleToRectangle(impactObject);
                break;
        }
    }

    #updateVectorCircleToCircle(impactObject){
        //transparent
        return;
    }

    calls(){
        return this.#callNumber;
    }

    #updateVectorCircleToRectangle(impactObject){
        //console.log('Vector reflection');
        const x = this.#previousPosition.x;
        const y = this.#previousPosition.y;

        const x0 = impactObject.p0.x;
        const y0 = impactObject.p0.y;
        const v0 = new Vector(x - x0, y - y0);
        
        //Check for a diagonal impact
        // const angleDelta = Math.abs(Math.acos(v0.dX / v0.getLength()) - impactObject.angleRatio);
        // if((0 <= angleDelta) && (angleDelta <= 0.1)){
        //     //this.#dirVector.setdX((-1)*this.#dirVector.getdX());
        //     this.#dirVector.setdY((-1)*this.#dirVector.getdY());
        // }

        //Check the impact side for the static figure
        impactObject.sideMap.forEach((value, key, map) => {
            this.#callNumber++;

            const sideVector = new Vector(value[1].getdX() - value[0].getdX(), value[1].getdY() - value[0].getdY());
            const negativeVector = new Vector((-1)*value[0].getdX(), (-1)*value[0].getdY());
            const vd = new Vector(v0.getdX() - value[0].getdX(), v0.getdY() - value[0].getdY());
            
            const v1 = v0.getdX()*value[0].getdY() - v0.getdY()*value[0].getdX(); //[v0, v01]
            const v2 = v0.getdX()*value[1].getdY() - v0.getdY()*value[1].getdX(); //[v0, v02]
            const v3 = sideVector.getdX()*negativeVector.getdY() - sideVector.getdY()*negativeVector.getdX(); //[sideVector, negativeVector]
            const v4 = sideVector.getdX()*vd.getdY() - sideVector.getdY()*vd.getdX(); //[sideVector, vd]

        if((v1*v2 < 0) && (v3*v4 < 0)){
            switch(key){
                case 'top':
                    this.#dirVector.setdY((-1)*this.#dirVector.getdY());
                    break;
                case 'right':
                    this.#dirVector.setdX((-1)*this.#dirVector.getdX());
                break;
                case 'bottom':
                this.#dirVector.setdY((-1)*this.#dirVector.getdY());
                break;
                case 'left':
                    this.#dirVector.setdX((-1)*this.#dirVector.getdX());
                break;
                }
            }
        });
    }
            
    #updatePosition(){
        this.#previousPosition = new Point(this.currentPosition.x, this.currentPosition.y);
        
        const deltaX = this.#dirVector.getdX();
        const deltaY = this.#dirVector.getdY();
        
        this.currentPosition.x += deltaX;
        this.currentPosition.y += deltaY;
        
        this.aabb.min.setdX(this.currentPosition.x - this.radius);
        this.aabb.min.setdY(this.currentPosition.y - this.radius);
        this.aabb.max.setdX(this.currentPosition.x + this.radius);
        this.aabb.max.setdY(this.currentPosition.y + this.radius);
    }

    draw(){
        const ctx = this.ref.ctx;
        this.#updatePosition();

        const x0 = this.currentPosition.x;
        const y0 = this.currentPosition.y;

        ctx.beginPath();
        ctx.lineWidth = 0;
        ctx.fillStyle = "green";
        ctx.ellipse(x0, y0, this.radius, this.radius, 0, 0, 2*Math.PI);
        ctx.fill();

        //this.#drawDevData();
    }

    #drawDevData(){
        const x0 = this.currentPosition.x;
        const y0 = this.currentPosition.y;
        const x1 = x0 + 10*this.#dirVector.speed*Math.cos(this.#dirVector.rad);
        const y1 = y0 + 10*this.#dirVector.speed*Math.sin(this.#dirVector.rad);

        this.ref.ctx.beginPath();
        this.ref.ctx.lineWidth = 2;
        this.ref.ctx.fillStyle = "green";
        this.ref.ctx.moveTo(x0, y0);
        this.ref.ctx.lineTo(x1, y1);
        this.ref.ctx.stroke();

        this.ref.ctx.beginPath();
        this.ref.ctx.font = '18px serif';
        this.ref.ctx.strokeText("Rad = " + Math.round(this.#dirVector.rad*1000)/1000 + " " + x0 + " " + y0, x1, y1);
    }
}

class AI extends Rectangle{
    #type;
    #maxSpeed = 7;
    #difficultyMode = 1;

    constructor(ref, x, y, width, height){
        super(ref, x, y, width, height);
        this.#type = Type.AI;

        this.centerHeight = Math.round(height/2);
        this.defaultPosition = new Point(this.currentPosition.x, Math.round(this.ref.canvas.height/2) - this.centerHeight);
        this.speedY = 0;
    }

    trackBall(){
        if(this.ref.ball.getVector().getXDir() > 0)
        {
            this.#returnToDefaultPosition();
            return;
        }

        this.#followBallPosition();
    }

    #returnToDefaultPosition(){
        const deltaY = this.defaultPosition.y - this.currentPosition.y;

        if(Math.abs(deltaY) <= 2){
            return;
        }

        this.speedY = Math.log(Math.abs(deltaY));

        if(deltaY > 0) {
            this.currentPosition.y += this.speedY;
        }else{
            this.currentPosition.y -= this.speedY;
        }
    }
    
    #followBallPosition(){
        const oldPos = new Point(this.currentPosition.x, this.currentPosition.y);
        const ballPosY = this.ref.ball.currentPosition.y;
        const deltaY = ballPosY - (this.currentPosition.y + this.centerHeight);
        const randomizeSpeed = Math.random()*this.#difficultyMode;

        if(Math.abs(deltaY) <= 2){
            return;
        }

        this.speedY = Math.round(Math.log(Math.abs(deltaY)) - randomizeSpeed);
        this.speedY = (this.speedY > this.#maxSpeed)? this.#maxSpeed: this.speedY;

        if(deltaY > 0) {
            this.currentPosition.y += this.speedY;
        } else {
            this.currentPosition.y -= this.speedY;
        }

        if(!this.checkArea()) this.currentPosition = oldPos;
    }

    draw(){
        const ctx = this.ref.ctx;

        this.update();
        this.trackBall();

        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.fillRect(this.currentPosition.x, this.currentPosition.y, this.width, this.height);
    }

    getType(){
        return this.#type;
    }
}

class PlayerController extends Rectangle{
    #type;
    #maxSpeed = 7;

    constructor(ref, x, y, width, height){
        super(ref, x, y, width, height);
        this.#type = Type.PC;

        this.centerHeight = Math.round(height/2);
        this.defaultPosition = new Point(this.currentPosition.x, this.currentPosition.y - this.centerHeight);

        this.controller = new ControllerBuilder(this.ref).setKeyboard().setMouse().build();
        this.speedY = 0;
        this.n = 0;
    }

    movePC(){
        const oldPos = new Point(this.currentPosition.x, this.currentPosition.y);
        
        if(Controller.mode === Type.Keyboard){
            const io = this.controller.keyboard;

            if(io.keyPressed){
                this.speedY += 0.05 + this.speedY;
                this.speedY = (this.speedY > this.#maxSpeed)? this.#maxSpeed: this.speedY;
    
                if(io.keyUp){
                    this.currentPosition.y -= this.speedY;
                }
        
                if(io.keyDown){
                    this.currentPosition.y += this.speedY;
                }

                if(!this.checkArea()) this.currentPosition = oldPos;
            }else{
                this.speedY = 0;
            }
        }

        if(Controller.mode === Type.Mouse){
            const io = this.controller.mouse;
            
            if(io.moveCommand){
                const distance = io.leftClickPos.y - this.currentPosition.y;
                this.speedY += 0.05 + this.speedY;
                this.speedY = (this.speedY > this.#maxSpeed)? this.#maxSpeed: this.speedY;
                
                if(distance < (-1)*this.speedY){
                    this.currentPosition.y -= this.speedY;
                }
                else if(distance > this.speedY){
                    this.currentPosition.y += this.speedY;
                }else{
                    io.moveCommand = false;
                }
    
                if(!this.checkArea()) this.currentPosition = oldPos;
            }else{
                this.speedY = 0;
            }
        }
    }

    draw(){
        const ctx = this.ref.ctx;
        this.update();
        this.movePC();

        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.fillRect(this.currentPosition.x, this.currentPosition.y, this.width, this.height);
    }

    getType(){
        return this.#type;
    }
}

//Generic user controller interface
class Controller{
    static mode = Type.Keyboard;

    constructor(ref, keyboard, mouse){
        this.ref = ref;

        this.keyboard = keyboard;
        this.mouse = mouse;
    }
}

//Defines the Builder pattern
class ControllerBuilder{
    constructor(ref){
        this.ref = ref;
    }

    setKeyboard(){
        this.keyboard =  new KeyboardController(this.ref);
        return this;
    }

    setMouse(){
        this.mouse = new MouseController(this.ref);
        return this;
    }

    build(){
        if(!('keyboard' in this)){
            this.keyboard = null;
        }
        if(!('mouse' in this)){
            this.mouse = null;
        }

        if(!('keyboard' in this) && !('mouse' in this)){
            throw new Error('User I/O controller is missing');
        }

        return new Controller(this.ref, this.keyboard, this.mouse);
    }
}

class KeyboardController{
    #type;

    constructor(ref){
        this.ref = ref;
        this.#type = Type.Keyboard;

        this.keyPressed = false;
        this.keyUp = false;
        this.keyDown = false;

        document.addEventListener('keydown', this.#readKeyboardIO.bind(this), false);
        document.addEventListener('keyup', this.#releaseKeyboardIO.bind(this), false);
    }

    #readKeyboardIO(e){
        e.preventDefault();
        e.stopPropagation();

        switch(e.key){
            case 'Enter':
                this.keyDown = false;
                this.keyUp = false;
                this.#setMode();
            break;

            case 'ArrowUp':
                this.keyPressed = true;
                this.keyUp = true;
                this.keyDown = false;
                this.#setMode();
            break;

            case 'ArrowDown':
                this.keyPressed = true;
                this.keyDown = true;
                this.keyUp = false;
                this.#setMode();
            break;
        }
    }

    #releaseKeyboardIO(e){
        e.preventDefault();
        e.stopPropagation();

        this.keyPressed = false;
        this.keyDown = false;
        this.keyUp = false;
    }

    #setMode(){
        Controller.mode = Type.Keyboard;
    }

    getType(){
        return this.#type;
    }
}

class MouseController{
    #type;

    constructor(ref){
        this.ref = ref;
        this.#type = Type.Mouse;
        this.canvas = this.ref.canvas;

        this.position = new Point(0, 0);
        this.leftClickPos = new Point(0, 0);
        this.rightClickPos = new Point(0, 0);
        this.movement = new Vector(0, 0);
        this.moveCommand = false;

        this.canvas.addEventListener('mousemove', this.#detectMouseXY.bind(this), false);
        this.canvas.addEventListener('mousedown', this.#detectMouseClick.bind(this), false);
    }

    #detectMouseXY(e){
        const rect = this.canvas.getBoundingClientRect();
        this.position.x = e.clientX - rect.left;
        this.position.y = e.clientY - rect.top;

        this.#setMode();
    }

    #detectMouseClick(e){
        const rect = this.canvas.getBoundingClientRect();
        this.leftClickPos.x = e.clientX - rect.left;
        this.leftClickPos.y = e.clientY - rect.top;

        this.moveCommand = true;

        this.#setMode();
    }

    #setMode(){
        Controller.mode = Type.Mouse;
    }

    getType(){
        return this.#type;
    }
}

class D2Math{
    static angleToRad(angle){
        return 2*Math.PI*angle/360;
    }

    static radToAngle(rad){
        return rad*360/2*Math.PI;
    } 
}


const game = new Game();

//const board = new Board("board").render();