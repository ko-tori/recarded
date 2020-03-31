const letters = [0, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const longLetters = [0, 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];
const numRanks = [0, 14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const suits = {'C': 'Clubs', 'D': 'Diamonds', 'H': 'Hearts', 'S': 'Spades', 'J': 'Joker'};
const suitRanks = {'C': 0, 'D': 1, 'H': 2, 'S': 3, 'J': 4};

class GameState {
	constructor(numDecks = 2, numRounds = 20, numPlayers = 5) {
		this.numRounds = numRounds;
		this.numPlayers = numPlayers;
		this.numDecks = numDecks;
		this.deck = new Deck(numDecks);
	}

	resetGame() {

	}
}

class Player {

}

class Stack {
	constructor() {
		this.cards = [];
	}

	addCard(card) {
		cards.push(card);
	}

	sort() {
		
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
			this.cards.push(new Card(4,1));
			this.cards.push(new Card(5,2));
		}
	}

	shuffle() {
		this.cards.sort(() => 0.5 - Math.random());
	}
}

class Card {
	constructor(suit, num) {
		this.suit = suit;
		this.num = num;
	}

	toString() {
		return letters[this.num] + this.suit;
	}
}

var gs = new GameState();
for(var i = 0; i < gs.deck.cards.length; i++) {
	document.write(gs.deck.cards[i] + " ");
}