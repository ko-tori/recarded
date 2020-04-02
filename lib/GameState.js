const letters = [0, 'A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
const longLetters = [0, 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];
const numRanks = [0, 14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const suits = {'C': 'Clubs', 'D': 'Diamonds', 'H': 'Hearts', 'S': 'Spades', 'J': 'Joker'};
const suitRanks = {'C': 0, 'D': 1, 'H': 2, 'S': 3, 'J': 4};
const playerdeckdict = { 5 : { 2: 20 } };
const Phases = ["Draw", "Bottom", "Play", "Score"];

class GameState {
	constructor(numDecks = 2, numPlayers = 5, startPlayer = 0, declarablePlayers = [true,true,true,true,true]) {
		
		this.numPlayers = numPlayers;
		this.numDecks = numDecks;
		this.numCards = playerdeckdict[numPlayers][numDecks];

		this.deck = new Deck(numDecks);
		this.players = [];
		for(var i = 0; i < numPlayers; i++) {
			this.players.push(new Player(declarablePlayers[i]));
		}
		this.bottom = null;

		this.currentPlayer = -1;
		
		this.trumpCard = null;
		this.declareNumberofCards = -1;
		this.declaredPlayer = -1;
		
		this.phase = "Draw";
	}

	makeHandsandBottom() {
		//make ppls hands and bottom
		for(var i = 0; i < this.numPlayers; i++) {
			for(var j = 0; j < this.numCards; j++) {

			}
		}
	}

	declare(playerNumber, card, number) {
		// set trump card
		// set firstPlayer

	}

	createBottom(cards) {

	}

	playCards(playerNumber, cards) {

	}

	isValidPlay(playerNumber, cards) {

	}

	scoreRound() {

	}

	serialize(playerNumber) {
		var bottom8 = null;
		if (this.phase == "Play") { // &&) {
			bottom8 = this.bottom;
		}
		var serializedplayers = this.players.map(player => player.serialize);
		for(var i = 0; i < this.numPlayers; i++) {
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
	constructor(declarable) {
		this.declarable;
		this.team = 2;
		this.hand = new Stack();
	}

	serialize() {
		return {
			declarable: this.declarable,
			team: this.team,
			hand: this.hand.serialze()
		};
	}
}

class Stack {
	constructor() {
		this.cards = [];
	}

	addCard(card) {
		this.cards.push(card);
	}

	sort() {
		
	}

	toString() {
		var str = "";
		var i;
		for(i = 0; i < this.cards.length - 1; i++) {
			str += this.cards[i] + " ";
		}
		str += this.cards[i];
		return str;
	}

	serialize() {
		return this.cards.map(card => card.serialize());
	}
}

class Deck extends Stack {
	constructor(numDecks) {
		super()
		this.numDecks = numDecks;
		this.fillDeck(numDecks);
		this.shuffle();
	}

	fillDeck(decks) {
		for (var i = 0; i < decks; i++) {
			for(var s = 0; s <= 3; s++) {
				for(var n = 1; n <= 13; n++) {
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
		return this.cards.pop();
	}
}

class Card {
	constructor(suit, num) {
		this.suit = suit;
		this.num = num;
	}

	serialize() {
		if (this.suit == "J") {
			return this.num == 1 ? "J1" : "J2";
		}
		return suits + letters[A];
	}

	toString() {
		return serialize();
	}
}