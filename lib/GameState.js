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

	checkCards(cards, username) {
		let roundN = Math.max(...this.table.map(p => p.length - 1));
		let roundPlays = this.table.map(p => p[roundN]);
		let turnN = roundPlays.filter(Boolean).length % 5;

		let playingIndex = this.players.findIndex(p => p.name == username);

		if (playingIndex == -1) {
			console.log(`Warning: player '${username}' attempting play while not in game`);
			return {
				valid: false,
				reason: 'Player not in this game'
			};
		}

		if (turnN != playingIndex) {
			console.log(`Warning: player '${username}' playing out of turn`);
			return {
				valid: false,
				reason: 'Playing out of turn'
			};
		}

		let play = null;

		if (turnN == 0) {
			play = Play.analyzeInitialPlay(cards, this.trumpCard);
			// if multiple play, check other hands to see if play is valid

		} else {
			let initialPlay = roundPlays[(this.playerPlayTurn - turnN + 5) % 5];
			// check hand to see if play is valid

			// consider hand as type of initial play
			play = Play.analyzeFollowingPlay(cards, initialPlay, this.trumpCard);
		}

		return {
			play: play
			turnN: turnN,
			valid: true,
			reason: ''
		};
	}

	makePlay(play) {
		// remove cards from player hand
		for(let card of play.cards) {
				removeCard(this.players[this.playerPlayTurn].hand, card);
			}

		table[this.playerPlayTurn].push(play);

		// set next player
		this.playerPlayTurn = (this.playerPlayTurn + 1) % 5;
	}

	compareHands(initialPlay, followingPlay) {
		return false;
	}

	evaluateRound() {
		// determine winner of round
		// give winner points
		// set winner as the playerPlayTurn
		let initialPlay = this.table[this.playerPlayTurn].slice(-1)[0];
		let winningPlayer = this.playerPlayTurn;
		let totalPoints = countPoints(initialPlay);
		for (let i = 1; i < 5; i++) {
			let p = (this.playerPlayTurn + i) % 5;

			let followingPlay = this.table[p].slice(-1)[0];
			totalPoints += countPoints(followingPlay);
			if (this.compareHands(initialPlay, followingPlay)) {
				initialPlay = followingPlay;
				winningPlayer = p;
			}
		}
		
		this.playerPlayTurn = winningPlayer;
		this.players[winningPlayer].points += totalPoints;

		return {
			winningPlayer: winningPlayer,
			totalPoints: totalPoints,
			cardsLeft: this.players[0].hand.length
		};
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

			table: this.table.map(player => player.map(play => play.serialize()));

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
		
		gs.table = s.table.map(player => player.map(play => Play.deserialize(play)));

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

			table: this.table.map(player => player.map(play => Play.deserialize(play)));

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

class Play {
	constructor(cardsByOrder, isProper, suit, isTrump) {
		this.cardsByOrder = cardsByOrder;
		this.isProper = isProper;
		this.suit = suit;
		this.isTrump = isTrump;
		this.n = this.cards.length;
	}

	get cards() {
		return this.cardsByOrder.reduceRight((c, n) => c.concat(n.reduceRight((c, n) => c.concat(n))), []);
	}

	get type() {
		return this.cardsByOrder.map(c => c.length);
	}

	static analyzeInitialPlay(cards, declaredCard) {
        //gets the number value from the letter; if two numbers are 1 off from each other, they are adjacent (for the purpose of tractors)
        //var getNum = {};
        var getNum = {'A':14, '2':2 , '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'L':18, 'M':19};
        //I'm using L and M for small joker and big joker respectively (because they're next in alphabet after K)

        var getRank = {'A':14, '2':2 , '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'L':17, 'M':18};
        var tmpOut = "";
        var output2 = [];
        var originalCards = {};
        var cardsByOrder = {};
        //now change the values depending on trump number to adjust adjacency
        var trumpValue = getNum[letters[declaredCard.num]]; //the value 2-14
        var trumpLetter = letters[declaredCard.num]; //letter A-K
        getNum[trumpLetter] = 16; //change the trump number to be adjacent to small joker
        getRank[trumpLetter] = 16;
        for (let it in getNum) { //decrement all the values above the trump
            //ex. if 5 is the trump, then 6 and above are decremented so 4 is adjacent to 6
            if (getNum[it] > trumpValue) {
                getNum[it]-=1;
            }
        }
        var singles = []; //array of single cards
        var pairs = []; //array of pairs of cards
        var tractors = [];

        /*
        Hashtable, stored key->value of suit+letter->number of times it appears
        for example two ace of clubs is a key->value of CA->2
        */
        var cardCount = {};
        for (let cardIterator of cards) {
            var currentCard; //two characters, one for suit and one for letter
            if (cardIterator.suit == 'J') {
                if (cardIterator.num == 1) {
                    currentCard = cardIterator.suit + 'L';
                }
                else {
                    currentCard = cardIterator.suit + 'M';
                }
            }
            else {
                currentCard = cardIterator.suit + letters[cardIterator.num];
            }
            if (currentCard in cardCount) {
                cardCount[currentCard] += 1;
            }
            else {
                cardCount[currentCard] = 1;
            }

            originalCards[currentCard] = cardIterator;
        }
        
        var output = {};
        for (let val in cardCount) {
            var currentSuit; //full name of suit (ex. Hearts)
            var currentNum = val[1]; //the letter of the card (ex. A)
            var count = cardCount[val]; //number of times card appears (ex. 2 for a pair)
            var isTrump = 0; //0 false, 1 true
            var trumpType = "" //big or small
            if (val[0] == declaredCard.suit && val[1] == letters[declaredCard.num]) { //big trump (suit and value match)
                isTrump = 1;
                trumpType = "Big "; //the space is intentional so I can use "trumpType + card" and have it be functional regardless of whether it has a trumpType or not 
            }
            else if (val[1] == letters[declaredCard.num]) { //small trump (only value matches)
                isTrump = 1;
                trumpType = "Small "
            }
            else if (val[0] == declaredCard.suit) { //regular trump (suit matches)
                isTrump = 1;
            }
            currentSuit = suits[val[0]];

            //adds to the arrays depending on whether its a single or a pair
            var toAdd;
            /*
            trump is 0/1 for not trump/trump respectively
            suit is the single char suit of the card ("S")
            suit2 is the full name of the suit ("Spades")
            letter is the single char letter of the card ("2")
            type is the type of trump (small/big)
            */
            if (count == 1) {
                toAdd = {'trump':isTrump, 'suit':val[0], 'suit2':currentSuit, 'letter':val[1], 'type':trumpType}
                singles.push(toAdd);
            }
            else if (count == 2) {
                toAdd = {'trump':isTrump, 'suit':val[0], 'suit2':currentSuit, 'letter':val[1], 'type':trumpType}
                pairs.push(toAdd);
            }
        }

        //sort pairs by suit then numRank
        pairs.sort(function (a,b) { 
            if (a.suit == b.suit) {
                return getNum[a.letter] > getNum[b.letter] ? 1 : -1;
            } else {
                return a.suit > b.suit ? 1 : -1;
            }
        });

        //checking if tractors in pairs
        var length; //length of the tractor sequence
        var increment; //only used to 'skip' the trump number
        for (var i = 0; i < pairs.length; i++){
            length = 0;
            increment = 0;
            var jokerFlag = 0; //0 if joker found, 1 if joker not found
            //this block handles a big trump -> small joker tractor (and big trump -> small joker -> big joker)
            if (pairs[i].type == "Big ") {//if card is a big trump, check if there are small and big jokers
                for (let j = 0; j < pairs.length; j++){
                    if (pairs[j].suit == 'J' && pairs[j].letter == 'L') { //find the small joker
                        jokerFlag = 1; 
                        length = 2;
                        if (j != (pairs.length -1) && pairs[j+1].suit == 'J' && pairs[j+1].letter == 'M') { //find large joker 
                            length = 3;
                        }
                        if (length == 2) {
                            if (!cardsByOrder[2])
                                cardsByOrder[2] = [];
                            cardsByOrder[2].push([pairs[i], pairs[i], pairs[j], pairs[j]]);
                            //output2.push(tmpOut);
                        }
                        else if (length == 3) {
                           if (!cardsByOrder[3])
                                cardsByOrder[3] = [];
                           cardsByOrder[3].push([pairs[i], pairs[i], pairs[j], pairs[j], pairs[j+1], pairs[j+1]]);
                           //output2.push(tmpOut);
                        }

                        //remove the pairs used here
                        for (let k = 0; k < length; k++) {
                            pairs.splice(j,1);
                        }
                        pairs.splice(i,1);
                        break;
                    }
                }
            }
            if (pairs.length == 0) break; //if the above operation removed all the elements then exit
            if (pairs[i].letter != letters[declaredCard.num]) { //don't start looking for a tractor if the first one is a trump number
                //while the next card is of the same suit and their value is 1 higher, add to the length of the tractor
                while ((pairs[i].suit == pairs[i+length].suit) && //current suit and next suit must match
                (getNum[pairs[i].letter]+length+increment) == getNum[pairs[i+length].letter]) { //and the values in getNum must match
                    length++;
                    if (i + length >= pairs.length) { //passed the end, exit loop
                        break;
                    }
                    if ((getNum[pairs[i].letter]+length) == getNum[letters[declaredCard.num]]) { //next number is the trump number, skip it
                        increment = 1;
                    }
                }
            }

            var adj = adjectives[length]; //sets the adjective for the tractor if there is one (triple, quadruple, etc)

            if (length >= 2 && jokerFlag == 0) { //found a 2 or longer length tractor 
                if (pairs[i].suit == "J") { //trump tractor because it contains a joker
                    if (!cardsByOrder[2])
                        cardsByOrder[2] = [];
                    cardsByOrder[2].push([pairs[i], pairs[i], pairs[i+1], pairs[i+1]]);
                }
                else if (pairs[i].trump == 1) { //it is a trump tractor
                    if (!cardsByOrder[length])
                        cardsByOrder[length] = [];
                    cardsByOrder[length].push(pairs.slice(i, i + length).reduce((s, n) => s.concat([n, n]), []));
                }
                else { //regular (not trump) tractor
                    if (!cardsByOrder[length])
                        cardsByOrder[length] = [];
                    cardsByOrder[length].push(pairs.slice(i, i + length).reduce((s, n) => s.concat([n, n]), []));
                }

                //remove pairs used in this tractor
                for (let k = 0; k < length; k++) {
                    pairs.splice(i,1);
                }
                i--; //decrement i one after to reset position after finding a tractor
            }
        }

        cardsByOrder[0] = singles.map(s => [originalCards[s.suit + s.letter]]);
        cardsByOrder[1] = pairs.map(s => [originalCards[s.suit + s.letter], originalCards[s.suit + s.letter]]);

        let temp = new Array(Math.max(...Object.keys(cardsByOrder)) + 1);
        for (i = 0; i < temp.length; i++) {
            if (cardsByOrder[i]) {
                temp[i] = cardsByOrder[i];
            } else {
                temp[i] = [];
            }            
        }

        return temp;
	}

	static analyzeFollowingPlay(cards, initialPlay, declaredCard) {

	}

	static deserialize(play) {
		return new Play(play.cardsByOrder, play.isProper, play.suit, play.isTrump);
	}

	serialize() {
		return {
			cardsByOrder: this.cardsByOrder,
			isProper: this.isProper,
			suit: this.suit,
			isTrump: this.isTrump
		};
	}
}

function removeCard(cards, card) {
	for (var i = cards.length - 1; i >= 0; i--) {
	    if (cards[i].equals(card)) {
	    	cards.splice(i, 1);
	    }
	}
}

function countPoints(play) {
	let total = 0;
	for (let subplay of play) {
		for (let card of subplay) {
			if (card.num == 5) {
				total += 5;
			} else if (card.num == 10 || card.num == 13) {
				total += 10;
			}
		}
	}

	return total;
}

module.exports = GameState;