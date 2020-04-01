const letters = [0, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const longLetters = [0, 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];
const numRanks = [0, 14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const suits = {'C': 'Clubs', 'D': 'Diamonds', 'H': 'Hearts', 'S': 'Spades', 'J': 'Joker'};
const suitRanks = {'C': 0, 'D': 1, 'H': 2, 'S': 3, 'J': 4};

class GameEngine {
	constructor(numDecks = 2, numRounds = 20, numPlayers = 5) {
		this.numRounds = numRounds;
		this.numPlayers = numPlayers;
		this.numDecks = numDecks;
		this.deck = new Deck(numDecks);
	}

	resetGame() {

	}
}

class DrawState {
	constructor(numDecks = 2, numRounds = 20, numPlayers = 5) {
		this.numRounds = numRounds;
		this.numPlayers = numPlayers;
		this.numDecks = numDecks;
		this.deck = new Deck(numDecks);
		this.players = [];
		for(var i = 0; i < numPlayers; i++) {
			this.players.push(new Player());
		}
		this.currentPlayer = 0;
		this.currentRound = 1;
	}

	runRound() {
		this.players[this.currentPlayer].hand.addCard(this.deck.drawCard());
		this.currentPlayer += 1;
		this.currentPlayer %= this.numPlayers;
		if (this.currentPlayer == 0) {
			this.currentRound += 1;
		}
		if (this.currentRound > this.numRounds) {
			clearInterval(startTimer);
		}
	}
}

class BottomState {

}

class PlayState {

}

class ScoreState {

}

class Player {
	constructor() {
		this.hand = new Stack();
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
		for(var i = 0; i < this.cards.length; i++) {
			str += this.cards[i] + " ";
		}
		return str;
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

	toString() {
		if (this.suit == "J") {
			return this.num == 1 ? "BigJ" : "SmallJ";
		}
		return letters[this.num] + this.suit;
	}
}

var ds = new DrawState();
var startTimer = setInterval(drawCard, 1000);
function drawCard() {
	ds.runRound();
	for(var i = 0; i < 5; i++) {
		document.getElementById("hand" + (1 + i)).innerHTML = ds.players[i].hand.toString();
	}
}