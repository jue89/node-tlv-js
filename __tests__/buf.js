const Buf = require('../buf.js');

test('getByte', () => {
	const b = new Buf(Buffer.from([1, 2]));
	expect(b.getByte()).toBe(1);
	expect(b.getByte()).toBe(2);
	expect(() => b.getByte()).toThrowError('Out of bounds');
});

test('getSlice', () => {
	const b = new Buf(Buffer.from([1, 2, 3]));
	expect(b.getByte()).toBe(1);
	const s = b.getSlice(1);
	expect(s.length).toBe(1);
	expect(s[0]).toBe(2);
	expect(b.getByte()).toBe(3);
	expect(() => b.getSlice(1)).toThrowError('Out of bounds');
	expect(b.getSlice(0).length).toBe(0);
});

test('getRest', () => {
	const b = new Buf(Buffer.from([1, 2, 3]));
	expect(b.getByte()).toBe(1);
	const s = b.getRest();
	expect(s.length).toBe(2);
	expect(s.toString('hex')).toEqual('0203');
	expect(() => b.getByte()).toThrowError('Out of bounds');
});
