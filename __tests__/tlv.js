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

describe('fromBuffer', () => {
	test('class universal', () => {
		const tlv = TLV.fromBuffer(Buffer.from([0x00, 0x00]));
		expect(tlv.class).toEqual('universal');
	});

	test('class application', () => {
		const tlv = TLV.fromBuffer(Buffer.from([0x40, 0x00]));
		expect(tlv.class).toEqual('application');
	});

	test('class context', () => {
		const tlv = TLV.fromBuffer(Buffer.from([0x80, 0x00]));
		expect(tlv.class).toEqual('context');
	});

	test('class private', () => {
		const tlv = TLV.fromBuffer(Buffer.from([0xc0, 0x00]));
		expect(tlv.class).toEqual('private');
	});

	test('type primitive', () => {
		const tlv = TLV.fromBuffer(Buffer.from([0x00, 0x00]));
		expect(tlv.type).toEqual('primitive');
	});

	test('type constructed', () => {
		const tlv = TLV.fromBuffer(Buffer.from([0x20, 0x00]));
		expect(tlv.type).toEqual('constructed');
	});

	test('tag small', () => {
		const tlv = TLV.fromBuffer(Buffer.from([0x01, 0x00]));
		expect(tlv.tag).toBe(1);
		expect(tlv.fullLength).toBe(2);
	});

	test('tag mid', () => {
		const tlv = TLV.fromBuffer(Buffer.from([0x1f, 0x7f, 0x00]));
		expect(tlv.tag).toBe(127);
		expect(tlv.fullLength).toBe(3);
	});

	test('tag large', () => {
		const tlv = TLV.fromBuffer(Buffer.from([0x1f, 0x81, 0x02, 0x00]));
		expect(tlv.tag).toBe(0x0102);
		expect(tlv.fullLength).toBe(4);
	});

	test('value primitive small', () => {
		const tlv = TLV.fromBuffer(Buffer.from([0x00, 0x01, 0xab]));
		expect(tlv.length).toBe(1);
		expect(tlv.value.toString('hex')).toEqual('ab');
	});

	test('value primitive mid', () => {
		const buf = Buffer.concat([
			Buffer.from([0x00, 0x81, 0x80]),
			Buffer.alloc(0x80)
		]);
		const tlv = TLV.fromBuffer(buf);
		expect(tlv.length).toBe(0x80);
	});

	test('value primitive large', () => {
		const buf = Buffer.concat([
			Buffer.from([0x00, 0x82, 0x01, 0x02]),
			Buffer.alloc(0x0102)
		]);
		const tlv = TLV.fromBuffer(buf);
		expect(tlv.length).toBe(0x0102);
	});

	test('length field error', () => {
		const buf = Buffer.from([0x00, 0x80]);
		expect(() => TLV.fromBuffer(buf)).toThrowError('Invalid length field');
	});

	test('value constructed', () => {
		const tlv = TLV.fromBuffer(Buffer.from([0x20, 0x03, 0x00, 0x01, 0xef]));
		expect(tlv.length).toBe(3);
		expect(tlv.value.length).toBe(1);
		expect(tlv.value[0]).toBeInstanceOf(TLV);
		expect(tlv.value[0].value.toString('hex')).toEqual('ef');
	});

	test('mutliple childs', () => {
		const buf = Buffer.concat([
			Buffer.from([0x20, 0x04]),
			Buffer.from([0x01, 0x00]),
			Buffer.from([0x02, 0x00])
		]);
		const tlv = TLV.fromBuffer(buf);
		expect(tlv.value.length).toBe(2);
		expect(tlv.value[0].tag).toBe(0x01);
		expect(tlv.value[1].tag).toBe(0x02);
		expect(tlv.next).toBeUndefined();
	});
});
