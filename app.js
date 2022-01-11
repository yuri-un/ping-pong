const Type = Object.freeze({
    "Rectangle": 1,
    "Circle": 2,
    "AI": 3,
    "PC": 4,
    "Point": 5,
    "Vector": 6,
    "SpeedVector": 7
});

class Game{
    isInitialised;
    isPaused;
    difficulty;

    newGame(){
        console.log('new game');
    }
    restartGame(){

    }
    pauseGame(){

    }
    resumeGame(){

    }
    gameDifficulty(){

    }
}

class Board{
    canvas;
    ctx;
    x;
    ai;

    vMap = [];

    constructor(board){
        this.canvas = document.getElementById(board);
        this.ctx = this.canvas.getContext('2d');

        this.#resize();

        this.x = 1;
        this.borderTop = 40;
        this.borderBottom = this.borderTop;
        this.borderLeft = 10;
        this.borderRight = this.borderLeft;
        this.areaHeight = this.canvas.height - this.borderTop - this.borderBottom;
        this.areaWidth = this.canvas.width - this.borderLeft - this.borderRight;
        
        window.addEventListener('resize', this.#resize.bind(this), false);
        
        this.createMap();
        this.createModels();

        console.log(this.ctx);
        console.log(this.ctx.canvas);
    }

    #resize(){
        this.ctx.canvas.width = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight - 150;
    }

    createModels(){
        const midWidth = Math.round(this.canvas.width/2);
        const midHeight = Math.round(this.canvas.height/2);

        this.ball = new Ball(this, 150, 100, 25);

        this.ai = new AI(this, 15, midHeight - 50, 25, 100);
        this.vMap.push(this.ai);

        this.pc = new PlayerController(this, this.canvas.width - 40, midHeight, 25, 100);
        this.vMap.push(this.pc);

    }

    createMap(){
        this.vMap.push(new Rectangle(this, 0, 0, this.canvas.width, this.borderTop)); //top border
        this.vMap.push(new Rectangle(this, 0, this.canvas.height - this.borderBottom, this.canvas.width, this.borderBottom)); //bottom border
        
        this.vMap.push(new Rectangle(this, 0, 20, 10, this.canvas.height - 40));
        this.vMap.push(new Rectangle(this, this.canvas.width - 10, 20, 10, this.canvas.height - 40));
        
        //this.vMap.push(new Rectangle(this, 50, 350, 50, 50));
        this.vMap.push(new Rectangle(this, 230, 280, 100, 100));
        this.vMap.push(new Rectangle(this, 300, 50, 70, 70));
        //this.vMap.push(new Rectangle(this, 160, 90, 30, 100));
        this.vMap.push(new Circle(this, 100, 90, 50));
    }

    draw(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.vMap.forEach(obj =>{
            obj.draw();

            if(obj.checkCollision(this.ball)){
                this.ball.updateSpeedVector(obj);
            }
        })

        this.ball.render();
        
        if(this.x <= this.ctx.canvas.width - 150){
            window.requestAnimationFrame(this.draw.bind(this));
        }
    }

    render(){
        window.requestAnimationFrame(this.draw.bind(this));
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

    constructor(dX, dY){
        this.#type = Type.Vector;

        this.dX = Math.round(dX);
        this.dY = Math.round(dY);
        this.#length = this.#calcLength(this.dX, this.dY);
    }

    getLength(){
        return this.#length;
    }

    getType(){
        return this.#type;
    }

    #calcLength(dX, dY){
        const d = Math.sqrt(dX*dX + dY*dY);

        return d === 0? 1: d; //1 -> unit vector
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
    #quadrant;
    //angle is measured in deg (initial direction based on Ox axis)
    //rad - is a radian value that vary between 0 and 2*PI
    constructor(speed, angle){
        this.#type = Type.SpeedVector;

        this.speed = speed;
        this.rad = D2Math.angleToRad(angle);
        this.#dX = Math.round(speed*Math.cos(this.rad));
        this.#dY = Math.round(speed*Math.sin(this.rad));
        this.#xDir = 1;

        console.log(this);
    }

    setdX(dX){
        this.#dX = dX;
        this.#checkQuadrant();
        this.#updateXDir();
    }

    getdX(){
        return this.#dX;
    }

    setdY(dY){
        this.#dY = dY;
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
            this.#quadrant = 1;
        }
        else if(this.#dX < 0 && this.#dY > 0){ //II
            this.rad = 3.1416 - deltaAngle;
            this.#quadrant = 2;
        }
        else if(this.#dX < 0 && this.#dY < 0){ //III
            this.rad = 3.1416 + deltaAngle;
            this.#quadrant = 3;
        }
        else if(this.#dX > 0 && this.#dY < 0){ //IV
            this.rad = 6.26 - deltaAngle;
            this.#quadrant = 4;
        }
    }

