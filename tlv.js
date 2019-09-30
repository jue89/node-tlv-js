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
		if (data.next) this.next = data.next;
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
			value._parent = this;
			this._value = value;
			this.type = 'constructed';
		} else if (value instanceof Array) {
			value[0]._parent = this;
			this._value = value[0];
			for (let i = 1; i < value.length; i++) {
				value[i]._parent = this;
				value[i - 1]._next = value[i];
			}
			this.type = 'constructed';
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

	set next (next) {
		this._next = next;
		if (this._parent) {
			next._parent = this._parent;
			next._parent._updateLength();
		}
	}

	get next () {
		return this._next;
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

		if (this._parent) {
			this._parent._updateLength();
		}
	}

	static fromBuffer (buf) {
		buf = new Buf(buf);
		const tlv = new TLV();

		let tag = buf.getByte();
		tlv._class = (tag >> 6);
		tlv._type = (tag >> 5) & 0x01;
		tag = tag & 0x1f;
		if (tag === 0x1f) {
			tag = buf.getByte();
			if (tag & 0x80) {
				tag = ((tag & 0x7f) << 8) + buf.getByte();
			}
		}
		tlv.tag = tag;

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

	toBuffer () {
		let tag = (this._class << 6) + (this._type << 5);
		if (this._tag <= 30) {
			tag = Buffer.from([tag + this._tag]);
		} else if (this.tag <= 127) {
			tag = Buffer.from([tag + 0x1f, this._tag]);
		} else {
			tag = Buffer.from([tag + 0x1f, (this._tag >> 8) | 0x80, this._tag & 0xff]);
		}

		let length;
		if (this.length <= 127) {
			length = Buffer.from([this.length]);
		} else if (this.length <= 255) {
			length = Buffer.from([0x81, this.length]);
		} else {
			length = Buffer.from([0x82, this.length >> 8, this.length & 0xff]);
		}

		let value = this.value;
		if (value instanceof Array) {
			// The first element will append following TLV objects
			value = value[0].toBuffer();
		} else if (value === undefined) {
			value = Buffer.alloc(0);
		}

		// Append following TLV objects
		const data = [tag, length, value];
		if (this._next) data.push(this._next.toBuffer());

		return Buffer.concat(data);
	}
}

module.exports = TLV;
