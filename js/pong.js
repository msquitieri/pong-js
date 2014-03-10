var userPaddle, enemyPaddle, needsRefresh, ball, difficulty;
var WINNING_SCORE = 10;
var isGameOver = false;

// Resets the game to its original starting point.
function reset() {
	isGameOver = false;
	enemyPaddle.score = 0;
	userPaddle.score = 0;
}

// This is the same as document.ready or setting <body> onload
$(function() {
	// Binds click event to pause button to pause the game.
	$("#pause").live('click', function () {
		needsRefresh = false;
		$("#pause").attr("id", "resume").html("RESUME");
	});
	
	// Binds click event to resume button to resume the game.
	$("#resume").live('click', function() {
		if (!needsRefresh) {
			needsRefresh = true;
			paint();
		}
		$("#resume").attr("id", "pause").html("PAUSE");
	});
	
	// Binds click event to the new game button to start a new game.
	$("#new-game").click(function () {
		reset();
		ball.serve();
		if (!needsRefresh) { 
			needsRefresh = true;
			paint();
		}
		$("#resume").attr("id", "pause").html("PAUSE");
	});

	// Binds an on change event to the difficulty drop down menu to change the difficulty.
	$("#difficulty").change(function() {
		difficulty.name = $(this).children("option:selected").val();
		switch(difficulty.name) {
			case 'Intermediate':
				difficulty.close= 3;
				difficulty.near = 5;
				difficulty.far = 8;
				break;
			case 'Beginner':
			default:
				difficulty.close= 2;
				difficulty.near = 4;
				difficulty.far = 6;
				break;
		}
	});
	
	// Binds a key down event to listen to the up and down keys to move the user paddle.
	$(document).keydown(function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);			//e.keyCode for IE Compatibility, e.which for everything else.
		if (code == '38') userPaddle.move('up');
		if (code == '40') userPaddle.move('down');
	});

	init();
	welcome();
});

// Displays first time welcome screen.
function welcome() {
	var c = document.getElementById( "myCanvas" );
	var cntxt = c.getContext( "2d" );
	cntxt.fillStyle = "#ffffff";
	cntxt.font = "60px Helvetica";
	cntxt.textAlign = "center";

	cntxt.fillText("PONG", c.width/2, c.height/5);
	cntxt.font = "20px Helvetica";
	cntxt.fillText("Use the arrow keys to move.", c.width/2, 2*c.height/5);
	cntxt.font = "25px Helvetica";
	cntxt.fillText("First to " + WINNING_SCORE + " wins!", c.width/2, 3*c.height/5);
	cntxt.font = "30px Helvetica";
	cntxt.fillText("Press New Game to Play!", c.width/2, 4*c.height/5);
}

// Initializes game objects.
function init() {
	needsRefresh = false;
	
	// Starts off at Beginner difficulty.
	difficulty = {
		name : 'Beginner',
		close : 2,
		near : 4,
		far : 6
	}

	userPaddle = {
		X : 20,
		y : 200,
		height : 50,
		width : 10,
		move : function (v) {
			if (needsRefresh) {
				switch(v) {
					case 'up':
						this.y -= 30;
						if (this.y < 0) this.y = 0;
						break;
					case 'down':
						this.y += 30;
						if (this.y + this.height > $("#myCanvas").width()) this.y = $("#myCanvas").width() - this.height;
						break;
					default:
						break;
				}
			}
		},
		score : 0,
		justScored : false
	};

	enemyPaddle = {
		X : $("#myCanvas").width()-30,
		y : 200,
		height : 50,
		width : 10,
		move : function () {
			if (difficulty.name == 'Impossible') this.y = ball.y - this.height/2;
			else {
				var ydiff = this.y+(this.height/2) - ball.y+ball.radius;
				if (ydiff == 0) ;	// If the center of the ball is aligned with the center of the paddle, do nothing.
				else if (ydiff > Math.floor($("#myCanvas").height()/8)) this.y -= difficulty.far; 
				else if (ydiff > Math.floor($("#myCanvas").height()/10)) this.y -= difficulty.near; 
				else if (ydiff > 0) this.y -= difficulty.close;
				else if (ydiff < -1*Math.floor($("#myCanvas").height()/8)) this.y += difficulty.far;
				else if (ydiff < -1*Math.floor($("#myCanvas").height()/10)) this.y += difficulty.near;
				else if (ydiff < 0) this.y += difficulty.close;
			}
			if (this.y < 0) this.y = 0;
			else if (this.y + this.height > $("#myCanvas").width()) this.y = $("#myCanvas").width() - this.height;
		},
		score : 0,
		justScored : false
	};

	ball = {
		x : 50,
		y : 50,
		dx : 5,
		dy : 2,
		radius : 10,
		isOutOfYBounds : function () {
			return ((this.y-this.radius < 0) || (this.y > $("#myCanvas").height()-this.radius));
		},
		isHitByPaddle : function () {
			return (
				(this.x-this.radius <= userPaddle.X+userPaddle.width && this.x-this.radius >= userPaddle.X) 
				&& (this.y <= userPaddle.y+userPaddle.height && this.y >= userPaddle.y)
				|| (this.x+this.radius >= enemyPaddle.X && this.x+this.radius <= enemyPaddle.X+enemyPaddle.width)
				&& (this.y+this.radius <= enemyPaddle.y+enemyPaddle.height && this.y-this.radius >= enemyPaddle.y)
			);
		},
		isHitByUserPaddle : function () {
			return (
				(this.x-this.radius <= userPaddle.X+userPaddle.width && this.x-this.radius >= userPaddle.X) 
				&& (this.y <= userPaddle.y+userPaddle.height && this.y >= userPaddle.y)
			);
		},
		didScore : function () {
			return (this.x < userPaddle.X)
				|| (this.x > enemyPaddle.X+enemyPaddle.width);
		},
		move : function () {
			if (this.isHitByPaddle()) {
				var originalDy = this.dy;
				var ydiff = (this.isHitByUserPaddle()) ? userPaddle.y+(userPaddle.height/2) : enemyPaddle.y+(enemyPaddle.height/2);
				ydiff -= (this.y+this.radius);
				this.dy = (this.dy < 0 && ydiff > 0 || this.dy > 0 && ydiff < 0) ? -1*Math.ceil(ydiff/3) : Math.ceil(ydiff/3);
				if (this.dy == 0) this.dy = (originalDy > 0) ? 1 : -1;
				this.dx *= -1;
				playSound('blip');
			}
			if (this.isOutOfYBounds()) {
				this.dy *= -1;
				playSound('blip');
			}
			this.x += this.dx;
			this.y += this.dy;
		},
		serve : function () {
			this.y = $("#myCanvas").height()/2 - this.radius;
			this.x = $("#myCanvas").width()/2 - this.radius;
			this.dx = (userPaddle.justScored) ? -5 : 5;
			this.dy = 2;
		}
	};
}

