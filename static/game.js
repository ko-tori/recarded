const fileLetters = [0, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
var deck = [];
var hand = [];
var table = [];

// game information vars (placeholders for now)
var declaredCard;

var playerNames = ['ああああああああああああああああ', 'プレーヤー・トゥー', 'Player 3', 'Player 4'];
var playerTeams = ['?', '?', '?', '?'];
var playerPoints = [0, 0, 0, 0, 0];
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

const cardBack = new Image;
cardBack.src = '/cards/back.png';

const unknown = new Image;
unknown.src = '/cards/unknown.png';

var hovered;
var selected = [];

var lastTime;
var elapsedSinceLastLoop;
var animationSpeed = 6 / 25;

var playButtonHovered = false;
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
		this.hoveredX = (this.i - (group.length - 1) / 2) * 160;
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
		ctx.fillText(analyzeHand(this.group, declaredCard), this.tableCenterX, this.tableCenterY + this.hInterp / 2 + 10);

		if (!this.flipped && this.hovered) {
			this.x += (this.hoveredX - this.x) / 15 * elapsedSinceLastLoop * animationSpeed;
			this.y += (this.hoveredY - this.y) / 15 * elapsedSinceLastLoop * animationSpeed;
			this.rotInterp += (-this.rotInterp) / 15 * elapsedSinceLastLoop * animationSpeed;
			this.w = 150;
			this.h = 150 / CARD_ASPECT;
			this.textAlpha = 1;
		} else {
			this.x += (this.xTarget - this.x) / 15 * elapsedSinceLastLoop * animationSpeed;
			this.y += (this.yTarget - this.y) / 15 * elapsedSinceLastLoop * animationSpeed;
			this.rotInterp += (this.rot - this.rotInterp) / 15 * elapsedSinceLastLoop * animationSpeed;
			this.w = 100;
			this.h = 100 / CARD_ASPECT;
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
	constructor(suit, num) {
		this.suit = suit;
		this.num = num;
		this.img = cardImgs[suit + num];

		this.renderer = new HandCardRenderer(this.img);
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
}

var drawUserInfo = function(ctx, name, team, points, size, align, x, y, maxW) {
	ctx.font = `${size - 6}px 'Titillium Web'`;
	ctx.textAlign = align;
	ctx.fillText(name, x, y - size, maxW);
	ctx.fillText("Team: " + TEAM_ENUM[team], x, y, maxW);
	ctx.fillText("Points: " + points, x, y + size, maxW);
};

var playCards = function(cards) {
	cards.sort(cardSorter);
	if (cards.length == 0) {
		return;
	}

	for (let i = 0; i < cards.length; i++) {
		cards[i].renderer = new TableCardRenderer(cards, i, cards[i].img, cards[i].renderer.w, cards[i].renderer.h, ...cards[i].renderer.getPosRot(), () => tableDim[0] + tableDim[2] / 2, () => tableDim[1] + 3 * tableDim[3] / 4);
	}

	if (table.length > 0) {
		for (let card of table[table.length - 1]) {
			card.renderer.flipped = true;
		}
	}


	table.push(cards);
};

var setCardParams = function() {
	let r = width * 0.65;// / 2 * Math.sqrt(2);
	let cardH = r - width * Math.sin(32 * Math.PI / 180);
	let cardW = cardH * CARD_ASPECT;

	for (let i = 0; i < hand.length; i++) {
		hand[i].setRendererParams(i, hand.length, r, cardW, cardH);
	}

	for (let group of table) {
		for (let card of group) {
			card.setRendererParams();
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
	} else if (playButtonHovered) {
		let cards = [];
		for (let card of selected) {
			cards.push(card);
			removeCard(hand.indexOf(card));
		}
		selected = [];
		playCards(cards);
	} else {
		for (let card of selected) {
			card.renderer.selected = false;
		}
		selected = [];
	}

	document.getElementById('test').innerHTML = analyzeHand(selected, declaredCard).split(',').map(s => s.trim()).join('<br>');
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
		
		document.getElementById('test').innerHTML = analyzeHand(selected, declaredCard).split(',').map(s => s.trim()).join('<br>');
	} else {
		
	}
};

addEventListener('contextmenu', contextMenuListener);

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
	elapsedSinceLastLoop = currentTime - lastTime;
	lastTime = currentTime;

	let canvas = document.getElementById('canvas');
	let ctx = canvas.getContext('2d');

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
	for (let group of table) {
		for (let card of group) {
			card.render(ctx);
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
	drawUserInfo(ctx, playerNames[(3 + playerPosition) % 5], playerTeams[(3 + playerPosition) % 5], playerPoints[(3 + playerPosition) % 5], tableH / 16, 'end', tableX - 5, tableY + tableH / 4, tableX - 10);
	drawUserInfo(ctx, playerNames[(4 + playerPosition) % 5], playerTeams[(4 + playerPosition) % 5], playerPoints[(4 + playerPosition) % 5], tableH / 16, 'end', tableX - 5, tableY + 3 * tableH / 4, tableX - 10);

	ctx.textAlign = 'start';
	drawUserInfo(ctx, playerNames[(2 + playerPosition) % 5], playerTeams[(2 + playerPosition) % 5], playerPoints[(2 + playerPosition) % 5], tableH / 16, 'start', tableX + tableW + 5, tableY + tableH / 4, tableX - 10);
	drawUserInfo(ctx, playerNames[(1 + playerPosition) % 5], playerTeams[(1 + playerPosition) % 5], playerPoints[(1 + playerPosition) % 5], tableH / 16, 'start', tableX + tableW + 5, tableY + 3 * tableH / 4, tableX - 10);
	drawUserInfo(ctx, playerNames[playerPosition], playerTeams[playerPosition], playerPoints[playerPosition], tableH / 14, 'start', 10, height - tableH / 7 - 20);

	ctx.restore();

	// hit detection

	if (table.length > 0) {
		let handHovered = false;
		for (let card of table[table.length - 1]) {
			if (card.renderer.checkHitTargetPosition(mouseX, mouseY)) {
				handHovered = true;
				break;
			}
		}

		for (let card of table[table.length - 1]) {
			card.renderer.hovered = handHovered;
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

	// play button
	ctx.save();
	let buttonWidth = width / 8;
	let buttonHeight = buttonWidth / 3;
	if (mouseX > width - buttonWidth - 10 && mouseX < width - 10 && mouseY > height - buttonHeight - 10 && mouseY < height - 10) {
		buttonblur = buttonWidth / 10;
		playButtonHovered = true;
		pointer = true;
	} else {
		buttonblur = 0;
		playButtonHovered = false;
	}

	if (pointer) {
		$(canvas).addClass('pointer');
	} else {
		$(canvas).removeClass('pointer');
	}

	buttonblurInterp += (buttonblur - buttonblurInterp) / 30 * elapsedSinceLastLoop * animationSpeed;
	ctx.shadowBlur = buttonblurInterp;
	ctx.shadowColor = 'green';

	ctx.fillStyle = '#32cd32';
	ctx.fillRect(width - buttonWidth - 10, height - buttonHeight - 10, buttonWidth, buttonHeight);
	ctx.restore();
	ctx.save();
	ctx.fillStyle = 'white';
	ctx.font = `bold ${buttonHeight * 0.75}px Titillium Web`;
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';
	ctx.fillText('Play!', width - buttonWidth / 2 - 10, height - buttonHeight / 2 - 10, buttonWidth);
	// ctx.fillText('Declare!', width - buttonWidth / 2 - 10, height - buttonHeight / 2 - 10, buttonWidth);
	ctx.restore();

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