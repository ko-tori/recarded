class UnoGameState extends GameState {
	constructor(numPlayers) {
		super(UnoTable, UnoPlayer, numPlayers);
	}

	initGame() {
		this.table.init();
		for (let player of this.players) {
			player.hand.addCards(this.table.stacks[0].draw(7));
		}
		
	}
}