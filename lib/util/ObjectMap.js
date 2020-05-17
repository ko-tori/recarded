class ObjectMap {
	constructor(h = x => x.toString()) {
		this._map = new Map();
		this.h = h;
	}

	has(key) {
		return this._map.has(this.h(key));
	}

	get(key) {
		return this._map.get(this.h(key));
	}

	set(key, value) {
		this._map.set(this.h(key), value);
	}

	delete(key) {
		this._map.delete(this.h(key));
	}

	keys() {
		return this._map.keys();
	}

	values() {
		return this._map.values();
	}
}

module.exports = ObjectMap;