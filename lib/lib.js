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

function analyzeHand(cards, declaredCard) {
	var cTrack = new Array(54);
	cTrack.fill(0);
	var trumpNum = 0;
	var tractorName = "";
	var pairName = "";
	var singleName = "";

	if (declaredCard.suit == 'D') {
		trumpNum += 13;
	}
	if (declaredCard.suit == 'H') {
		trumpNum += 26;
	}
	if (declaredCard.suit == 'S') {
		trumpNum += 39;
	}
	if (declaredCard.suit == 'J') {
		trumpNum += 52;
	}
		
	trumpNum += declaredCard.num - 1;
		
	// console.log(trumpNum);
	
	for (i = 0; i < cards.length; i++) {
		var temp = 0;
		if (cards[i].suit == 'D') {
			temp += 13;
		}
		if (cards[i].suit == 'H') {
			temp += 26;
		}
		if (cards[i].suit == 'S') {
			temp += 39;
		}
		if (cards[i].suit == 'J') {
			temp += 52;
		}

		
		temp += cards[i].num - 1;
		cTrack[temp] += 1;

	}
	// console.log(cTrack);
	//check for big declared J1 J2 tractors
	if(cTrack[trumpNum] == 2) {
		if(cTrack[52] == 2) {
			if(cTrack[53] == 2) {
				tractorName += ", Trump Triple Tractor (Big " + letters[declaredCard.num] + "-Small Joker-Big Joker)";
			}
			else{
				tractorName += ", Trump Double Tractor (Big " + letters[declaredCard.num] + "-Small Joker)";
			}	
		}
		else{
			pairName += ", Trump Pair (Big " + letters[declaredCard.num] + ")";
			if(cTrack[53] == 2) {
				pairName += ", Trump Pair (Big Joker)";
			}
		}
	}
	else {
		if(cTrack[53] == 2){
			if(cTrack[52] == 2) {
				pairName += ", Trump Tractor (Small Joker-Big Joker)";
			}
			else {
				pairName += ", Trump Pair (Big Joker)";
			}
		}
		else if(cTrack[52] == 2){
			pairName += ", Trump Pair (Small Joker)";
		}
	}	
	if(cTrack[trumpNum] == 1){
		singleName += ", Trump Single (Big " + letters[declaredCard.num] + ")"; 
	}
	//check for the other declare pairs
	otherDeclared = returnOther(trumpNum);
	for(i = 0; i < otherDeclared.length; i++) {
		if(cTrack[otherDeclared[i]] == 2) {
			pairName += ", Trump Pair (Small " + letters[declaredCard.num] + ")";
		}
		if(cTrack[otherDeclared[i]] == 1) {
			singleName += ", Trump Single (Small " + letters[declaredCard.num] + ")";
		}
	}
	//check for pairs/tractors/single trump
	var start = trumpNum - (trumpNum % 13);
	var prefixTacker = 0;
	var holder = "";
	var acePair = false;

	for(i = start; i < start + 13; i++) {
		if (i == trumpNum) {
			i++;
			if (i == start + 13) {
				break;
			}
		}
		if (cTrack[i] == 1) {
			singleName += ", Trump Single (" + letters[i % 13 + 1] + ")"; 
		}
		if (cTrack[i] == 2) {
			if(i == start && cTrack[i + 12] == 2) {
				acePair = true;
				continue;
			}
			prefixTacker += 1;
			if(holder != "") {
				holder += "-"
			}
			holder += letters[i % 13 + 1];
			if (i == start + 12) {
				if (acePair) {
					prefixTacker += 1;
					holder += "-A";
				}
				if (prefixTacker == 1) {
					pairName += ", Trump Pair (" + holder +")";
				}
				else if (prefixTacker > 1) {
					tractorName += ", Trump " + tractors[prefixTacker - 1] + " (" + holder +")";
				}
				prefixTacker = 0;
				holder = "";
			}
		}
		else if (prefixTacker > 0) {
			if (prefixTacker == 1) {
				pairName += ", Trump Pair" + " (" + holder +")";
			}
			else if (prefixTacker > 1) {
				tractorName += ", Trump " + tractors[prefixTacker - 1] + " (" + holder +")";
			}
			prefixTacker = 0;
			holder = "";
		}
	}

	if (cTrack[52] == 1) {
		singleName += ', Trump Single (Small Joker)';
	}

	if (cTrack[53] == 1) {
		singleName += ', Trump Single (Big Joker)';
	}

	//check for pairs/tractor/single everything else
	for (x = 0; x < 4; x++) {
		acePair = false;
		prefixTacker = 0;
		holder = "";
		if (x == Math.floor(trumpNum/13)) {
			// console.log("reeee");
			x++;		
			if (x == 4) {
				break;
			}
		}
		for(i = x * 13; i <  x * 13 + 13; i++) {
			if (otherDeclared.includes(i)) {
				i++;
			}
			if (cTrack[i] == 1) {
				singleName += ", " + numToSuit[x] + " Single (" + letters[(i%13 + 1)] + ")"; 
			}
			if (cTrack[i] == 2) {
				if(i % 13 == 0 && cTrack[i + 12] == 2) {
					acePair = true;
					continue;
				}
				prefixTacker += 1;
				if(holder != "") {
					holder += "-"
				}
				holder += letters[(i%13 + 1)];
				if (i % 13 == 12) {
					if (acePair) {
						prefixTacker += 1;
						holder += "-A";
					}
					if (prefixTacker == 1) {
						pairName += ", " + numToSuit[x] +" Pair" + " (" + holder +")";
					}
					else if (prefixTacker > 1) {
						tractorName += ", " + numToSuit[x] + " " + tractors[prefixTacker - 1] + " (" + holder +")";
					}
					prefixTacker = 0;
					holder = "";
				}
			}
			else if (prefixTacker > 0) {
				if (prefixTacker == 1) {
					pairName += ", " + numToSuit[x] +" Pair" + " (" + holder +")";
				}
				else if (prefixTacker > 1) {
					tractorName += ", " + numToSuit[x] + " " + tractors[prefixTacker - 1] + " (" + holder +")";
				}
				prefixTacker = 0;
				holder = "";
			}
		}
	}

	//check to see if the first char is a , and if it is delete it
	//console.log(singleName);
	var response = tractorName + pairName + singleName;
	if (response.charAt(0) == ',') {
		response = response.slice(2)
	}
	//console.log(response);
	//console.log(pairName);
	return response
}

function actualRanks(card) {
	let actualSuitRank = suitRanks[card.suit];
	let actualNumRank = numRanks[card.num];

	if (card.suit != 'J') {
		if (card.suit == declaredCard.suit) {
			actualSuitRank = 4;
			if (card.num == declaredCard.num) {
				actualNumRank = 16;
			}
		} else if (card.num == declaredCard.num) {
			actualSuitRank = 4;
			actualNumRank = 15 + suitRanks[card.suit] / 4;
		}
	} else {
		actualNumRank = -actualNumRank;
	}

	return [actualSuitRank, actualNumRank];
}

const cardSorter = (a, b) => {
	let [srA, nrA] = actualRanks(a);
	let [srB, nrB] = actualRanks(b);

	if (srA == srB) {
		return nrA - nrB;
	}
	return srA - srB;
};