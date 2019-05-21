class Stack {
	constructor(cards) {
		if (cards)
			this.cards = cards;
		else
			this.cards = [];
	}

	add(card) {
		this.cards.push(card);
	}

	addCards(cards) {
		for (let card of cards) {
			this.add(card);
		}
	}

	draw() {
		return this.cards.pop();
	}

	drawN(n) {
		return this.cards.splice(this.cards.length - n);
	}

	shuffle() {
		for (let i = array.length - 1; i > 0; i--) {
    		let j = Math.floor(Math.random() * (i + 1));
    		[array[i], array[j]] = [array[j], array[i]];
		}
	}
}