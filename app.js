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

        this.x = 1;
        this.#resize();
        
        window.addEventListener('resize', this.#resize.bind(this), false);
        
        this.createModels();
        this.createMap();

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

        this.ai = new AI(this, 15, midHeight, 25, 100);
        this.vMap.push(this.ai);

        this.pc = new PlayerController(this, this.canvas.width - 40, midHeight, 25, 100);
        this.vMap.push(this.pc);

        this.ball = new Ball(this, {radius: 30});
    }

    createMap(){
        this.vMap.push(new Rectangle(this, 0, 0, this.canvas.width, 20));
        this.vMap.push(new Rectangle(this, 0, this.canvas.height - 20, this.canvas.width, 20));
        this.vMap.push(new Rectangle(this, 0, 20, 10, this.canvas.height - 40));
        this.vMap.push(new Rectangle(this, this.canvas.width - 10, 20, 10, this.canvas.height - 40));
        
        this.vMap.push(new Rectangle(this, 50, 300, 50, 50));
        this.vMap.push(new Rectangle(this, 200, 250, 100, 100));
        this.vMap.push(new Rectangle(this, 300, 50, 70, 70));
    }

    draw(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.vMap.forEach(obj =>{
            obj.draw();

            if(obj.checkCollision(this.ball)){
                this.ball.updateDirection(obj);
            }
        })

        //this.ai.render();
        //this.pc.render();
        this.ball.render();
        
        if(this.x <= this.ctx.canvas.width - 150){
            window.requestAnimationFrame(this.draw.bind(this));
        }
    }

    render(){


        window.requestAnimationFrame(this.draw.bind(this));
    }
}

class Point{
    x;
    y;

    constructor(x, y){
        this.x = Math.round(x);
        this.y = Math.round(y);
    }
}

class Vector{
    dX;
    dY;
    #length;

    constructor(dX, dY){
        this.dX = dX;
        this.dY = dY;
        this.#length = this.#calcLength(dX, dY);
    }

    getLength(){
        return this.#length;
    }

    #calcLength(dX, dY){
        return Math.sqrt(dX*dX + dY*dY);
    }

    static angleToRad(angle){
        return 2*Math.PI*angle/360;
    }

    static radToAngle(rad){
        return rad*360/2*Math.PI;
    }
}

class SpeedVector{
    #dX;
    #dY;
    #xDir;
    //angle is measured in deg
    //rad - is a radian value that vary between 0 and 2*PI
    constructor(speed, angle){
        this.speed = speed;
        this.rad = Vector.angleToRad(angle);
        this.#dX = Math.round(speed*Math.cos(this.rad));
        this.#dY = Math.round(speed*Math.sin(this.rad));
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
}

class Ball{
    _speed = 2;
    #dirVector;

    constructor(ref, size){
        this.ref = ref;
        this.radius = size.radius;
        this.currentPosition = new Point(ref.ai.x1 + ref.ai.width + size.radius + 5, ref.ai.y1);
        
        this.#dirVector = new SpeedVector(this._speed, 30);
    }

    getVector(){
        return this.#dirVector;
    }

    updateDirection(impactObject){
        const x = this.currentPosition.x;
        const y = this.currentPosition.y;
        const x1 = impactObject.x1;
        const y1 = impactObject.y1;
        const x2 = impactObject.x2;
        const y2 = impactObject.y2;

        if((x1 < x + this.radius) && (x1 > x) && (y1 < y + this.radius) && (y1 > y)){
            const dx = x1 - x;
            const dy = y1 - y;

            this.#updateDirectionCorners(dx, dy);
            console.log('Q1');
            return;
        }
        if((x2 > x - this.radius) && (x2 < x) && (y1 < y + this.radius) && (y1 > y)){
            const dx = x2 - x;
            const dy = y1 - y;

            this.#updateDirectionCorners(dx, dy);
            console.log('Q2');
            return;

        }
        else if((x1 < x + this.radius) && (x1 > x) && (y2 > y - this.radius) && (y2 < y)){
            const dx = x1 - x;
            const dy = y2 - y;

            this.#updateDirectionCorners(dx, dy);
            console.log('Q3');
            return;

        }
        else if((x2 > x - this.radius) && (x2 < x) && (y2 > y - this.radius) && ( y2 < y)){
            const dx = impactObject.x2 - x;
            const dy = impactObject.y2 - y;

            this.#updateDirectionCorners(dx, dy);
            console.log('Q4');
            return;

        }

        if((impactObject.y1 < y + this.radius/3) && (y - this.radius/3 < impactObject.y2) && ((impactObject.x1 <= y + this.radius) || (impactObject.x2 >= y - this.radius))){
            this.#dirVector.setdX((-1)*this.#dirVector.getdX());
        }
        
        if((impactObject.x1 < x + this.radius/3) && (x - this.radius/3 < impactObject.x2) && ((impactObject.y1 <= y + this.radius) || (impactObject.y2 >= y - this.radius))){
            this.#dirVector.setdY((-1)*this.#dirVector.getdY());
        }
    }

