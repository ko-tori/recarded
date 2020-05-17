// maps Objects to Lists of socket ids

class SocketMap {
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

	getSockets(key) {
		let v = this.get(key);
		if (!v) {
			return [];
		} else {
			return v.sockets || [];
		}
	}

	getInfo(key) {
		let v = this.get(key);
		if (!v) {
			return undefined;
		} else {
			return v.info;
		}
	}

	set(key, value) {
		this._map.set(this.h(key), value);
	}

	delete(key) {
		this._map.delete(this.h(key));
	}

	push(key, value, info) {
		let v = this.get(key);
		if (v) {
			v.info = info;
			v.sockets.push(value);
		} else {
			this.set(key, {
				info: info,
				sockets: [value]
			});
		}
	}

	remove(key, value) {
		let v = this.get(key);
        if (!v) {
        	return;
        }

        v.sockets.splice(v.sockets.indexOf(value), 1);

        if (v.sockets.length == 0) {
            this.delete(key);
        }
	}

	keys() {
		return this._map.keys();
	}

	values() {
		return this._map.values();
	}

	allInfo() {
		return [...this.values()].map(v => v.info);
	}
}

module.exports = SocketMap;