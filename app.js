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
    #_score = {ai: 0, player: 0};
    #_maxScore = 11;
    #_gameLevel = 1;
    #_isIdling = true;
    #_aiTurn = false;

    constructor(){
        this.ready = false;

        //init game objects
        this.board = null;
        this.menu = new GameMenu();
        this.sets = new Map();

        //in game and menu event handlers
        window.addEventListener('resize', this.#resize.bind(this), false);
        document.addEventListener('keydown', this.#gameKey.bind(this), false);

        this.menu.newGameBt.addEventListener('click', this.newGame.bind(this), false);
        this.menu.resumeGameBt.addEventListener('click', this.resumeGame.bind(this), false);
        this.menu.nextGameBt.addEventListener('click', this.nextGame.bind(this), false);
        this.menu.confBt.addEventListener('click', this.confGame.bind(this), false);
        this.menu.quitBt.addEventListener('click', this.quitGame.bind(this), false);
        this.menu.menuIconElem.addEventListener('click', this.menuIconHandler.bind(this), false);

        //update game status
        this.#updateScoreUI();
        this.#loadTextures();
        this.#loadSounds();
    }

    #loadTextures(){
        this.paddleTexture = new Image();
        this.paddleTexture.src = "./images/ping-pong-paddle-texture-2.jpg";

        this.brickWall = new Image();
        this.brickWall.src = "./images/brick-wall.jpg";

        const imgs = [this.paddleTexture, this.brickWall];
        const len = imgs.length;
        let counter = 0;

        [].forEach.call(imgs, (img) => {
            if(img.complete){
                counter++;
                this.#updateTextureCounter(counter, len);
            }else{
                img.addEventListener('load', () => {
                    counter++;
                    this.#updateTextureCounter(counter, len);
                }, false);
            }
        })
    }

    #updateTextureCounter(counter, len){
        this.menu.updateProgressPane(counter/len*100);

        if(counter === len){
            setTimeout(() => {
                this.ready = true;
                this.menu.newGame();
            }, 100);
        }
    }

    #loadSounds(){
        this.paddleImpact = new Audio('./sounds/paddle-hit.mp3');
        this.wallImpact = new Audio('./sounds/wall-hit.mp3');
    }

    #gameKey(e){
        switch(e.key){
            case 'Escape':
                if(this.menu.isPaused){
                    this.resumeGame();
                }else{
                    this.menu.pauseGame();
                }
            break;
            case 'Enter':
                this.startGame();
            break;
        }

        if(e.keyCode === 32) this.startGame();
    }

    #getRandomAITurn(){
        return (Math.random() >= 0.5)? true: false;
    }

    newGame(){
        this.#_gameLevel = 1;
        this.#_aiTurn = this.#getRandomAITurn();

        this.menu.startGame();
        this.#resetSets();
        this.#resetScore()
        this.#updateScoreUI();
       
        this.board = new Board(this.#_canvasId, this.#_gameLevel);
        this.board.render();

        if(this.isAiTurn()){
            setTimeout(() => {
                this.startGame();
            }, 1500);
        }
    }

    startGame(){
        this.#_isIdling = false;
        this.#removeTitleMessage();
    }

    menuIconHandler(e){
        if(this.#_isIdling && this.#_gameLevel === 1){
            return;
        }

        if(this.menu.isDefaultMenuIcon){
            this.menu.pauseGame();
        }else{
            this.resumeGame();
        }
    }

    resumeGame(){
        this.menu.resumeGame();
        this.board.render();
    }

    nextGame(){
        this.#_gameLevel++;

        this.menu.nextGame();
        this.#resetScore()
        this.#updateScoreUI();

        this.board = new Board(this.#_canvasId, this.#_gameLevel);
        this.board.render();
    }

    confGame(){
        console.log('config game');
    }

    quitGame(){
        this.menu.quitGame();
    }

    #resize(){
        if(!this.menu.isPaused) this.menu.pauseGame();

        this.board = null;
        clearTimeout(this.#resizingId);
        
        this.#resizingId = setTimeout(() => {
            this.board = new Board(this.#_canvasId, this.#_gameLevel);
            this.board.render();
        }, 100);
    }

    incAIScore(){
        this.#_score.ai++;
        this.#updateScoreUI();
    }

    getIdling(){
        return this.#_isIdling;
    }

    aiTurn(){
        if(this.board === null) return;

        this.#_isIdling = true;
        this.#_aiTurn = true;

        const ballObj = this.board.ball;
        const aiObj = this.board.ai;

        ballObj.currentPosition.x = aiObj.currentPosition.x + aiObj.width + ballObj.radius;
        ballObj.currentPosition.y = aiObj.currentPosition.y + aiObj.centerHeight;

        this.board.ball.setLTRDir();
        this.board.ball.updatePosition(true);

        setTimeout(() => {
            this.startGame();
        }, 1500);

        this.#setTitleMessage('Press ENTER to start the game');
    }

    isAiTurn(){
        return this.#_aiTurn;
    }

    incPlayerScore(){
        this.#_score.player++;
        this.#updateScoreUI();
    }

    playerTurn(){
        if(this.board === null) return;

        this.#_isIdling = true;
        this.#_aiTurn = false;

        this.board.ball.currentPosition.x = this.board.pc.currentPosition.x - this.board.ball.radius;
        this.board.ball.currentPosition.y = this.board.pc.currentPosition.y + this.board.pc.centerHeight;

        this.board.ball.setRTLDir();
        this.board.ball.updatePosition(true);
        this.#setTitleMessage('Press ENTER to start the game');
    }

    isRoundOver(){
        if((this.#_score.ai >= this.#_maxScore) || (this.#_score.player >= this.#_maxScore) || (Math.abs(this.#_score.ai - this.#_score.player) > 5)){
            return true;
        }
        
        return false;
    }

    updateRound(){
        if(this.#_score.ai > this.#_score.player){
            this.sets.set(this.#_gameLevel, {'ai': 1, 'player': 0});
        }else{
            this.sets.set(this.#_gameLevel, {'ai': 0, 'player': 1});
        }
        
        this.sets.forEach((value, key, map) => {
            if(value.ai === 1){
                const pcSetId = document.querySelector('#pc-r-' + key);
                pcSetId.classList.add('set-won');
            }else{
                const playerSetId = document.querySelector('#pl-r-' + key);
                playerSetId.classList.add('set-won');
            }
        });   

        let pcWinSets = 0;
        let playerWinSets = 0;

        this.sets.forEach((value, key, map) => {
            if(value.ai === 1){
                pcWinSets++;
            }else{
                playerWinSets++;
            }
        });

        if(pcWinSets >= 3){
            this.menu.announceWinner('PC');
            return;
        }

        if(playerWinSets >= 3){
            this.menu.announceWinner('Player');
            return;
        }
        
        this.menu.setOver();
    }

    #setTitleMessage(msg){
        const titleElem = document.querySelector('#title');
        titleElem.innerText = msg;
        titleElem.classList.add('pulse');
    }

    #removeTitleMessage(){
        const titleElem = document.querySelector('#title');
        titleElem.innerText = 'PING PONG';
        titleElem.classList.remove('pulse');
    }

    #updateScoreUI(){
        const scoreElem = document.querySelector('#score');
        scoreElem.innerText = this.#_score.ai + ':' + this.#_score.player;
    }

    #resetScore(){
        this.#_score.ai = 0;
        this.#_score.player = 0;
    }

    #resetSets(){
        const setElems = document.querySelectorAll('.round');

        //reset UI
        setElems.forEach(elem => {
            elem.classList.remove('set-won');
        });

        //reset data model
        this.sets.clear();
    }
}