    #updateDirectionCorners(dx, dy){
        const d = Math.sqrt(dx*dx + dy*dy);

        if(d <= this.radius){
            const angle = Math.acos(Math.abs(dx)/d);
            //console.log(angle);

            if(angle < 0.785){
                this.#dirVector.setdX((-1)*this.#dirVector.getdX());
            }
            else{
                this.#dirVector.setdY((-1)*this.#dirVector.getdY());
            }
        }
    }

    #updateCanvasCollision(){
        const deltaX = this.#dirVector.getdX();
        const deltaY = this.#dirVector.getdY();

        this.currentPosition.x += deltaX;
        this.currentPosition.y += deltaY;

        if(this.currentPosition.x < this.radius || this.currentPosition.x > this.ref.canvas.width - this.radius){
            this.#dirVector.setdX((-1)*deltaX);
        }

        if(this.currentPosition.y < this.radius || this.currentPosition.y > this.ref.canvas.height - this.radius){
            this.#dirVector.setdY((-1)*deltaY);
        }
    }

    render(){
        const deltaX = this.#dirVector.getdX();
        const deltaY = this.#dirVector.getdY();

        this.currentPosition.x += deltaX;
        this.currentPosition.y += deltaY;

        //this.#updateCanvasCollision();

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

        this.ref.ctx.beginPath();
        this.ref.ctx.lineWidth = 0;
        this.ref.ctx.fillStyle = "green";
        this.ref.ctx.ellipse(x0, y0, this.radius, this.radius, 0, 0, 2*Math.PI);
        this.ref.ctx.fill();
    }
}


class Figure{
    constructor(ref, x, y, path){
        this.ref = ref;
        this.x = x;
        this.y = y;
    }
}

class Rectangle extends Figure{
    constructor(ref, x, y, width, height){
        super(ref, x, y);

        this.x1 = Math.round(x);
        this.y1 = Math.round(y);
        this.width = Math.round(width);
        this.height = Math.round(height);
        this.x2 = this.x1 + this.width;
        this.y2 = this.y1 + this.height;
        this.area = this.width*this.height;     
    }
    
    draw(){
        this.ref.ctx.beginPath();
        this.ref.ctx.fillStyle = "orange";
        this.ref.ctx.fillRect(this.x1, this.y1, this.width, this.height);
        this.ref.ctx.fill();
    }

    checkCollision(refBall){
        const x0 = refBall.currentPosition.x;
        const y0 = refBall.currentPosition.y;
        const radius = refBall.radius;

        if((this.x1 <= x0 + radius && this.x2 >= x0 - radius) && (this.y1 <= y0 + radius && this.y2 >= y0 - radius)){
            return true;
        }

        return false;
    }
}

class Circle extends Figure{
    constructor(ref, x, y, radius){
        super(ref, x, y);

        this.x = x;
        this.y = y;
        this.radius = radius;
        this.area = Math.PI*this.radius*this.radius;
    }
}

class AI extends Rectangle{
    #speed;

    constructor(ref, x, y, width, height){
        super(ref, x, y, width, height);

        this.width = Math.round(width);
        this.height = Math.round(height);
        this.x1 = Math.round(x);
        this.y1 = Math.round(y - this.height/2);
        this.x2 = this.x1 + this.width;
        this.y2 = this.y1 + this.height;
        this.area = this.width*this.height;     
    }

    draw(){
        this.ref.ctx.beginPath();
        this.ref.ctx.fillStyle = "red";
        this.ref.ctx.fillRect(this.x1, this.y1, this.width, this.height);
    }
}

class PlayerController extends Rectangle{
    #x2;
    #y2;

    constructor(ref, x, y, width, height){
        super(ref, x, y, width, height);

        this.width = Math.round(width);
        this.height = Math.round(height);
        this.x1 = Math.round(x);
        this.y1 = Math.round(y - this.height/2);
        this.x2 = this.x1 + this.width;
        this.y2 = this.y1 + this.height;
        this.area = this.width*this.height;     
    }

    draw(){
        this.ref.ctx.beginPath();
        this.ref.ctx.fillStyle = "red";
        this.ref.ctx.fillRect(this.x1, this.y1, this.width, this.height);
    }

    setXY(x, y){
        this.x1 = x;
        this.y1 = y;
        this.x2 = this.x1 + this.width;
        this.y2 = this.y1 + this.height;
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