class ObjectMap {
	constructor() {
		this._map = new Map();
	}

	has(key) {
		return this._map.has(key.toString());
	}

	get(key) {
		return this._map.get(key.toString());
	}

	set(key, value) {
		this._map.set(key.toString(), value);
	}

	delete(key) {
		this._map.delete(key.toString());
	}

	keys() {
		return this._map.keys().map(id => id.toString());
	}

	values() {
		return this._map.values();
	}
}

module.exports = ObjectMap;