    getQuadrant(){
        return this.#quadrant;
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
        this.x1 = Math.round(x);
        this.y1 = Math.round(y);
        this.p1 = new Point(Math.round(this.x1), Math.round(this.y1)); //top-left
    }
}

class Rectangle extends Figure{
    #type;

    constructor(ref, x, y, width, height){
        super(ref, x, y);
        this.#type = Type.Rectangle;

        this.width = Math.round(width);
        this.height = Math.round(height);

        this.p0 = new Point(Math.round(this.p1.x + this.width/2), Math.round(this.p1.y + this.height/2)); //center
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
        const d1x = this.aabb.min.dX - refBall.aabb.max.dX;
        const d1y = this.aabb.min.dY - refBall.aabb.max.dY;
        const d2x = refBall.aabb.min.dX - this.aabb.max.dX;
        const d2y = refBall.aabb.min.dY - this.aabb.max.dY;
        
        if(d1x > 0 || d1y > 0){
            return false;
        }
        if(d2x > 0 || d2y > 0){
            return false;
        }
        
        return true;
    }

    draw(){
        this.ref.ctx.beginPath();
        this.ref.ctx.fillStyle = "orange";
        this.ref.ctx.fillRect(this.p1.x, this.p1.y, this.width, this.height);
        this.ref.ctx.fill();
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
        this.ref.ctx.beginPath();
        this.ref.ctx.fillStyle = "blue";
        this.ref.ctx.arc(this.p1.x, this.p1.y, this.radius, 0, 2*Math.PI);
        this.ref.ctx.fill();
    }

    getType(){
        return this.#type;
    }
}

class Ball {
    _speed = 5;
    #dirVector;
    #previousPosition;

