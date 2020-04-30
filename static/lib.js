const letters = [0, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const longLetters = [0, 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];
const numRanks = [0, 14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const suits = {'C': 'Clubs', 'D': 'Diamonds', 'H': 'Hearts', 'S': 'Spades', 'J': 'Joker'};
const suitRanks = {'C': 0, 'D': 1, 'S': 2, 'H': 3, 'J': 5};
const playerdeckdict = { 5 : { 2: 20 } };
const Phases = ["Draw", "Bottom", "Play", "Score"];
const adjectives = ["","","","Triple ", "Quadruple ", "Quintiple ", "Sextuple ", "Septuple ", "Octuple ", "Nonuple ", "Decuple "];
const numToSuit = ["Clubs", "Diamonds", "Hearts", "Spades"];
// You can use the above to help make readable output

function returnOther(num) {
	var listVal = [];
		// console.log(num);
	for (i = 1; i < 4; i++) {
		if (num + 13 * i < 52){
			listVal.push(num + 13 * i );
		}
		if (num - 13 * i >= 0){
			listVal.push(num - 13 * i );
		}
	}
	// console.log(listVal);
	return listVal;
}

function analyzeHand(cards, declaredCard, debug=false) {
    //gets the number value from the letter; if two numbers are 1 off from each other, they are adjacent (for the purpose of tractors)
    //var getNum = {};
    var getNum = {'A':14, '2':2 , '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'L':18, 'M':19};
    //I'm using L and M for small joker and big joker respectively (because they're next in alphabet after K)

    var getRank = {'A':14, '2':2 , '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'L':17, 'M':18};
    var tmpOut = "";
    var output2 = [];
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
    }
    
    var output = ""; //final output string
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
    
    //add singles to output first
    var i;
    for (i = 0; i < singles.length; i++){
        if (singles[i].trump == 1) {
            output += "Trump Single (" + singles[i].type + singles[i].letter + "), ";
        }
        else {
            output += singles[i].suit2 + " Single (" + singles[i].type + singles[i].letter + "), ";
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
                        output += "Trump Tractor ("  + pairs[i].type + pairs[i].letter + "-Small Joker), ";
                        tmpOut = "t2_t_16";
                        tractors.push(tmpOut);
                        //output2.push(tmpOut);
                    }
                    else if (length == 3) {
                       output += "Trump Triple Tractor ("  + pairs[i].type + pairs[i].letter + "-Small Joker-Big Joker), ";
                       tmpOut = "t3_t_16";
                       tractors.push(tmpOut);
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
                output += "Trump Tractor (";
                // output += "t2_t_17";
                // output2.push("t2_t_17");
                tractors.push("t2_t_17")
                
                for (let tmp = 0; tmp < length; tmp++) {
                    if (pairs[tmp+i].suit == "J") { 
                        if (pairs[tmp+i].letter == 'L') {
                            output += "Small Joker";
                        }
                        else {
                            output += "Big Joker";
                        }
                    }
                    if (tmp < (length-1)) {
                        output+= "-";
                    }
                }
                output += "), "
                
            }
            else if (pairs[i].trump == 1) { //it is a trump tractor
                output += "Trump " + adj + "Tractor (";
                tmpOut = "t" + length + "_t_" + getRank[pairs[i].letter];
                //output2.push(tmpOut)
                tractors.push(tmpOut)
                
                for (let n = 0; n < length; n++) {

                    output += pairs[i+n].type + pairs[i+n].letter;
                    if (n != (length-1)) {
                        output+="-"
                    }
                }
                output += "), ";
                
            }
            else { //regular (not trump) tractor
                tmpOut = "t" + length + "_" + pairs[i].suit.toLowerCase() + "_" + getRank[pairs[i].letter];
                //output2.push(tmpOut)
                tractors.push(tmpOut)
                
                output += pairs[i].suit2 + " " + adj + "Tractor (";
                for (let n = 0; n < length; n++) {
                    output += pairs[i+n].type + pairs[i+n].letter;
                    if (n != (length-1)) {
                        output+="-"
                    }
                }
                output += "), ";
                 
            }

            //remove pairs used in this tractor
            for (let k = 0; k < length; k++) {
                pairs.splice(i,1);
            }
            i--; //decrement i one after to reset position after finding a tractor
        }
    }

    tractors.sort(function (a,b) {
        if (a[1] == b[1]) {
            return parseInt(b.substring(5)) - parseInt(a.substring(5));
        }
        return a[1] > b[1] ? 1 : -1;
    });

    for (i = 0; i < tractors.length; i++) {
        tmpOut = tractors[i];
        output2.push(tmpOut);
    }

    pairs.sort((a, b) => getRank[b.letter] - getRank[a.letter]);

    //add remaining pairs to the output
    for (i = 0; i < pairs.length; i++){
        tmpOut = "p_";
        if (pairs[i].trump == 1) {
            output += "Trump Pair (" + pairs[i].type + pairs[i].letter + "), ";
            tmpOut += "t_";
            if (pairs[i].type == "Small ") {
                tmpOut += "15";
            }
            else if (pairs[i].type == "Big ") {
                tmpOut += "16";
            }
            else {
                tmpOut += getRank[pairs[i].letter];
            }   
        }
        else {
            output += pairs[i].suit2 + " Pair (" + pairs[i].type + pairs[i].letter + "), ";
            tmpOut += pairs[i].suit.toLowerCase() + "_";
            tmpOut += "" + getRank[pairs[i].letter];
        }
        // output += ", "; //remove later
        output2.push(tmpOut);
    }

    //only sorts by number value
    singles.sort(function (a,b) { 
    if (getRank[a.letter] < getRank[b.letter]) return 1;
    else return -1;
    });
    
    //singles last
    for (i = 0; i < singles.length; i++){
        tmpOut = "s_";
        if (singles[i].trump == 1) {
            output += "Trump Pair (" + pairs[i].type + pairs[i].letter + "), ";
            tmpOut += "t_";
            if (singles[i].type == "Small ") {
                tmpOut += "15";
            }
            else if (singles[i].type == "Big ") {
                tmpOut += "16";
            }
            else {
                tmpOut += getRank[singles[i].letter];
            }   
        }
        else {
            output += singles[i].suit2 + " Single (" + singles[i].type + singles[i].letter + "), ";
            tmpOut += singles[i].suit.toLowerCase() + "_";
            tmpOut += "" + getRank[singles[i].letter];
        }
        output2.push(tmpOut);
    }

    output = output.substring(0,output.length - 2);

    let objs = output2.map(o => {
        let [type, suit, n] = o.split('_');
        let order;
        if (type[0] == 's') {
            order = 0;
        } else if (type[0] == 'p') {
            order = 1;
        } else {
            order = parseInt(type[1]);
        }

        return {
            order, suit, n: parseInt(n)
        };
	});

    return {
    	text: output,
    	objs: objs
    };
}

function actualRanks(card) {
	let actualSuitRank = suitRanks[card.suit];
	let actualNumRank = numRanks[card.num];

	if (card.suit != 'J') {
		if (card.suit == trumpCard.suit) {
			actualSuitRank = 4;
			if (card.num == trumpCard.num) {
				actualNumRank = 16;
			}
		} else if (card.num == trumpCard.num) {
			actualSuitRank = 4;
			actualNumRank = 15 + suitRanks[card.suit] / 4;
		}
	} else {
		actualNumRank = -actualNumRank;
	}

	return [actualSuitRank, actualNumRank];
}

const cardSorter = (a, b) => {
	let srA, nrA, srB, nrB;
	if (phase == 'Draw' || !trumpCard) {
		srA = suitRanks[a.suit];
		nrA = numRanks[a.num];
		srB = suitRanks[b.suit];
		nrB = numRanks[b.num];
	} else {
		[srA, nrA] = actualRanks(a);
		[srB, nrB] = actualRanks(b);
	}

	if (srA == srB) {
		return nrA - nrB;
	}
	return srA - srB;
};