// Sets up callback to paint the canvas.
window.requestFrame = ( function( callback ) {
	return window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function( callback ) { window.setTimeout( callback, 1000 / 60 ); };
} ) () ;

// Paints the canvas, putting all of the game elements into their proper places on the canvas.
function paint() {
	// get graphics context
	var c = document.getElementById( "myCanvas" );
	c.width = c.width;					// Resets Canvas for Drawing
	var cntxt = c.getContext( "2d" );

	cntxt.fillStyle = "rgba(255,255,255,0.2)";
	for (i=0; i<$('#myCanvas').height(); i+=30) cntxt.fillRect($('#myCanvas').width()/2, i, 5, 20);

	cntxt.strokeStyle = "#ffffff";
	cntxt.fillStyle = "#ffffff";
	cntxt.font = "20px Helvetica";
	cntxt.textAlign = "center";

	// Display Score
	cntxt.fillText(userPaddle.score + " - " + enemyPaddle.score, $("#myCanvas").width()/2+2, 20);
	// Draw User's Paddle
	cntxt.fillRect(userPaddle.X, userPaddle.y, userPaddle.width, userPaddle.height);
	// Draw Enemy's Paddle
	cntxt.fillRect(enemyPaddle.X, enemyPaddle.y, enemyPaddle.width, enemyPaddle.height);

	if (isGameOver) {
		cntxt.font = "40px Helvetica";
		var text = (enemyPaddle.score == WINNING_SCORE) ? "You Lost!" : "You Won!";
		cntxt.fillText("Game Over", $("#myCanvas").width()/2, $("#myCanvas").height()/3+20);
		cntxt.fillText(text, $("#myCanvas").width()/2, $("#myCanvas").height()/2+20);
	} else {
		// Move Pong Ball
		ball.move();
		enemyPaddle.move();
		cntxt.beginPath();
		cntxt.arc( ball.x, ball.y, ball.radius, 0, Math.PI*2, true );
		cntxt.closePath();
		cntxt.fill();

		if (ball.didScore()) {
			changeScore();
			if (!isGameOver) ball.serve();
		}
	}
	
	//debug();

	if (needsRefresh) {
		requestFrame( function() { paint(); } );
	}
}

// Sets the variables to denote that the game is over.
function gameOver() {
	isGameOver = true;
	playSound("game-over");
}

// Tests to see where the ball landed and increments the score of the enemyPaddle or the userPaddle accordingly.
function changeScore() {
	playSound('score');
	userPaddle.justScored = enemyPaddle.justScored = false;

	if (ball.x < userPaddle.X) {
		enemyPaddle.score++;
		enemyPaddle.justScored = true;
	}
	else {
		userPaddle.score++;
		userPaddle.justScored = true;
	}

	if (userPaddle.score == WINNING_SCORE || enemyPaddle.score == WINNING_SCORE) gameOver();
}

// Plays the sound given by the id of the html audio element.
function playSound(sound) {
	document.getElementById(sound).play();
}

// Displays useful information for debugging purposes.
function debug() {
	console.log("ball.x: " + ball.x);
	console.log("ball.y: " + ball.y);
	console.log("ball.dx: " + ball.dx);
	console.log("ball.dy: " + ball.dy);
	console.log("userPaddle.y: " + userPaddle.y);
	console.log("enemyPaddle.y: " + enemyPaddle.y);
}
