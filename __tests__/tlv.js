const TLV = require('../tlv.js');

describe('constructor', () => {
	test('set defaults', () => {
		const tlv = new TLV();
		expect(tlv.class).toEqual('universal');
		expect(tlv.tag).toBe(0);
		expect(tlv.length).toBe(0);
		expect(tlv.fullLength).toBe(2);
		expect(tlv.value).toBeInstanceOf(Buffer);
		expect(tlv.value.length).toBe(0);
	});

	test('set class', () => {
		const tlv = new TLV({class: 'private'});
		expect(tlv.class).toEqual('private');
	});

	test('set value buffer small', () => {
		const value = Buffer.alloc(1);
		const tlv = new TLV({value});
		expect(tlv.length).toBe(value.length);
		expect(tlv.fullLength).toBe(value.length + 2);
		expect(tlv.value).toBe(value);
	});

	test('set value buffer mid', () => {
		const value = Buffer.alloc(128);
		const tlv = new TLV({value});
		expect(tlv.length).toBe(value.length);
		expect(tlv.fullLength).toBe(value.length + 3);
		expect(tlv.value).toBe(value);
	});

	test('set value buffer large', () => {
		const value = Buffer.alloc(256);
		const tlv = new TLV({value});
		expect(tlv.length).toBe(value.length);
		expect(tlv.fullLength).toBe(value.length + 4);
		expect(tlv.value).toBe(value);
	});

	test('set tag small', () => {
		const tag = 1;
		const tlv = new TLV({tag});
		expect(tlv.tag).toBe(tag);
		expect(tlv.fullLength).toBe(2);
	});

	test('set tag mid', () => {
		const tag = 31;
		const tlv = new TLV({tag});
		expect(tlv.tag).toBe(tag);
		expect(tlv.fullLength).toBe(3);
	});

	test('set tag large', () => {
		const tag = 128;
		const tlv = new TLV({tag});
		expect(tlv.tag).toBe(tag);
		expect(tlv.fullLength).toBe(4);
	});

	test('set value one TLV', () => {
		const value = new TLV();
		const tlv = new TLV({value});
		expect(tlv.type).toEqual('constructed');
		expect(tlv.length).toBe(value.fullLength);
	});

	test('set value two TLV by list', () => {
		const valueSecond = new TLV();
		const valueFirst = new TLV({next: valueSecond});
		const tlv = new TLV({value: valueFirst});
		expect(tlv.length).toBe(valueSecond.fullLength + valueFirst.fullLength);
	});

	test('set value two TLV by array', () => {
		const valueSecond = new TLV();
		const valueFirst = new TLV();
		const tlv = new TLV({value: [
			valueFirst,
			valueSecond
		]});
		expect(tlv.value[0]).toBe(valueFirst);
		expect(tlv.value[1]).toBe(valueSecond);
	});

	test('override type', () => {
		const tlv = new TLV({value: new TLV(), type: 'primitive'});
		expect(tlv.type).toEqual('primitive');
	});

	test('unknown class error', () => {
		expect(() => new TLV({class: 'foo'})).toThrowError('Unknown class: foo');
	});

	test('unknown type error', () => {
		expect(() => new TLV({type: 'foo'})).toThrowError('Unknown type: foo');
	});
});
