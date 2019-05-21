class GameState {
	constructor(TableClass, PlayerClass, numPlayers) {
		this.table = new TableClass();
		this.players = [];
		for (let i = 0; i < numPlayers; i++) {
			players.push(new PlayerClass());
		}
		this.currentPlayer = 0;
	}

	initGame() {
		throw Error('Not Implemented');
	}
}