const Buf = require('./buf.js');

const classById = ['universal', 'application', 'context', 'private'];
const classByName = classById.reduce((acc, name, id) => {
	acc[name] = id;
	return acc;
}, {});

const typeById = ['primitive', 'constructed'];
const typeByName = typeById.reduce((acc, name, id) => {
	acc[name] = id;
	return acc;
}, {});

class TLV {
	constructor (data = {}) {
		this.class = data.class || 'universal';
		this.tag = data.tag || 0;
		this.value = data.value || Buffer.alloc(0);
		if (data.type) this.type = data.type;
		this.next = data.next;
	}

	set class (c) {
		const cId = classByName[c];
		if (cId === undefined) {
			throw new Error(`Unknown class: ${c}`);
		}
		this._class = cId;
	}

	get class () {
		return classById[this._class];
	}

	set type (t) {
		const tId = typeByName[t];
		if (tId === undefined) {
			throw new Error(`Unknown type: ${t}`);
		}
		this._type = tId;
	}

	get type () {
		return typeById[this._type];
	}

	set value (value) {
		if (value instanceof TLV) {
			this._value = value;
			this.type = 'constructed';
		} else if (value instanceof Array) {
			this._value = value[0];
			for (let i = 1; i < value.length; i++) {
				value[i - 1].next = value[i];
			}
		} else {
			this._value = value;
			this.type = 'primitive';
		}
		this._updateLength();
	}

	get value () {
		if (this._value instanceof TLV) {
			const childs = [];
			let cur = this._value;
			while (cur) {
				childs.push(cur);
				cur = cur.next;
			}
			return childs;
		} else {
			return this._value;
		}
	}

	set tag (tag) {
		this._tag = tag;
		this._updateLength();
	}

	get tag () {
		return this._tag;
	}

	_updateLength () {
		if (this._value instanceof Buffer) {
			this.length = this._value.length;
		} else if (this._value instanceof TLV) {
			this.length = 0;
			let cur = this._value;
			while (cur) {
				this.length += cur.fullLength;
				cur = cur.next;
			}
		} else {
			this.length = 0;
		}

		this.fullLength = this.length;
		if (!this._tag || this._tag < 31) {
			this.fullLength += 1;
		} else if (this._tag < 128) {
			this.fullLength += 2;
		} else {
			this.fullLength += 3;
		}
		if (this.length < 128) {
			this.fullLength += 1;
		} else if (this.length < 256) {
			this.fullLength += 2;
		} else {
			this.fullLength += 3;
		}
	}

	static fromBuffer (buf) {
		buf = new Buf(buf);
		const tlv = new TLV();

		const tag = buf.getByte();
		tlv._class = (tag >> 6);
		tlv._type = (tag >> 5) & 0x01;
		tlv._tag = tag & 0x1f;
		if (tlv._tag === 0x1f) {
			tlv._tag = buf.getByte();
			if (tlv._tag & 0x80) {
				tlv._tag = ((tlv._tag & 0x7f) << 8) + buf.getByte();
			}
		}

		let length = buf.getByte();
		if (length === 0x81) {
			length = buf.getByte();
		} else if (length === 0x82) {
			length = buf.getByte() << 8;
			length += buf.getByte();
		} else if (length >= 0x80) {
			throw new Error('Invalid length field');
		}

		if (length) {
			const value = buf.getSlice(length);
			tlv.value = (tlv.type === 'constructed') ? TLV.fromBuffer(value) : value;
		}

		const rest = buf.getRest();
		if (rest.length) {
			tlv.next = TLV.fromBuffer(rest);
		}

		return tlv;
	}
}

module.exports = TLV;