class GameMenu{
    #menuButtons = [];
    
    constructor(){
        this.menuIconElem = document.querySelector('#game-menu');

        this.menuElem = document.querySelector('#menu');
        this.title = document.querySelector('#menu-title');
        this.newGameBt = document.querySelector('#new-game');
        this.resumeGameBt = document.querySelector('#resume-game');
        this.nextGameBt = document.querySelector('#next-game');
        this.confBt = document.querySelector('#conf');
        this.quitBt = document.querySelector('#quit');
        
        this.isPaused = false;
        this.isDefaultMenuIcon = false;
        
        this.#menuButtons = [this.newGameBt, this.resumeGameBt, this.nextGameBt, this.confBt, this.quitBt];
        this.#disableButtons([this.resumeGameBt, this.nextGameBt, this.confBt, this.quitBt]);

        //this.infoElem = document.querySelector('#info');
        this.loadingGame();
    }

    loadingGame(){
        this.#showInfoPane('Loading', true);
        setTimeout(() => {
            this.updateProgressPane(50);
        }, 1000);
    }

    newGame(){
        this.isPaused = false;
        this.#disableButtons([this.resumeGameBt, this.nextGameBt, this.confBt, this.quitBt]);
        this.#showMenu();
    }

    startGame(){
        this.isPaused = false;
        this.#hideMenu();
    }

