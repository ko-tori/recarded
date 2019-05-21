class UnoTable extends Table {
	constructor() {
		super();
	}

	init() {
		let deck = new UnoDeck();
		this.stacks.push(deck.toStack());
	}
}