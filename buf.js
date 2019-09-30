class Buf {
	constructor (buf) {
		this.buf = buf;
		this.i = 0;
	}

	getByte () {
		if (this.i >= this.buf.length) throw new Error('Out of bounds');
		return this.buf[this.i++];
	}

	getSlice (cnt) {
		if (this.i + cnt > this.buf.length) throw new Error('Out of bounds');
		const s = this.buf.slice(this.i, this.i + cnt);
		this.i += cnt;
		return s;
	}

	getRest () {
		const s = this.buf.slice(this.i);
		this.i = this.buf.length;
		return s;
	}
}

module.exports = Buf;