    pauseGame(){
        this.isPaused = true;
        
        this.title.innerText = "Paused";
        this.#disableButtons([this.newGameBt, this.nextGameBt, this.confBt]);
        this.#showMenu();
    }

    resumeGame(){
        this.isPaused = false;
        
        this.title.innerText = "Ping Pong";
        this.#hideMenu();
    }

    setOver(){
        this.isPaused = true;
        
        this.title.innerText = "Continue?";
        this.#disableButtons([this.newGameBt, this.resumeGameBt, this.confBt]);
        this.#showMenu();
    }

    nextGame(){
        this.isPaused = false;
        
        this.title.innerText = "Ping Pong";
        this.#hideMenu();
    }

    announceWinner(winner){
        this.isPaused = true;
        
        this.title.innerText = winner + " won!";
        this.#disableButtons([this.resumeGameBt, this.nextGameBt, this.confBt, this.quitBt]);
        this.#showMenu();
    }

    quitGame(){
        this.title.innerText = "Ping Pong";
        this.#disableButtons([this.resumeGameBt, this.nextGameBt, this.confBt, this.quitBt]);
    }

    #disableButtons(buttons){
        this.#menuButtons.forEach(button => {
            button.disabled = false;
        });

        buttons.forEach(button => {
            button.disabled = true;
        });
    }

    #setDefaultMenuIcon(){
        this.menuIconElem.classList.remove('icon-close');
        this.menuIconElem.classList.add('icon-menu');

        this.isDefaultMenuIcon = true;
    }

    #setCloseMenuIcon(){
        this.menuIconElem.classList.remove('icon-menu');
        this.menuIconElem.classList.add('icon-close');

        this.isDefaultMenuIcon = false;
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
        this.#setDefaultMenuIcon();
    }

    #showMenu(){
        this.#hideInfoPane();

        document.documentElement.style.setProperty('--menu-display', "block");
        this.#setCloseMenuIcon();
    }

    #hideInfoPane(){
        document.documentElement.style.setProperty('--info-display', "none");
    }

    #showInfoPane(msg, loading = false){
        this.#hideMenu();

        const msgElem = document.querySelector('#msg');
        msgElem.innerText = msg;

        if(loading){
            document.documentElement.style.setProperty('--progress-display', "block");
        }else{
            document.documentElement.style.setProperty('--progress-display', "none");
        }

        document.documentElement.style.setProperty('--info-display', "block");
    }

    updateProgressPane(value){
        const progressElem = document.querySelector('#msg-prog');
        progressElem.value = value;
    }

}

class Board{
    vMap = [];
    #frameId;