    constructor(ref, x, y, radius){
        this.ref = ref;
        this.radius = Math.round(radius);

        this.x = Math.round(x);
        this.y = Math.round(y);
        this.currentPosition = new Point(x, y);
        this.#previousPosition = this.currentPosition;
        
        const min = new Vector(this.currentPosition.x - this.radius, this.currentPosition.y - this.radius);
        const max = new Vector(this.currentPosition.x + this.radius, this.currentPosition.y + this.radius);
        this.aabb = new AABB(min, max); //set a simple collision edge

        this.#dirVector = new SpeedVector(this._speed, 60);

        console.log(this);
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
        }
    }

    #updateVectorCircleToCircle(impactObject){
        //transparent
        
        const quadrant = this.#dirVector.getQuadrant();
        const dir = this.#dirVector.getXDir();
        //console.log(quadrant, dir);
        
        // if(dir > 0 && quadrant === ){
        //     this.#dirVector.setdX((-1)*this.#dirVector.getdX());
        // }
        // else if(quadrant === 2 && dir > 0){
        //     this.#dirVector.setdY((-1)*this.#dirVector.getdY());
        // }
        // else if(quadrant === 3 && dir > 0){
        //     this.#dirVector.setdX((-1)*this.#dirVector.getdX());
        // }
        // else if(quadrant === 4 && dir < 0){
        //     this.#dirVector.setdY((-1)*this.#dirVector.getdY());
        // }
    }

    #updateVectorCircleToRectangle(impactObject){
        const x = this.#previousPosition.x;
        const y = this.#previousPosition.y;

        const x0 = impactObject.p0.x;
        const y0 = impactObject.p0.y;
        const v0 = new Vector(x - x0, y - y0);

        //Check for a diagonal impact
        const angleDelta = Math.abs(Math.acos(v0.dX / v0.getLength()) - impactObject.angleRatio);
        if((0 <= angleDelta) && (angleDelta <= 0.1)){
            //this.#dirVector.setdX((-1)*this.#dirVector.getdX());
            this.#dirVector.setdY((-1)*this.#dirVector.getdY());
        }

        //Check the impact side for the static figure
        impactObject.sideMap.forEach((value, key, map) => {
            const sideVector = new Vector(value[1].dX - value[0].dX, value[1].dY - value[0].dY)
            const negativeVector = new Vector(-1*value[0].dX, -1*value[0].dY);
            const vd = new Vector(v0.dX - value[0].dX, v0.dY - value[0].dY);

            const v1 = v0.dX*value[0].dY - v0.dY*value[0].dX; //[v0, v01]
            const v2 = v0.dX*value[1].dY - v0.dY*value[1].dX; //[v0, v02]
            const v3 = sideVector.dX*negativeVector.dY - sideVector.dY*negativeVector.dX; //[sideVector, negativeVector]
            const v4 = sideVector.dX*vd.dY - sideVector.dY*vd.dX; //[sideVector, vd]

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
        this.#previousPosition = this.currentPosition;
        
        const deltaX = this.#dirVector.getdX();
        const deltaY = this.#dirVector.getdY();
        
        this.currentPosition.x += deltaX;
        this.currentPosition.y += deltaY;
        
        this.aabb.min.dX = this.currentPosition.x - this.radius;
        this.aabb.min.dY = this.currentPosition.y - this.radius;
        this.aabb.max.dX = this.currentPosition.x + this.radius;
        this.aabb.max.dY = this.currentPosition.y + this.radius;
    }

    render(){
        this.#updatePosition();

        const x0 = this.currentPosition.x;
        const y0 = this.currentPosition.y;

        this.ref.ctx.beginPath();
        this.ref.ctx.lineWidth = 0;
        this.ref.ctx.fillStyle = "green";
        this.ref.ctx.ellipse(x0, y0, this.radius, this.radius, 0, 0, 2*Math.PI);
        this.ref.ctx.fill();

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
        this.ref.ctx.strokeText("Rad = " + Math.round(this.#dirVector.rad*1000)/1000, x1, y1);
    }
}

class AI extends Rectangle{
    #type;
    #maxSpeed = 7;
    #difficultyMode = 1;

    constructor(ref, x, y, width, height){
        super(ref, x, y, width, height);
        this.#type = Type.AI;

        this.currentPosition = new Point(this.p1.x, this.p1.y);
        this.centerHeight = Math.round(height/2);
        this.defaultPosition = new Point(this.currentPosition.x, this.ref.canvas.height/2 - this.centerHeight);
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

    #checkArea(){
        const aiTopY = this.currentPosition.y;
        const aiBottomY = this.currentPosition.y + this.height;
        const interval = Math.round(this.ref.ball.radius/3);

        if((aiTopY - interval < this.ref.borderTop)){
            return false;
        }
        if (aiBottomY + interval> this.ref.areaHeight + this.ref.borderTop){
            return false;
        }

        return true;
    }

    #returnToDefaultPosition(){
        const deltaY = this.defaultPosition.y - this.currentPosition.y;

        if(Math.abs(deltaY) <= 1){
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

        if(Math.abs(deltaY) <= 1){
            return;
        }

        this.speedY = Math.round(Math.log(Math.abs(deltaY)) - randomizeSpeed);
        this.speedY = (this.speedY > this.#maxSpeed)? this.#maxSpeed: this.speedY;

        if(deltaY > 1) {
            this.currentPosition.y += this.speedY;
        } else {
            this.currentPosition.y -= this.speedY;
        }

        if(!this.#checkArea()) this.currentPosition = oldPos;
    }

    update(){
        this.p0 = new Point(Math.round(this.currentPosition.x + this.width/2), Math.round(this.currentPosition.y + this.height/2));
        this.p1 = new Point(this.currentPosition.x, this.currentPosition.y);
        this.p2 = new Point(this.currentPosition.x + this.width, this.currentPosition.y);
        this.p3 = new Point(this.currentPosition.x + this.width, this.currentPosition.y + this.height);
        this.p4 = new Point(this.currentPosition.x, this.currentPosition.x + this.height);
        this.aabb = new AABB(new Vector(this.p1.x, this.p1.y), new Vector(this.p3.x, this.p3.y));
    }

    draw(){
        this.update();
        this.trackBall();

        this.ref.ctx.beginPath();
        this.ref.ctx.fillStyle = "red";
        this.ref.ctx.fillRect(this.currentPosition.x, this.currentPosition.y, this.width, this.height);
    }

    getType(){
        return this.#type;
    }
}

class PlayerController extends Rectangle{
    #type;

    constructor(ref, x, y, width, height){
        super(ref, x, y, width, height);
        this.#type = Type.PC;
    }

    draw(){
        this.ref.ctx.beginPath();
        this.ref.ctx.fillStyle = "red";
        this.ref.ctx.fillRect(this.p1.x, this.p1.y, this.width, this.height);
    }

    setXY(x, y){
        this.x1 = x;
        this.y1 = y;
        this.x2 = this.x1 + this.width;
        this.y2 = this.y1 + this.height;
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

const board = new Board("board");
board.render();

// for (let angle = 0; angle < 1000; angle += 90) {

//     const rad = SpeedVector.angleToRad(angle);

//     console.log(angle, rad);
// }

//console.log(board);

//console.log(ctx);