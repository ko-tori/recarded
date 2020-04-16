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
		
		this.table = [];

		this.phase = "Draw";
	}

	drawCard() {
		this.players[this.playerDrawTurn].hand.push(this.deck.drawCard());
		this.playerDrawTurn = (this.playerDrawTurn + 1) % 5;
	}

	declare(playerNumber, card) {
		this.declaredPlayer = playerNumber;
		this.trumpCard = card;
		this.playerPlayTurn = playerNumber;
	}

	// Puts the rest of cards into declaredPlayer hand
	giveBottom() {
		for (var i = 0; i < deck.card.length; i++) {
			this.players[this.declaredPlayer].hand.append(this.deck.drawCard());
		}
	}

	// Sets bottom and removes bottom from declared player's hand
	createBottom(cards) {
		this.bottom = cards;
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

			deck: this.deck,

			bottom: this.bottom,

			playerPlayTurn: this.playerPlayTurn,

			trumpCard: this.trumpCard,
			declareNumberofCards: this.declareNumberofCards,
			declaredPlayer: this.declaredPlayer,

			table: this.table.map(round => round.map(play => play.map(card => card.serialize()))),

			phase: this.phase
		}
	}

	static deserialize(s) {
		if (!s.players) {
			s.players = [];
		}
		let gs = new GameState();

		gs.players = s.players.map(p => Player.deserialize(p));
		gs.numDecks = s.numDecks;
		gs.numPlayers = s.numPlayers;

		gs.numCards = s.numCards;
		gs.playerDrawTurn = s.playerDrawTurn;

		gs.deck = s.deck; // Deck.deserialize(s.deck);
		
		gs.bottom = s.bottom;

		gs.playerPlayTurn = s.playerPlayTurn;
		
		gs.trumpCard = s.trumpCard;
		gs.declareNumberofCards = s.declareNumberofCards;
		gs.declaredPlayer = s.declaredPlayer;
		
		gs.table = s.table;

		gs.phase = s.phase;

		return gs;
	}

	serializeForPlayer(playerNumber) {
		return this.serialize();

		var bottom8 = null;
		if (this.phase == "Play") {
			bottom8 = this.bottom;
		}
		var serializedplayers = this.players.map(player => player.serialize);
		for (var i = 0; i < this.numPlayers; i++) {
			if (i != playerNumber) {
				serializedplayers[i]["hand"] = null;
			}
		}
		return {
			"declarablePlayers": this.declarablePlayers, 
			"numPlayers": this.numPlayers, 
			"numDecks": this.numDecks, 
			"players": serializedplayers,
			"Bottom": bottom8, 
			"currentPlayer": this.currentPlayer,
			"trumpCard": this.trumpCard.serialize(),
			"declareNumberofCards": this.declareNumberofCards,
			"declaredPlayer": this.declaredPlayer,
			"phase": this.phase
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
	}

	serialize() {
		return {
			name: this.name,
			declarable: this.declarable,
			team: this.team,
			hand: this.hand.map(card => card.serialize()),
			points: this.points
		};
	}

	static deserialize(p) {
		let r = new Player(p.name);
		r.declarable = p.declarable;
		r.team = p.team;
		r.hand = p.hand.map(c => Card.deserialize(c));
		r.points = p.points;
		return r;
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
		return new Deck(d.numDecks, d.cards.map(c => Card.deserialize(c)));
	}
}

class Card {
	constructor(suit, num) {
		this.suit = suit;
		this.num = num;
	}

	serialize() {
		return {suit: this.suit, num: this.num};
	}

	static deserialize(c) {
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