    constructor(board, level){
        this.canvas = document.getElementById(board);
        this.ctx = this.canvas.getContext('2d');

        this.#init(board);

        this.level = Number.parseInt(level);
        this.borderTop = 5;
        this.borderBottom = this.borderTop;
        this.borderLeft = 5;
        this.borderRight = this.borderLeft;
        this.areaHeight = this.canvas.height - this.borderTop - this.borderBottom;
        this.areaWidth = this.canvas.width - this.borderLeft - this.borderRight;
        this.topMidPosition = new Point(Math.round(this.canvas.width/2), 0);

        this.createMap();
        this.createModels();

        // let requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        // let  cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
    }

    #init(board){
        //resize the board, considering a tennis table aspect ratio
        const canvasContainer = document.querySelector(`#${board}-container`);
        const canvasBoundingRect = canvasContainer.getBoundingClientRect();
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight - canvasBoundingRect.top;

        const ratio = 1.82;
        let width = 400; 
        let height = Math.round(width/ratio);

        while((width < canvasWidth) && (height < canvasHeight)){
            width++;
            height = Math.round(width/ratio);
        }

        //resize the canvas element size 
        this.ctx.canvas.style.width = width +'px';
        this.ctx.canvas.style.height = height + 'px';
        //resize the canvas resolution symmetrically
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
    }

    createModels(){
        //init props
        const midWidth = Math.round(this.canvas.width/2);
        const midHeight = Math.round(this.canvas.height/2);
        const paddleWidth = 20;
        const paddleHeight = Math.max(50, Math.min(100, Math.round(0.2*this.canvas.height)));
        const aiX = 2*this.borderLeft;
        const aiY = midHeight;
        const pcX = this.canvas.width - 2*this.borderRight - paddleWidth;
        const pcY = midHeight;

        const ballRadius = Math.max(10, Math.min(15, Math.round(0.01*this.canvas.width)));
        let ballX, ballY;
        //first turn position
        //'game' object is always defined as constructor for this board object
        if(game.isAiTurn()){
            ballX = aiX + paddleWidth + 2*ballRadius;
            ballY = aiY + Math.round(paddleHeight/2);
        }else{
            ballX = pcX - 2*ballRadius;
            ballY = pcY + Math.round(paddleHeight/2);
        }
        
        //create materials for dynamic objects
        const ballMaterial = new Material('solid', '#fff', 'object', true, null, null);
        const aiMaterial = new Material('solid', '#B8000A', 'object', true, game.paddleTexture, game.paddleImpact);
        const playerContMaterial = new Material('solid', '#B8000A', 'object', true, game.paddleTexture, game.paddleImpact);

        //create and add to vMap the ai paddle
        this.ai = new AI(this, aiX, aiY, paddleWidth, paddleHeight, aiMaterial);
        this.vMap.push(this.ai);
        
        //create and add to vMap the player paddle controller
        this.pc = new PlayerController(this, pcX, pcY, paddleWidth, paddleHeight, playerContMaterial);
        this.vMap.push(this.pc);
        
        //create tennis ball
        this.ball = new Ball(this, ballX, ballY, ballRadius, ballMaterial);
    }

    createMap(){
        //create materials for static objects
        const borderMaterial = new Material('solid', '#fff', 'object', false, null, game.wallImpact);
        const pcGateMaterial = new Material('transparent', '#fff', 'pc-gate', false, null, null);
        const playerGateMaterial = new Material('transparent', '#fff', 'player-gate', false, null, null);
        const bgMaterial = new Material('transparent', '#fff', 'object', false, null, null);
        
        //create and add to vMap objects
        this.vMap.push(new Rectangle(this, 0, 0, this.canvas.width, this.borderTop, borderMaterial)); //top border
        this.vMap.push(new Rectangle(this, 0, this.canvas.height - this.borderBottom, this.canvas.width, this.borderBottom, borderMaterial)); //bottom border
        this.vMap.push(new Rectangle(this, this.topMidPosition.x, this.topMidPosition.y, 2, this.canvas.height, bgMaterial)); //mid line

        this.vMap.push(new Rectangle(this, 0, this.borderTop, this.borderLeft, this.areaHeight, pcGateMaterial)); //pc gate
        this.vMap.push(new Rectangle(this, this.areaWidth + this.borderRight, this.borderTop, this.borderRight, this.areaHeight, playerGateMaterial)); //player gate

        //add obstacles to the scene
        this.#createObstacles();
    }

    #createObstacles(){
        const minX = this.areaWidth/3;
        const maxX = this.areaWidth - minX;
        const minY = this.areaHeight/5;
        const maxY = this.areaHeight - minY;
        const obstacleMaterial = new Material('solid', '#FFD4BC', 'object', true,  game.brickWall, game.wallImpact);
        
        for (let i = 0; i < this.level - 1; i++) {
            const randomX = Math.round(Math.random()*(maxX - minX) + minX);
            const randomY = (i+1)*minY; //Math.round(Math.random()*(maxY - minY) + minY);
            const randomWidth = Math.round(Math.random()*(this.areaWidth/10 - 25)) + 25;
            const randomHeight = Math.round(Math.random()*(this.areaHeight/10 - 25)) + 25;
            
            this.vMap.push(new Rectangle(this, randomX, randomY, randomWidth, randomHeight, obstacleMaterial));
        }
    }
    
    render(){
        if(game.menu.isPaused){
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.vMap.forEach(obj =>{
            obj.draw();
            
            if(obj.checkCollision(this.ball)){
                if(obj.material.sound !== null) obj.playSound(obj.material.sound);
                this.ball.updateSpeedVector(obj);

                if(game.isRoundOver()){
                    game.updateRound();
                }
            }
        });
        
        this.ball.draw();

        this.#frameId = window.requestAnimationFrame(this.render.bind(this));
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

    scale(val){
        this.#dX *= val;
        this.#dY *= val;
        this.#calcLength();

        return this;
    }

    setOpposite(){
        this.#dX *= -1;
        this.#dY *= -1;

        return this;
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

        this.#updateXDir();
        //this.#xDir = 1;
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

    setAngleDeviation(){
        if(this.#xDir === 1){
            this.rad = D2Math.angleToRad(D2Math.getLTRAngle());
        }else{
            this.rad = D2Math.angleToRad(D2Math.getRTLAngle());
        }

        this.#dX = Math.round(this.speed*Math.cos(this.rad));
        this.#dY = Math.round(this.speed*Math.sin(this.rad));
    }

    incSpeed(){
        this.speed += 0.01;
        this.#dX = Math.round(this.speed*Math.cos(this.rad));
        this.#dY = Math.round(this.speed*Math.sin(this.rad));
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

class Material{
    constructor(density, color, type, shadow = true, texture, sound){
        this.density = density; //[solid, liquid, gas, transparent]
        this.color = color; //rgb
        this.type = type; //[object, pc-gate, player-gate, booster]
        this.shadow = shadow; //[true, false]
        this.texture = texture; // -> new Image()
        this.sound = sound //impact sound src
    }
}

class Figure{
    constructor(ref, x, y){
        this.ref = ref;

        this.p1 = new Point(Math.round(x), Math.round(y)); //top-left
        this.currentPosition = this.p1;
    }

    playSound(actx){
        actx.play();
    }
}

class Rectangle extends Figure{
    #type;

    constructor(ref, x, y, width, height, material){
        super(ref, x, y);
        this.#type = Type.Rectangle;

        this.width = (width === 0)? 1: Math.round(width);
        this.height = (height === 0)? 1: Math.round(height);
        this.material = material;

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
        
        ctx.save();
        if(this.material.shadow) this.drawShadow(ctx);
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.material.color;
        ctx.strokeRect(this.p1.x, this.p1.y, this.width, this.height);
        ctx.restore();
        
        if(this.material.texture === null){
            ctx.beginPath();
            ctx.fillStyle = this.material.color;
            ctx.lineWidth = 0;
            ctx.strokeStyle = this.material.color;
            ctx.fillRect(this.p1.x, this.p1.y, this.width, this.height);
            ctx.closePath();
        }else{
            ctx.lineWidth = 0;
            const textureSizeX = 38;
            const textureSizeY = 25;
            const nx = Math.ceil(this.width/textureSizeX);
            const ny = Math.ceil(this.height/textureSizeY);
            
            ctx.save();
            ctx.beginPath()
            ctx.rect(this.p1.x, this.p1.y, this.width, this.height);
            ctx.clip();

            ctx.beginPath();
            for (let x = 0; x < nx; x++) {
                for (let y = 0; y < ny; y++) {
                    const deltaX = x*textureSizeX;
                    const deltaY = y*textureSizeY;
                    
                    ctx.drawImage(this.material.texture, 0, 0, textureSizeX, textureSizeY, this.p1.x + deltaX, this.p1.y + deltaY, textureSizeX, textureSizeY);
                }
            }

            ctx.restore();
        }
        
    }

    drawShadow(ctx){
        const lightdX = this.ref.topMidPosition.x - this.currentPosition.x;
        const lightdY = this.ref.topMidPosition.y - this.currentPosition.y;
        const lightDirection = new Vector(lightdX, lightdY);
        const shadowDirection = lightDirection.setOpposite();

        const deltaShadowX = Math.round(Math.log(shadowDirection.getdX())/4) + 1;
        const deltaShadowY = Math.round(Math.log(shadowDirection.getdY())/3) + 2;

        ctx.shadowColor = 'black';
        ctx.shadowBlur = 7;
        ctx.shadowOffsetX = deltaShadowX;
        ctx.shadowOffsetY = deltaShadowY;
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

    constructor(ref, x, y, radius, material){
        this.ref = ref;
        this.radius = Math.round(radius);
        this.material = material;

        this.currentPosition = new Point(Math.round(x), Math.round(y));
        this.#previousPosition = new Point(Math.round(x), Math.round(y));
        
        const min = new Vector(this.currentPosition.x - this.radius, this.currentPosition.y - this.radius);
        const max = new Vector(this.currentPosition.x + this.radius, this.currentPosition.y + this.radius);
        this.aabb = new AABB(min, max); //set a simple collision edge

        this._speed = this._speed + 0.005*this.ref.canvas.width;
        let angle;
        if(game.isAiTurn()){
            angle = D2Math.getLTRAngle();
        }else{
            angle = D2Math.getRTLAngle();
        }
        this.#dirVector = new SpeedVector(this._speed, angle);
    }

    getVector(){
        return this.#dirVector;
    }

    setLTRDir(){
        this.#dirVector = new SpeedVector(this._speed, 36);
    }

    setRTLDir(){
        this.#dirVector = new SpeedVector(this._speed, 200);
    }

    updateSpeedVector(impactObject){
        if(game.getIdling()) return;

        if(impactObject.material.density === 'transparent'){
            if(impactObject.material.type === 'pc-gate'){
                game.incPlayerScore();
                game.aiTurn();
                return;
            }
            if(impactObject.material.type === 'player-gate'){
                game.incAIScore();
                game.playerTurn();
                return;
            }
    
            return;
        }

        switch(impactObject.getType()){
            case Type.Circle:
                this.#updateVectorCircleToCircle(impactObject);
                break;
            case Type.Rectangle:
                this.#updateVectorCircleToRectangle(impactObject);
                break;
            case Type.AI:
                this.#updateVectorCircleToRectangle(impactObject);
                this.#dirVector.setAngleDeviation();
                this.#dirVector.incSpeed();
                break;
            case Type.PC:
                this.#updateVectorCircleToRectangle(impactObject);
                this.#dirVector.setAngleDeviation();
                this.#dirVector.incSpeed();
                break;
        }
    }

    #updateVectorCircleToCircle(impactObject){
        //transparent
        return;
    }

    #updateVectorCircleToRectangle(impactObject){
        const x = this.#previousPosition.x;
        const y = this.#previousPosition.y;

        const x0 = impactObject.p0.x;
        const y0 = impactObject.p0.y;
        const v0 = new Vector(x - x0, y - y0);
        
        // //Check for a diagonal impact
        // const angleDelta = Math.abs(Math.acos(v0.dX / v0.getLength()) - impactObject.angleRatio);
        // if((0 <= angleDelta) && (angleDelta <= 0.1)){
        //     //this.#dirVector.setdX((-1)*this.#dirVector.getdX());
        //     this.#dirVector.setdY((-1)*this.#dirVector.getdY());
        // }

        //Check the impact side for the static figure based on vector math
        impactObject.sideMap.forEach((value, key, map) => {
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
            
    updatePosition(once = false){
        if(game.getIdling() && !once) return; //ref to the global game var

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
        this.updatePosition();

        const x0 = this.currentPosition.x;
        const y0 = this.currentPosition.y;

        ctx.save();

        ctx.lineWidth = 0;
        ctx.fillStyle = this.material.color;
        ctx.beginPath();
        if(this.material.shadow) this.#drawShadow(ctx);
        ctx.arc(x0, y0, this.radius, 0, 2*Math.PI);
        ctx.fill();

        ctx.restore();

        //this.#drawDevData();
    }

    #drawShadow(ctx){
        const lightdX = this.ref.topMidPosition.x - this.currentPosition.x;
        const lightdY = this.ref.topMidPosition.y - this.currentPosition.y;
        const lightDirection = new Vector(lightdX, lightdY);
        const shadowDirection = lightDirection.setOpposite();

        const deltaShadowX = Math.round(Math.log(shadowDirection.getdX())/5) + 1;
        const deltaShadowY = Math.round(Math.log(shadowDirection.getdY())/4) + 2;

        ctx.shadowColor = 'black';
        ctx.shadowBlur = 7;
        ctx.shadowOffsetX = deltaShadowX;
        ctx.shadowOffsetY = deltaShadowY;
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
        this.ref.ctx.strokeText("Rad = " + Math.round(this.#dirVector.rad*1000)/1000 + " " + this.#dirVector.getdX() + " " + this.#dirVector.getdY(), x1, y1);
    }
}

class AI extends Rectangle{
    #type;
    #maxSpeed = 5;

    constructor(ref, x, y, width, height, material){
        super(ref, x, y, width, height);
        this.#type = Type.AI;
        this.material = material;

        this.centerHeight = Math.round(height/2);
        this.defaultPosition = new Point(this.currentPosition.x, Math.round(this.ref.canvas.height/2) - this.centerHeight);
        this.#maxSpeed += 0.002*this.ref.canvas.height;
        this.speedY = 0;
        this.acceleration = Math.log10(this.ref.canvas.width)/25;
        this.startTime = performance.now();
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

        if(Math.abs(deltaY) <= 1){
            this.speedY = 0;
            this.startTime = performance.now();
            return;
        }

        this.speedY = Math.log(Math.abs(deltaY) + 1);

        if(deltaY > 0) {
            this.currentPosition.y += this.speedY;
        }else{
            this.currentPosition.y -= this.speedY;
        }

        if(game.getIdling() && game.isAiTurn()) this.#bindBall();
    }
    
    #followBallPosition(){
        if(game.getIdling()) return; //check idle status based on the global var

        const oldPos = new Point(this.currentPosition.x, this.currentPosition.y);
        const ballPosY = this.ref.ball.currentPosition.y;
        const deltaY = ballPosY - (this.currentPosition.y + this.centerHeight);
        //const randomizeSpeed = Math.log(this.#maxSpeed + Math.abs(deltaY)/3);

        if(Math.abs(deltaY) < 1){
            
            this.speedY /= 3;
            //this.previousSpeed -= this.acceleration;
            //this.previousSpeed = 0;
            //this.speedY = this.previousSpeed - this.acceleration;
            return;
        }
        
        if(Math.abs(this.startTime - performance.now()) > 230){
            this.speedY = this.speedY + this.acceleration; //give the AI paddle acceleration based on physics formula: v = v0 + at
            this.speedY = (this.speedY > this.#maxSpeed)? this.#maxSpeed: this.speedY;
            this.startGame = performance.now();
        }

        if(deltaY > 0) {
            this.currentPosition.y += Math.round(this.speedY);
        } else {
            this.currentPosition.y -= Math.round(this.speedY);
        }

        if(!this.checkArea()) this.currentPosition = oldPos;
    }

    #bindBall(){
        const obj = this.ref.ball;

        obj.currentPosition.x = this.currentPosition.x + this.width + obj.radius;
        obj.currentPosition.y = this.currentPosition.y + this.centerHeight;

        obj.updatePosition(true);
    }

    draw(){
        const ctx = this.ref.ctx;

        this.update();
        this.trackBall();

        ctx.beginPath();
        ctx.save();

        if(this.material.shadow) super.drawShadow(ctx);
        
        ctx.fillStyle = this.material.color;
        if(game.ready){
            ctx.drawImage(this.material.texture, this.currentPosition.x, this.currentPosition.y, this.width, this.height);
        }else{
            ctx.fillRect(this.currentPosition.x, this.currentPosition.y, this.width, this.height);
        }
        ctx.restore();
        
        ctx.strokeStyle = "#F2DCA3";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.currentPosition.x, this.currentPosition.y, this.width, this.height);
    }

    getType(){
        return this.#type;
    }
}

class PlayerController extends Rectangle{
    #type;
    #maxSpeed = 7;

    constructor(ref, x, y, width, height, material){
        super(ref, x, y, width, height);
        this.#type = Type.PC;

        this.centerHeight = Math.round(height/2);
        this.defaultPosition = new Point(this.currentPosition.x, this.currentPosition.y - this.centerHeight);
        this.material = material;
        this.#maxSpeed += 0.005*this.ref.canvas.height;
        this.speedY = 0;

        this.controller = new ControllerBuilder(this.ref).setKeyboard().setMouse().build();
    }

    movePC(){
        const oldPos = new Point(this.currentPosition.x, this.currentPosition.y);
        
        if(Controller.mode === Type.Keyboard){
            const io = this.controller.keyboard;

            if(io.keyPressed){
                this.speedY += 0.1 + this.speedY;
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
                const distance = io.leftClickPos.y - (this.currentPosition.y + this.centerHeight);
                this.speedY += 0.1 + this.speedY;
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

        if(game.getIdling() && !game.isAiTurn()) this.#bindBall(); //bind the ball to the pc controller based on the global var
    }

    #bindBall(){
        const obj = this.ref.ball;

        obj.currentPosition.x = this.currentPosition.x - obj.radius;
        obj.currentPosition.y = this.currentPosition.y + this.centerHeight;

        obj.updatePosition(true);
    }

    draw(){
        const ctx = this.ref.ctx;

        this.update();
        this.movePC();
        
        ctx.beginPath();
        ctx.save();
        
        if(this.material.shadow) super.drawShadow(ctx);
        
        ctx.fillStyle = this.material.color;
        if(game.ready){
            ctx.drawImage(this.material.texture, this.currentPosition.x, this.currentPosition.y, this.width, this.height);
        }else{
            ctx.fillRect(this.currentPosition.x, this.currentPosition.y, this.width, this.height);
        }
        ctx.restore();
        
        ctx.strokeStyle = "#F2DCA3";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.currentPosition.x, this.currentPosition.y, this.width, this.height);
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
    
    static getLTRAngle(){
        let angle;
        const delta = 26;

        const angle1 = (Math.random()*delta) + 10;
        const angle2 = (Math.random()*delta) + 325;
        angle = (Math.random() > 0.5)? angle1: angle2;

        return angle;
    }

    static getRTLAngle(){
        let angle;
        const delta = 26;

        const angle1 = (Math.random()*delta) + 145;
        const angle2 = (Math.random()*delta) + 190;
        angle = (Math.random() > 0.5)? angle1: angle2;

        return angle;
    }
}

const game = new Game();

//const board = new Board("board").render();