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

    constructor(board){
        this.canvas = document.getElementById(board);
        this.ctx = this.canvas.getContext('2d');

        this.x = 1;
        this.#resize();
        
        window.addEventListener('resize', this.#resize.bind(this), false);
        
        this.ai = new AI(this, {width: 25, height: 100});
        this.pc = new PlayerController(this, {width: 25, height: 100});
        this.ball = new Ball(this, {radius: 15});

        console.log(this.ctx);
        console.log(this.ctx.canvas);
    }

    #resize(){
        this.ctx.canvas.width = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight - 150;
    }

    draw(){
        //this.x += 1;

        this.ai.render();
        this.pc.render();
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
        this.x = x;
        this.y = y;
    }
}

class Vector{
    dX;
    dY;
    length;

    constructor(dX, dY){
        this.dX = dX;
        this.dY = dY;
        this.length = Math.sqrt(dX*dX + dY*dY);
    }

    calcLength(){
        this.length = Math.sqrt(dX*dX + dY*dY);
    }
}

class SpeedVector{
    #dX;
    #dY;
    #xDir;
    //angle - is a radian value that vary between 0 and 2*PI
    constructor(speed, angle){
        this.speed = speed;
        this.rad = SpeedVector.angleToRad(angle);
        this.#dX = speed*Math.cos(this.rad);
        this.#dY = speed*Math.sin(this.rad);
    }

    setdX(dX){
        this.#dX = dX;
        this.rad = Math.acos(this.#dX/this.speed);

        this.updateXDir();
    }

    getdX(){
        return this.#dX;
    }

    setdY(dY){
        this.#dY = dY;
        this.rad = Math.asin(this.#dY/this.speed);

        this.updateXDir();
    }

    getdY(){
        return this.#dY;
    }

    updateXDir(){
        if((this.rad >= 0 && this.rad < 1.57) || (this.rad > 4.71 && this.rad <= 6.26)){
            this.#xDir = 1;
        }
        if(this.rad >= 1.57 && this.rad < 4.71){
            this.#xDir = -1;
        }

        console.log(this.#xDir);
    }

    getXDir(){
        return this.#xDir;
    }

    static angleToRad(angle){
        return 2*Math.PI*angle/360;
    }

    static radToAngle(rad){
        return rad*360/2*Math.PI;
    }
}

class Ball{
    currentPosition;
    newPositioin;
    _speed = 4;
    #dirVector;

    constructor(ref, size){
        this.ref = ref;
        this.radius = size.radius;
        this.currentPosition = new Point(ref.ai.x + ref.ai.size.width + size.radius + 5, ref.ai.y);
        
        this.#dirVector = new SpeedVector(this._speed, 30);
    }

    getVector(){
        //return a tuple
    }

    updatePosition(){
        const deltaX = this.#dirVector.getdX();
        const deltaY = this.#dirVector.getdY();

        this.currentPosition.x += deltaX;
        this.currentPosition.y += deltaY;

        if(this.currentPosition.x < this.radius || this.currentPosition.x > this.ref.canvas.width - this.radius){
            this.#dirVector.setdX(-1*deltaX);
        }

        if(this.currentPosition.y < this.radius || this.currentPosition.y > this.ref.canvas.height - this.radius){
            this.#dirVector.setdY(-1*deltaY);
        }
    }

    render(){
        this.updatePosition();

        this.ref.ctx.beginPath();
        this.ref.ctx.lineWidth = 0;
        this.ref.ctx.fillStyle = "green";
        this.ref.ctx.ellipse(this.currentPosition.x, this.currentPosition.y, this.radius, this.radius, 0, 0, 2*Math.PI);
        this.ref.ctx.fill();
    }
}

class AI{
    #speed;
    ref;

    constructor(ref, size){
        this.ref = ref;
        this.size = size;
        this.x = 10;
        this.y = ref.canvas.height/2 - size.height/2;
    }

    render(){
        this.ref.ctx.fillStyle = "red";
        this.ref.ctx.fillRect(this.x, this.y, this.size.width, this.size.height);
    }
}

class PlayerController{
    constructor(ref, size){
        this.ref = ref;
        this.size = size;
        this.x = ref.canvas.width - size.width - 10;
        this.y = ref.canvas.height/2 - size.height/2;
    }

    render(){
        this.ref.ctx.fillStyle = "red";
        this.ref.ctx.fillRect(this.x, this.y, this.size.width, this.size.height);
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