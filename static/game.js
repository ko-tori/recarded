const fileLetters = [0, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const levels = [null, null, '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
var deck = [];
var hand = [];
var table = [[], [], [], [], []];

// game information vars (placeholders for now)
var declaredCard;

var playerNames = ['ああああああああああああああああ', 'プレーヤー・トゥー', 'Player 3', 'Player 4'];
var playerTeams = ['?', '?', '?', '?'];
var playerPoints = [0, 0, 0, 0, 0];
var playerLevels = [2, 2, 2, 2, 2];
const TEAM_ENUM = ['?', 'Defending', 'Attacking'];

var playerPosition = 0;

var friendCard;

// other vars for rendering
var cardImgs = {};

var width = 0;
var height = 0;

var mouseX = 0;
var mouseY = 0;

const HAND_SIZE = 30;//Math.floor(Math.random() * 40) + 10;
const CARD_WIDTH_PX = 691;
const CARD_HEIGHT_PX = 1056;
const CARD_ASPECT = CARD_WIDTH_PX / CARD_HEIGHT_PX;

const CENTER_HOVER = true;

const cardBack = new Image;
cardBack.src = '/cards/back.png';

const unknown = new Image;
unknown.src = '/cards/unknown.png';

var hovered;
var selected = [];

var lastTime;
var elapsedSinceLastLoop;
var animationSpeed = 6 / 25;

var buttonblur = 0;
var buttonblurInterp = 0;

var tableDim;

class TableCardRenderer {
	constructor(group, i, img, w, h, x, y, rot0, playCenterX, playCenterY) {
		this.group = group;
		this.img = img;
		this.i = i;

		this.wInterp = w;
		this.hInterp = h;
		this.w = 100;
		this.h = this.w / CARD_ASPECT;

		this.playCenterX = playCenterX;
		this.playCenterY = playCenterY;
		this.tableCenterX = playCenterX();
		this.tableCenterY = playCenterY();
		this.x = x - this.tableCenterX;
		this.y = y - this.tableCenterY;
		this.xTarget = Math.random() * 50 - 25 + (this.i - (group.length - 1) / 2) * 20;
		this.yTarget = Math.random() * 50 - 25;

		this.rot = rot0 + (Math.random() * 1 - 0.5) * Math.PI / 2;
		this.rotInterp = rot0;
		this.flipped = false;

		this.hovered = false;
		this.hoveredX = (this.i - (group.length - 1) / 2) * (width / 15 * 1.05);
		this.hoveredY = 0;

		this.textAlphaInterp = 0;
		this.textAlpha = 0;
	}

	render(ctx) {
		ctx.save();
		ctx.translate(this.tableCenterX + this.x, this.tableCenterY + this.y);
		ctx.rotate(this.rotInterp);
		ctx.drawImage(this.flipped ? cardBack : this.img, -this.wInterp / 2, -this.hInterp / 2, this.wInterp, this.hInterp);
		ctx.restore();

		ctx.font = '24px Titillium Web';
		ctx.fillStyle = `rgba(0, 0, 0, ${this.textAlphaInterp}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';

		if (CENTER_HOVER) {
			ctx.fillText(analyzeHand(this.group, declaredCard), width / 2, height / 2 + this.hInterp / 2 + 10);
		} else {
			ctx.fillText(analyzeHand(this.group, declaredCard), this.tableCenterX, this.tableCenterY + this.hInterp / 2 + 10);
		}

		if (!this.flipped && this.hovered) {
			if (CENTER_HOVER) {
				this.x += (this.hoveredX - this.tableCenterX - this.x + width / 2) / 15 * elapsedSinceLastLoop * animationSpeed;
				this.y += (this.hoveredY - this.tableCenterY - this.y + height / 2) / 15 * elapsedSinceLastLoop * animationSpeed;
			} else {
				this.x += (this.hoveredX - this.x) / 15 * elapsedSinceLastLoop * animationSpeed;
				this.y += (this.hoveredY - this.y) / 15 * elapsedSinceLastLoop * animationSpeed;
			}				

			this.rotInterp += (-this.rotInterp) / 15 * elapsedSinceLastLoop * animationSpeed;
			this.w = width / 15;
			this.h = this.w / CARD_ASPECT;
			this.textAlpha = 1;
		} else {
			this.x += (this.xTarget - this.x) / 15 * elapsedSinceLastLoop * animationSpeed;
			this.y += (this.yTarget - this.y) / 15 * elapsedSinceLastLoop * animationSpeed;
			this.rotInterp += (this.rot - this.rotInterp) / 15 * elapsedSinceLastLoop * animationSpeed;
			this.w = width / 20;
			this.h = this.w / CARD_ASPECT;
			this.textAlpha = 0;
		}

		this.wInterp += (this.w - this.wInterp) / 15 * elapsedSinceLastLoop * animationSpeed;
		this.hInterp += (this.h - this.hInterp) / 15 * elapsedSinceLastLoop * animationSpeed;
		this.textAlphaInterp += (this.textAlpha - this.textAlphaInterp) / 15 * elapsedSinceLastLoop * animationSpeed;
	}

	checkHit(x, y) {
		x -= this.x + this.tableCenterX;
		y -= this.y + this.tableCenterY;

		[x, y] = [x * Math.cos(-this.rotInterp) - y * Math.sin(-this.rotInterp),
				x * Math.sin(-this.rotInterp) + y * Math.cos(-this.rotInterp)];

		return x > -this.w / 2 && x < this.w / 2 &&
			y > -this.h / 2 && y < this.h / 2;
	}

	checkHitTargetPosition(x, y) {
		x -= this.xTarget + this.tableCenterX;
		y -= this.yTarget + this.tableCenterY;

		[x, y] = [x * Math.cos(-this.rot) - y * Math.sin(-this.rot),
				x * Math.sin(-this.rot) + y * Math.cos(-this.rot)];

		return x > -this.w / 2 && x < this.w / 2 &&
			y > -this.h / 2 && y < this.h / 2;
	}

	setRendererParams(params) {
		this.tableCenterX = this.playCenterX();
		this.tableCenterY = this.playCenterY();

		this.hoveredX = (this.i - (this.group.length - 1) / 2) * (width / 15 * 1.05);
	}
}

class HandCardRenderer {
	constructor(img) {
		this.img = img;
		this.offX = 0;
		this.offY = 0;
		this.targetOffX = 0;
		this.targetOffY = 0;

		this.hovered = false;
		this.selected = false;

		this.blur = 0;
		this.blurInterp = 0;
	}

	render(ctx) {
		let [i, n, r, w, h] = [this.i, this.n, this.r, this.w, this.h];
		if (this.selected) {
			this.targetOffY = -h / 5;
		} else if (this.hovered) {
			this.targetOffY = -h / 7;
		} else {
			this.targetOffY = 0;
		}

		ctx.save();
		ctx.rotate(this.rotInterp);
		ctx.shadowColor = '#FADA5E';
		ctx.shadowBlur = this.blurInterp;
		this.blur = this.selected ? 30 : 0;
		ctx.drawImage(this.img, this.offX - w / 2, -r + this.offY, w, h);
		
		ctx.restore();

		this.offX += (this.targetOffX - this.offX) / 15 * elapsedSinceLastLoop * animationSpeed;
		this.offY += (this.targetOffY - this.offY) / 15 * elapsedSinceLastLoop * animationSpeed;
		this.iInterp += (this.i - this.iInterp) / 15 * elapsedSinceLastLoop * animationSpeed;
		this.rotInterp += (this.rot - this.rotInterp) / 15 * elapsedSinceLastLoop * animationSpeed;
		this.blurInterp += (this.blur - this.blurInterp) / 10 * elapsedSinceLastLoop * animationSpeed;
		if (this.blurInterp < 0.5) this.blurInterp = 0;
	}

	getPosRot() {
		let x = this.offX - this.w / 2;
		let y = this.offY - this.r;

		[x, y] = [x * Math.cos(this.rotInterp) - y * Math.sin(this.rotInterp),
				x * Math.sin(this.rotInterp) + y * Math.cos(this.rotInterp)];

		x += width / 2;
		y += height + width / 2;

		return [x, y, this.rotInterp];
	}

	checkHit(x, y) {
		x -= width / 2;
		y -= height + width / 2;

		[x, y] = [x * Math.cos(-this.rotInterp) - y * Math.sin(-this.rotInterp),
				x * Math.sin(-this.rotInterp) + y * Math.cos(-this.rotInterp)];

		return x > this.offX - this.w / 2 && x < this.offX + this.w / 2 &&
			y > -this.r + this.offY && y < -this.r + this.offY + this.h;
	}

	setRendererParams(params) {
		let [i, n, r, w, h] = params;
		this.i = i;
		this.iInterp = i;
		this.n = n;
		this.r = r;
		this.w = w;
		this.h = h;
		this.calcRot();
		this.rotInterp = this.rot;
	}

	updateHandPos(i, n) {
		this.i = i;
		this.n = n;
		this.calcRot();
	}

	calcRot() {
		this.rot = (this.i - (this.n - 1) / 2) / this.n * Math.PI / 6;
	}
}

class Card {
	constructor(suit, num, renderer=null) {
		this.suit = suit;
		this.num = num;
		this.img = cardImgs[suit + num];

		if (renderer) {
			this.renderer = new renderer(this.img);
		}
	}

	toString() {
		return fileLetters[this.num] + this.suit;
	}

	toLongString() {
		if (this.suit == 'J') {
			return (this.num == 1 ? 'Big' : 'Small') + ' Joker';
		}
		return longLetters[this.num] + ' of ' + suits[this.suit];
	}

	render(ctx) {
		this.renderer.render(ctx);
	}

	checkHit(x, y) {
		return this.renderer.checkHit(x, y);
	}

	setRendererParams() {
		this.renderer.setRendererParams(arguments);
	}

	equals(other) {
		return this.suit == other.suit && this.num == other.num;
	}

	serialize() {
		return {
			suit: this.suit,
			num: this.num
		};
	}

	static deserialize(c) {
		return new Card(c.suit, c.num);
	}
}

var drawUserInfo = function(ctx, i, size, align, x, y, maxW) {
	let p = (i + playerPosition) % 5;
	let name = playerNames[p];
	let level = playerLevels[p];
	let team = playerTeams[p];
	let points = playerPoints[p];

	ctx.font = `${size - 6}px 'Titillium Web'`;
	ctx.textAlign = align;
	ctx.fillText(name, x, y - size * 1.5, maxW);
	ctx.fillText("Level: " + levels[level], x, y - size * 0.5, maxW);
	ctx.fillText("Team: " + TEAM_ENUM[team], x, y + size * 0.5, maxW);
	ctx.fillText("Points: " + points, x, y + size * 1.5, maxW);
};

const tableCenterFuncs = [
	[
		() => tableDim[0] + tableDim[2] / 2,
		() => tableDim[1] + 3 * tableDim[3] / 4
	],
	[
		() => tableDim[0] + 5 * tableDim[2] / 6,
		() => tableDim[1] + 3 * tableDim[3] / 4
	],
	[
		() => tableDim[0] + 5 * tableDim[2] / 6,
		() => tableDim[1] + 1 * tableDim[3] / 4
	],
	[
		() => tableDim[0] + 1 * tableDim[2] / 6,
		() => tableDim[1] + 1 * tableDim[3] / 4
	],
	[
		() => tableDim[0] + 1 * tableDim[2] / 6,
		() => tableDim[1] + 3 * tableDim[3] / 4
	]
];

function getPlayerHandLoc(p) {
	if (p == 0) {
		return [
			tableDim[0] + tableDim[2] / 2,
			height * 1.1,
			0
		];
	}
	if (p == 1) {
		return [
			width * 1.1,
			tableDim[1] + 3 * tableDim[3] / 4,
			-Math.PI / 2
		];
	}
	if (p == 2) {
		return [
			width * 1.1,
			tableDim[1] + 1 * tableDim[3] / 4,
			-Math.PI / 2
		];
	}
	if (p == 3) {
		return [
			-width * 0.1,
			tableDim[1] + 1 * tableDim[3] / 4,
			Math.PI / 2
		];
	}
	if (p == 4) {
		return [
			-width * 0.1,
			tableDim[1] + 3 * tableDim[3] / 4,
			Math.PI / 2
		];
	}
}

var playCards = function(cards) {
	playCardsHandler(cards);
	sendPlayCards(cards);
}

var playCardsHandler = function(cards, player=playerPosition, flip=true) {
	cards.sort(cardSorter);
	if (cards.length == 0) {
		return;
	}

	// index of player relative to table, going counterclockwise starting with the client
	/* 
	3 |   | 2
	4 | 0 | 1
	*/

	let p = (player - playerPosition + 5) % 5;

	let [fx, fy] = tableCenterFuncs[p];

	for (let i = 0; i < cards.length; i++) {
		let r, w, h, x, y, rot, img;
		if (!cards[i].renderer) {
			[r, w, h] = getHandCardDim();
			[x, y, rot] = getPlayerHandLoc(p);
		} else {
			w = cards[i].renderer.w;
			h = cards[i].renderer.h;
			[x, y, rot] = cards[i].renderer.getPosRot();
		}
		if (cards[i].img) {
			img = cards[i].img;
		} else {
			img = cardImgs[cards[i].suit + cards[i].num];
		}
		cards[i].renderer = new TableCardRenderer(cards, i, img, w, h, x, y, rot, fx, fy);
	}

	if (flip) {
		if (table[p].length > 0) {
			for (let card of table[p][table[p].length - 1]) {
				card.renderer.flipped = true;
			}
		}
	}

	table[p].push(cards);
};

var getHandCardDim = function() {
	let r = width * 0.65;// / 2 * Math.sqrt(2);
	let cardH = r - width * Math.sin(32 * Math.PI / 180);
	let cardW = cardH * CARD_ASPECT;

	return [r, cardH, cardW];
};

var setCardParams = function() {
	let [r, cardH, cardW] = getHandCardDim();

	for (let i = 0; i < hand.length; i++) {
		hand[i].setRendererParams(i, hand.length, r, cardW, cardH);
	}

	for (let player of table) {
		for (let group of player) {
			for (let card of group) {
				card.setRendererParams();
			}
		}
	}
};

var align = function() {
	width = $(window).width();
	height = $(window).height();

	let r = width * 0.65;
	let tableH = 0.9 * (height + width / 2 - r);
	tableDim = [width * 0.15, tableH * 0.05, width * 0.7, tableH];
	
	$('#canvas').attr("width", width)
		.attr("height", height);

	$('#priority-canvas').attr("width", width)
		.attr("height", height);

	setCardParams();
};

addEventListener('resize', align);

var mouseMoveListener = function(e) {
	mouseX = e.clientX;
	mouseY = e.clientY;
};

addEventListener('mousemove', mouseMoveListener);

// var mouseDownListener = function(e) {
// 	if (hovered) {
		
// 		//removeCard(hand.indexOf(hovered));
// 	} else {
// 		//document.getElementById('test').innerHTML = 'No card selected';
// 	}
// };

// addEventListener('mousedown', mouseDownListener);

var clickListener = function(e) {
	if (hovered) {
		if (hovered.renderer.selected) {
			hovered.renderer.selected = false;
			selected.splice(selected.indexOf(hovered), 1);
		} else {
			selected.push(hovered);
			hovered.renderer.selected = true;
		}
	} else {
		for (let card of selected) {
			card.renderer.selected = false;
		}
		selected = [];
	}

	document.getElementById('selectedCards').innerHTML = analyzeHand(selected, declaredCard).split(',').map(s => s.trim()).join('<br>');
};

addEventListener('click', clickListener);

var contextMenuListener = function(e) {
	e.preventDefault();
	if (hovered) {
		removeCard(hand.indexOf(hovered));
		let i = selected.indexOf(hovered);
		if (i >= 0) {
			selected.splice(i, 1);
		}
		
		document.getElementById('selectedCards').innerHTML = analyzeHand(selected, declaredCard).split(',').map(s => s.trim()).join('<br>');
	} else {
		
	}
};

addEventListener('contextmenu', contextMenuListener);

$('#actionButton').click(e => {
	if (currentButton == buttons.Play) {
		let cards = [];
		for (let card of selected) {
			cards.push(card);
			removeCard(hand.indexOf(card));
		}
		selected = [];
		playCards(cards);
	} else if (currentButton == buttons.Declare) {

	} else if (currentButton == buttons.Overturn) {
		
	} else if (currentButton == buttons.Reinforce) {
		
	}
});

const buttons = {
	Play: {
		text: 'Play',
		color: '#32cd32'
	},
	Declare: {
		text: 'Declare',
		color: '#d15434'
	},
	Overturn: {
		text: 'Overturn',
		color: '#c9281c'
	},
	Reinforce: {
		text: 'Reinforce',
		color: '#bf1174'
	}
};

var currentButton = buttons.Play;
var buttonEnabled = false;

var setButton = function(b) {
	if (!buttons[b]) {
		console.error(b, 'not a defined button');
		return;
	}
	currentButton = buttons[b];

	$('#actionButton')[0].innerHTML = currentButton.text;
	updateButtonStyles();
};

var setButtonEnabled = function(e) {
	buttonEnabled = e;

	if (e) {
		$('#actionButton').addClass('activeActionButton');
	} else {
		$('#actionButton').removeClass('activeActionButton');
	}

	updateButtonStyles();
};

var updateButtonStyles = function() {
	if (buttonEnabled) {
		$('#actionButton').css({
			'background-color': currentButton.color
		});
	} else {
		$('#actionButton').css({
			'background-color': 'grey'
		});
	}
};

var init = function(callback) {
	let c = 0;

	let finish = function() {
		c++;

		if (c == 54) {
			callback();
		}
	};

	let i = new Image;
	i.src = '/cards/J1.png';
	i.onload = finish;
	cardImgs['J1'] = i;

	i = new Image;
	i.src = '/cards/J2.png';
	i.onload = finish;
	cardImgs['J2'] = i;

	for (let suit of ['C', 'D', 'H', 'S']) {
		for (let n = 1; n <= 13; n++) {
			let i = new Image;
			i.src = '/cards/' + fileLetters[n] + suit + '.png';
			i.onload = finish;
			cardImgs[suit + n] = i;
		}
	}
};

var updateHandPositions = function() {
	for (let i = 0; i < hand.length; i++) {
		hand[i].renderer.updateHandPos(i, hand.length);
	}
};

var removeCard = function(n) {
	hand.splice(n, 1);
	updateHandPositions();
};

var hoverCard = function(n) {
	unhoverCards();
	hand[n].renderer.hovered = true;
};

var unhoverCards = function() {
	for (let i = 0; i < hand.length; i++) {
		hand[i].renderer.hovered = false;
	}
};

var declareCard = function(card) {
	declaredCard = card;
	hand.sort(cardSorter);
	updateHandPositions();
};

var render = function(currentTime) {
	if (!lastTime) {
		lastTime = currentTime;
	}
	elapsedSinceLastLoop = Math.min(currentTime - lastTime, 1000); // 1 fps minimum
	lastTime = currentTime;

	let canvas = document.getElementById('canvas');
	let ctx = canvas.getContext('2d');

	let priocanvas = document.getElementById('priority-canvas');
	let pctx = priocanvas.getContext('2d');

	pctx.clearRect(0, 0, width, height);
	ctx.clearRect(0, 0, width, height);

	// player ui testing
	ctx.save();

	ctx.strokeStyle = '#DDD';
	let [tableX, tableY, tableW, tableH] = tableDim;

	// ctx.strokeRect(tableX, tableY, tableW, tableH);

	ctx.strokeRect(tableX + tableW / 3, tableY + tableH / 2, tableW / 3, tableH / 2);
	
	// ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
	ctx.strokeRect(tableX, tableY, tableW / 3, tableH / 2);

	// ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
	ctx.strokeRect(tableX, tableH / 2 + tableY, tableW / 3, tableH / 2);

	// ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
	ctx.strokeRect(tableX + 2 * tableW / 3, tableY, tableW / 3, tableH / 2);

	// ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
	ctx.strokeRect(tableX + 2 * tableW / 3, tableH / 2 + tableY, tableW / 3, tableH / 2);

	// ctx.beginPath();
	// let r = width * 0.65;
	// ctx.ellipse(width / 2, height + width / 2, r, r, 0, 0, Math.PI * 2);
	// ctx.stroke();

	// hand rendering
	ctx.save();
	// ctx.textBaseline = 'top';
	// ctx.fillText('Left click to select, right click to delete, refresh to draw a random hand', 10, 10);
	ctx.fillStyle = 'black';
	
	ctx.translate(width / 2, height + width / 2);
	
	for (let i = 0; i < hand.length; i++) {
		hand[i].render(ctx);
	}

	ctx.restore();

	// cards on table rendering
	ctx.save();

	// TODO in the actual thing these loops might be inverted for the table to be represented as:
	// table[i][j] = hand j played in round i
	for (let player of table) {
		for (let group of player) {
			for (let card of group) {
				if (!card.renderer.flipped && card.renderer.hovered) {
					card.render(pctx);
				} else {
					card.render(ctx);
				}
			}
		}
	}
	
	ctx.restore();

	// declared and friend cards
	let w = Math.min(tableW / 12, tableH / 4 * CARD_ASPECT);
	let h = w / CARD_ASPECT;

	ctx.textBaseline = 'top';
	ctx.fillStyle = 'black';
	ctx.textAlign = 'center';
	ctx.font = `${h / 8}px Titillium Web`;

	ctx.fillText('Declared Card', tableX + 5 * tableW / 12, tableY);
	if (!declaredCard) {
		ctx.drawImage(unknown, tableX + 5 * tableW / 12 - w / 2, tableY + h / 8, w, h);
	} else {
		ctx.drawImage(declaredCard.img, tableX + 5 * tableW / 12 - w / 2, tableY + h / 8, w, h);
	}

	ctx.fillText('Friend Card', tableX + 7 * tableW / 12, tableY);
	if (!friendCard) {
		ctx.drawImage(unknown, tableX + 7 * tableW / 12 - w / 2, tableY + h / 8, w, h);
	} else {
		ctx.drawImage(friendCard.img, tableX + 7 * tableW / 12 - w / 2, tableY + h / 8, w, h);
	}

	// player names
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'end';
	drawUserInfo(ctx, 3, tableH / 16, 'end', tableX - 5, tableY + tableH / 4, tableX - 10);
	drawUserInfo(ctx, 4, tableH / 16, 'end', tableX - 5, tableY + 3 * tableH / 4, tableX - 10);

	ctx.textAlign = 'start';
	drawUserInfo(ctx, 2, tableH / 16, 'start', tableX + tableW + 5, tableY + tableH / 4, tableX - 10);
	drawUserInfo(ctx, 1, tableH / 16, 'start', tableX + tableW + 5, tableY + 3 * tableH / 4, tableX - 10);
	drawUserInfo(ctx, 0, tableH / 14, 'start', 10, height - tableH / 7 - 20);

	ctx.restore();

	// hit detection

	for (let playerCards of table) {
		if (playerCards.length > 0) {
			let handHovered = false;
			for (let card of playerCards[playerCards.length - 1]) {
				if (card.renderer.checkHitTargetPosition(mouseX, mouseY)) {
					handHovered = true;
					break;
				}
			}

			for (let card of playerCards[playerCards.length - 1]) {
				card.renderer.hovered = handHovered;
			}
		}
	}

	let pointer = false;
	for (let i = hand.length - 1; i >= 0; i--) {
		if (pointer) {
			hand[i].renderer.hovered = false;
			continue;
		}

		let hit = hand[i].checkHit(mouseX, mouseY);
		if (hit) {
			hovered = hand[i];
			hand[i].renderer.hovered = true;
			pointer = true;
		} else {
			hand[i].renderer.hovered = false;
		}
	}

	if (!pointer) {
		hovered = undefined;
	}

	if (pointer) {
		$(document.body).addClass('pointer');
	} else {
		$(document.body).removeClass('pointer');
	}

	window.requestAnimationFrame(render);
};

function testHovers() {
	(function f(n) {
		if (n >= hand.length) {
			unhoverCards();
			return;
		}
		hoverCard(n);
		setTimeout(() => f(n + 1), 200);
	})(0);
}
