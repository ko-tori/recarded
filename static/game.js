const fileLetters = [0, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const levels = [null, null, '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

var levelToNum = x => {
	return x == 14 ? 1 : x;
};

var hand = [];
var table = [[], [], [], [], []];

// game information vars
var trumpCard;
var personalDeclaredCard;
var declareNumberofCards;
var declaredPlayer;
var declaredTurn;
var drawnCards = 0;
var playerPlayTurn;
var phase;

// player info
var playerNames = ['ああああああああああああああああ', 'プレーヤー・トゥー', 'Player 3', 'Player 4'];
var playerTeams = ['?', '?', '?', '?'];
var playerPoints = [0, 0, 0, 0, 0];
var playerLevels = [2, 2, 2, 2, 2];
const TEAM_ENUM = ['?', 'Defending', 'Attacking'];

// client player info
var playerPosition = 0;
var declarable;
var handAtDeclaration = [];

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

OffscreenCanvas = OffscreenCanvas || Canvas;

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

	render(ctx, ctx2) {
		// render shadow
		ctx.save();
		ctx.translate(this.tableCenterX + this.xTarget, this.tableCenterY + this.yTarget);
		ctx.rotate(this.rot);
		let w = width / 20;
		let h = w / CARD_ASPECT;
		let osc = new OffscreenCanvas(w, h);
		let tempctx = osc.getContext('2d');
		tempctx.drawImage(this.img, 0, 0, w, h);

		tempctx.globalCompositeOperation = 'source-in';

		tempctx.fillStyle = `rgba(0, 0, 0, 1)`;
		tempctx.fillRect(0, 0, w, h);

		ctx.globalAlpha = this.textAlphaInterp ** 2 / 20;
		ctx.drawImage(osc, -w / 2, -h / 2, w, h);
		ctx.restore();

		if (ctx2 && !this.flipped && this.hovered) {
			ctx = ctx2;
		}
		
		ctx.save();
		ctx.translate(this.tableCenterX + this.x, this.tableCenterY + this.y);
		ctx.rotate(this.rotInterp);
		ctx.drawImage(this.flipped ? cardBack : this.img, -this.wInterp / 2, -this.hInterp / 2, this.wInterp, this.hInterp);
		ctx.restore();

		ctx.font = '24px Titillium Web';
		ctx.fillStyle = `rgba(0, 0, 0, ${this.textAlphaInterp}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';

		if (phase == 'Play') {
			if (CENTER_HOVER) {
				ctx.fillText(analyzeHandText(this.group, trumpCard), width / 2, height / 2 + this.hInterp / 2 + 10);
			} else {
				ctx.fillText(analyzeHandText(this.group, trumpCard), this.tableCenterX, this.tableCenterY + this.hInterp / 2 + 10);
			}
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
		this.enabled = false;

		this.blur = 0;
		this.blurInterp = 0;
	}

	render(ctx) {
		let [i, n, r, w, h] = [this.i, this.n, this.r, this.w, this.h];
		this.targetOffY = 0;
		if (this.enabled) {
			if (this.selected) {
				this.targetOffY = -h / 5;
			} else if (this.hovered) {
				this.targetOffY = -h / 7;
			}
		}

		ctx.save();
		ctx.rotate(this.rotInterp);
		if (this.enabled) {
			ctx.shadowColor = '#FADA5E';
			ctx.shadowBlur = this.blurInterp;
			this.blur = this.selected ? 30 : 0;
			ctx.drawImage(this.img, this.offX - w / 2, -r + this.offY, w, h);
		} else {
			let osc = new OffscreenCanvas(w, h);
			let ctx2 = osc.getContext('2d');
			ctx2.drawImage(this.img, 0, 0, w, h);

			ctx2.globalCompositeOperation = 'source-atop';

			ctx2.fillStyle = `rgba(0, 0, 0, 0.1)`;
			ctx2.fillRect(0, 0, w, h);

			ctx.drawImage(osc, this.offX - w / 2, -r + this.offY, w, h);
		}
		ctx.restore();

		this.offX += (this.targetOffX - this.offX) / 15 * elapsedSinceLastLoop * animationSpeed;
		this.offY += (this.targetOffY - this.offY) / 15 * elapsedSinceLastLoop * animationSpeed;
		this.iInterp += (this.i - this.iInterp) / 15 * elapsedSinceLastLoop * animationSpeed;
		this.rotInterp += (this.rot - this.rotInterp) / 15 * elapsedSinceLastLoop * animationSpeed;
		if (isNaN(this.rotInterp)) {
			this.rotInterp = 0;
		}
		this.blurInterp += (this.blur - this.blurInterp) / 10 * elapsedSinceLastLoop * animationSpeed;
		if (this.blurInterp < 0.5) {
			this.blurInterp = 0;
		}
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

	render(ctx, ctx2) {
		this.renderer.render(ctx, ctx2);
	}

	checkHit(x, y) {
		return this.renderer.checkHit(x, y);
	}

	setRendererParams() {
		this.renderer.setRendererParams(arguments);
	}

	equals(other) {
		if (!other) {
			return false;
		}
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
	ctx.fillText(name + (p == declaredPlayer ? ' ★' : ''), x, y - size * 1.5, maxW);
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
		if (table[player].length > 0) {
			for (let card of table[player][table[player].length - 1]) {
				card.renderer.flipped = true;
			}
		}
	}

	table[player].push(cards);
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
	if (hovered && hovered.renderer.enabled) {
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

	if (phase == 'Play' && playerPosition == playerPlayTurn) {
		document.getElementById('selectedCards').innerHTML = analyzeHandText(selected, trumpCard).split(',').map(s => s.trim()).join('<br>');
	}
};

$('#priority-canvas').click(clickListener);

var contextMenuListener = function(e) {
	e.preventDefault();
	// if (hovered) {
	// 	removeCard(hand.indexOf(hovered));
	// 	let i = selected.indexOf(hovered);
	// 	if (i >= 0) {
	// 		selected.splice(i, 1);
	// 	}
		
	// 	document.getElementById('selectedCards').innerHTML = analyzeHandText(selected, trumpCard).split(',').map(s => s.trim()).join('<br>');
	// } else {
		
	// }
};

addEventListener('contextmenu', contextMenuListener);

var removeCardsFromHand = function(cards) {
	if (cards instanceof Card) {
		cards = [cards];
	}
	let r = [];
	for (let card of cards) {
		r.push(card);
		let i = hand.indexOf(card);
		if (i >= 0) {
			hand.splice(i, 1);
		}
	}
	
	updateHandPositions();
	return r;
};

$('#actionButton').click(e => {
	if (!buttonEnabled) {
		return;
	}
	if (currentButton == buttons.play) {
		let cards = removeCardsFromHand(selected);
		selected = [];
		playCards(cards);
	} else if (currentButton == buttons.declare) {
		if (selected.length > 0) {
			setButton('reinforce');
			let cards = removeCardsFromHand(selected);
			selected = [];
			playCardsHandler(cards, playerPosition, false);
			socket.emit('declare', {
				card: cards[0].serialize(),
				player: playerPosition,
				n: cards.length
			});

			personalDeclaredCard = cards[0];
			trumpCard = cards[0];
			declaredPlayer = playerPosition;
			declareNumberofCards = cards.length;
			declaredTurn = drawnCards;
			handAtDeclaration = hand.slice();
		}
	} else if (currentButton == buttons.overturn) {
		if (selected.length > 1) {
			let cards = removeCardsFromHand(selected);
			selected = [];
			playCardsHandler(cards, playerPosition, false);
			socket.emit('declare', {
				card: cards[0].serialize(),
				player: playerPosition,
				n: 2
			});

			trumpCard = cards[0];
			declaredPlayer = playerPosition;
			declareNumberofCards = cards.length;
			declaredTurn = drawnCards;
			handAtDeclaration = hand.slice();
		}
	} else if (currentButton == buttons.reinforce) {
		let secondCard = handAtDeclaration.find(c => c.equals(personalDeclaredCard));
		if (secondCard) {
			let cards = removeCardsFromHand(secondCard);

			playCardsHandler(cards, playerPosition, false);

			mergeDeclaredCards(playerPosition);
			
			socket.emit('declare', {
				card: cards[0].serialize(),
				player: playerPosition,
				n: 2
			});

			trumpCard = cards[0];
			declaredPlayer = playerPosition;
			declareNumberofCards = 2;
			declaredTurn = drawnCards;
			handAtDeclaration = hand.slice();
		}
	} else if (currentButton == buttons.bottomConfirm) {
		let cards = removeCardsFromHand(selected);
		selected = [];
		socket.emit('bottom', cards.map(c => c.serialize()));
	}
});

var mergeDeclaredCards = function(p) {
	let i = (p - playerPosition + 5) % 5;
	let card1 = table[i][0][0];
	let card2 = table[i][1][0];
	let group = [card1, card2];
	card1.renderer.group = group;
	card1.renderer.i = 0;
	card1.setRendererParams();
	card2.renderer.group = group;
	card2.renderer.i = 1;
	card2.setRendererParams();
	table[i][0] = group;

	table[i].splice(1, 1);
};

const buttons = {
	play: {
		text: 'Play',
		color: '#32cd32'
	},
	declare: {
		text: 'Declare',
		color: '#d15434'
	},
	overturn: {
		text: 'Overturn',
		color: '#c9281c'
	},
	reinforce: {
		text: 'Reinforce',
		color: '#bf1174'
	},
	bottomConfirm: {
		text: 'Confirm',
		color: '#32cd32'
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

var currentInfoTimeout1;
var currentInfoTimeout2;
var showInfo = function(text, duration) {
	clearTimeout(currentInfoTimeout1);
	clearTimeout(currentInfoTimeout2);

	text = '\u26A0 ' + text;
	let i = $('#infoPopup');
	i[0].innerHTML = text.replace('%t', parseInt(duration / 1000));

	let elapsed = 0;
	let f = () => {
		elapsed++;
		let timeLeft = parseInt(duration / 1000 - elapsed);
		i[0].innerHTML = text.replace('%t', timeLeft);

		if (timeLeft >= 1) {
			currentInfoTimeout1 = setTimeout(f, 1000);
		}
	};
	currentInfoTimeout1 = setTimeout(f, 1000);

	i.fadeIn();
	currentInfoTimeout2 = setTimeout(() => {
		i.fadeOut();
	}, duration);
};

var loadCardImage = function(c, file, callback) {
	let i = new Image;
	i.src = `/cards/${file}.png`;
	i.onload = callback;
	cardImgs[c] = i;
};

var init = function(callback) {
	let c = 0;

	let finish = function() {
		c++;

		if (c == 54) {
			callback();
		}
	};

	loadCardImage('J1', 'J1', finish);
	loadCardImage('J2', 'J2', finish);

	for (let suit of ['C', 'D', 'H', 'S']) {
		for (let n = 1; n <= 13; n++) {
			loadCardImage(suit + n, fileLetters[n] + suit, finish);
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
	for (let card of hand) {
		card.renderer.hovered = false;
	}
};

var deselectAll = function() {
	selected = [];
	for (let card of hand) {
		card.renderer.selected = false;
	}
};

var disableAll = function() {
	for (let card of hand) {
		card.renderer.enabled = false;
	}
};

var resetCards = function() {
	hovered = null;
	unhoverCards();
	deselectAll();
	disableAll();
};

var declareCard = function(card) {
	trumpCard = card;
	hand.sort(cardSorter);
	updateHandPositions();
};

var isCardDeclarable = card => {
	if (card.suit != 'J' &&	card.num == levelToNum(playerLevels[playerPosition])) {
		if (selected.length > 0) {
			return card.equals(selected[0]);
		} else {
			return true;
		}
	}
	return false;
}

var mainLoop = function(currentTime) {
	if (phase == 'Draw') {
		if (currentButton != buttons.reinforce) {
			if (trumpCard) {
				setButton('overturn');
				setButtonEnabled(false);
				if (declareNumberofCards == 1) {
					if (declarable) {
						// check if has pair before declaredTurn
						for (let suit of Object.keys(suits)) {
							let c = [];
							for (let card of handAtDeclaration) {
								if (card.suit == suit) {
									card.renderer.enabled = false;
									if (isCardDeclarable(card)) {
										c.push(card);
									}
								}
							}
							if (c.length >= 2) {
								for (let card of c) {
									card.renderer.enabled = true;
								}

								setButtonEnabled(selected.length > 1);
							}
						}
					}
				}
			} else {
				setButton('declare');
				if (declarable && hand.filter(c => {
						if (isCardDeclarable(c)) {
							c.renderer.enabled = true;
							return true;
						} else {
							c.renderer.enabled = false;
						}
						return false;
					}).length > 0) {
					setButtonEnabled(selected.length > 0);
				} else {
					setButtonEnabled(false);
				}
			}
		}
	} else if (phase == 'Bottom') {
		if (selected.length == 8) {
			for (let card of hand) {
				if (!card.renderer.selected) {
					card.renderer.enabled = false;
				}
			}
			setButtonEnabled(true);
		} else {
			for (let card of hand) {
				card.renderer.enabled = true;
			}
			setButtonEnabled(false);
		}
	}

	render(currentTime);
	window.requestAnimationFrame(mainLoop);
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

	for (let player of table) {
		for (let group of player) {
			for (let card of group) {
				card.render(ctx, pctx);
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
	if (!trumpCard) {
		ctx.drawImage(unknown, tableX + 5 * tableW / 12 - w / 2, tableY + h / 8, w, h);
	} else {
		ctx.drawImage(trumpCard.img, tableX + 5 * tableW / 12 - w / 2, tableY + h / 8, w, h);
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

	if (hovered && hovered.renderer.enabled) {
		$(document.body).addClass('pointer');
	} else {
		$(document.body).removeClass('pointer');
	}
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

function testDrawCard() {
	socket.emit('drawtest');
}