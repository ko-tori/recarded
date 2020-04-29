const letters = [0, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const longLetters = [0, 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];
const numRanks = [0, 14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const suits = {'C': 'Clubs', 'D': 'Diamonds', 'H': 'Hearts', 'S': 'Spades', 'J': 'Joker'};
const suitRanks = {'C': 0, 'D': 1, 'H': 2, 'S': 3, 'J': 5};
const playerdeckdict = { 5 : { 2: 20 } };
const Phases = ["Draw", "Bottom", "Play", "Score"];
const tractors = ["Pair", "Tractor", "Triple Tractor", "Quadruple Tractor", "Quintuple Tractor", "Sextuple Tractor", "Septuple Tractor", "Octuple Tractor", "Nonuple Tractor", "Decuple Tractor", "Undecuple Tractor", "Duodecuple Tractor"];
const numToSuit = ["Clubs", "Diamonds", "Hearts", "Spades"];

class GameState {
	constructor(players = [], numDecks = 2, numPlayers = 5) {
		this.players = players.map(p => new Player(p));
		this.numPlayers = numPlayers;
		this.numDecks = numDecks;
		this.numCards = playerdeckdict[numPlayers][numDecks];
		this.playerDrawTurn = 0;

		this.deck = Deck.createDeck(numDecks);
		
		this.bottom = null;

		this.playerPlayTurn = -1;
		
		this.trumpCard = null;
		this.declareNumberofCards = -1;
		this.declaredPlayer = -1;
		this.declaredTurn = -1;
		
		this.table = new Array(numPlayers).fill(0).map(() => []);

		this.phase = "Draw";
	}

	restartDraw() {
		for (let p of this.players) {
			p.hand = [];
		}

		this.deck = Deck.createDeck(this.numDecks);
	}

	drawCard() {
		let card = this.deck.drawCard();
		let player = this.playerDrawTurn;
		this.players[this.playerDrawTurn].hand.push(card);
		this.playerDrawTurn = (player + 1) % 5;
		return {
			card: card,
			player: player
		};
	}

	declare(playerNumber, card, n) {
		this.declaredPlayer = playerNumber;
		this.declareNumberofCards = n;
		this.trumpCard = Card.deserialize(card);
		this.playerPlayTurn = playerNumber;
		this.declaredTurn = this.numDecks * 54 - this.deck.cards.length;
		return this.declaredTurn;
	}

	// Puts the rest of cards into declaredPlayer hand
	giveBottom() {
		let remaining = this.deck.hand.splice(0);
		for (let card of remaining) {
			this.players[this.declaredPlayer].hand.append(card);
		}
		return remaining;
	}

	// Sets bottom and removes bottom from declared player's hand
	createBottom(cards) {
		this.bottom = cards.map(c => Card.deserialize(c));
		for (let card of cards) {
			removeCard(this.players[this.declaredPlayer].hand, card);
		}
	}

	playCards(cards) {
		// remove cards from player hand
		for(let card of cards) {
			removeCard(this.players[this.playerPlayTurn].hand, card);
		}
		// set next player
		this.playerPlayTurn = (this.playerPlayTurn + 1) % 5;
		// check if first play in round
		if (this.table.length == 0 || this.table[this.table.length - 1].length == this.numPlayers) {
			this.table.push([]);
		}
		// add cards to table
		this.table[this.table.length - 1].push([cards]);
		// check if last hand was played
		if (this.table[this.table.length - 1].length == this.numPlayers) {
			evaluateRound();
		}
		
	}

	evaluateRound() {
		// determine winner of round
		// give winner points
		// set winner as the playerPlayTurn
		console.log(analyzeHand(this.table[this.table.length - 1], this.trumpCard))
	}

	scoreRound() {

	}

	serialize() {
		return {
			players: this.players.map(p => p.serialize()),
			numDecks: this.numDecks,
			numPlayers: this.numPlayers,
			numCards: this.numCards,
			playerDrawTurn: this.playerDrawTurn,

			deck: this.deck.serialize(),

			bottom: this.bottom,

			playerPlayTurn: this.playerPlayTurn,

			trumpCard: this.trumpCard ? this.trumpCard.serialize() : null,
			declareNumberofCards: this.declareNumberofCards,
			declaredPlayer: this.declaredPlayer,
			declaredTurn: this.declaredTurn,

			table: this.table.map(player => player.map(play => play.map(card => card.serialize()))),

			phase: this.phase
		}
	}

	static deserialize(s) {
		let gs = new GameState();

		gs.players = s.players.map(p => Player.deserialize(p));
		gs.numDecks = s.numDecks;
		gs.numPlayers = s.numPlayers;

		gs.numCards = s.numCards;
		gs.playerDrawTurn = s.playerDrawTurn;

		gs.deck = Deck.deserialize(s.deck);
		
		gs.bottom = s.bottom;

		gs.playerPlayTurn = s.playerPlayTurn;
		
		gs.trumpCard = Card.deserialize(s.trumpCard);
		gs.declareNumberofCards = s.declareNumberofCards;
		gs.declaredPlayer = s.declaredPlayer;
		
		gs.table = s.table.map(player => player.map(play => play.map(card => Card.deserialize(card))));

		gs.phase = s.phase;

		return gs;
	}

	serializeForPlayer(playerNumber) {
		return {
			players: this.players.map((p, i) => p.serialize(playerNumber == i)),
			numDecks: this.numDecks,
			numPlayers: this.numPlayers,
			numCards: this.numCards,
			playerDrawTurn: this.playerDrawTurn,

			bottom: playerNumber == this.declaredPlayer ? this.bottom : null,

			playerPlayTurn: this.playerPlayTurn,

			trumpCard: this.trumpCard ? this.trumpCard.serialize() : null,
			declareNumberofCards: this.declareNumberofCards,
			declaredPlayer: this.declaredPlayer,
			declaredTurn: this.declaredTurn,

			table: this.table.map(player => player.map(play => play.map(card => card.serialize()))),

			phase: this.phase
		};
	}
}

class Player {
	constructor(name) {
		this.name = name;
		this.declarable = true;
		this.team = 0;
		this.hand = [];
		this.points = 0;
		this.level = 2;
	}

	serialize(hidden = false) {
		return {
			name: this.name,
			declarable: this.declarable,
			team: this.team,
			hand: this.hand.map(card => hidden ? null : card.serialize()),
			points: this.points,
			level: this.level
		};
	}

	static deserialize(p) {
		let r = new Player(p.name);
		r.declarable = p.declarable;
		r.team = p.team;
		r.hand = p.hand.map(c => Card.deserialize(c));
		r.points = p.points;
		r.level = p.level;
		return r;
	}

	serializeForPlayer(p) {
		return {
			name: this.name,
			declarable: this.declarable,
			team: this.team,
			hand: this.hand.map(card => card.serialize()),
			points: this.points,
			level: this.level
		};
	}
}

class Deck {
	constructor(numDecks, cards = []) {
		this.cards = cards;
		this.numDecks = numDecks;
	}

	fillDeck(decks) {
		for (var i = 0; i < decks; i++) {
			for (var s = 0; s <= 3; s++) {
				for (var n = 1; n <= 13; n++) {
					this.cards.push(new Card(Object.keys(suits)[s], n));
				}
			}
			this.cards.push(new Card("J",1));
			this.cards.push(new Card("J",2));
		}
	}

	shuffle() {
		this.cards.sort(() => 0.5 - Math.random());
	}

	drawCard() {
		if (this.cards.length == 0) {
			console.error('No cards left to draw u poo');
		}
		return this.cards.pop();
	}

	static createDeck(numDecks) {
		let d = new Deck(numDecks);
		d.fillDeck(numDecks);
		d.shuffle();
		return d;
	}

	serialize() {
		return {
			numDecks: this.numDecks,
			cards: this.cards.map(c => c.serialize())
		};
	}

	static deserialize(d) {
		if (!d) {
			return d;
		}
		return new Deck(d.numDecks, d.cards.map(c => Card.deserialize(c)));
	}
}

class Card {
	constructor(suit, num) {
		this.suit = suit;
		this.num = num;
	}

	serialize() {
		return {
			suit: this.suit,
			num: this.num
		};
	}

	static deserialize(c) {
		if (!c) {
			return c;
		}
		return new Card(c.suit, c.num);
	}

	toString() {
		if (this.suit == "J") {
			return this.num == 1 ? "J1" : "J2";
		}
		return this.suit + letters[this.num];
	}

	equals(card) {
		return (this.suit == card.suit) && (this.num == card.num);
	}
}

function removeCard(cards, card) {
	for (var i = cards.length - 1; i >= 0; i--) {
	    if (cards[i].equals(card)) {
	    	cards.splice(i, 1);
	    }
	}
}

module.exports = GameState;