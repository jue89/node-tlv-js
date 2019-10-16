# tlv.js

This package en- and decodes **TLV objects** as they are used for BER (Basic Encoding Rules) data structures. (But don't expect BER to be included! This package could be used to implement a BER en- and decoder.)

This is basically the foundation if you want to read X.509 certificats by hand.

For verifacation purposes there exists a handy dandy online viewer for in- and outputs of this package: The [ASN.1 JavaScript decoder](https://lapo.it/asn1js/) by Lapo Luchini.

The ruleset is described in ISO/IEC 7816. This document is your deep dive, if you don't understand the terminology used in the API description down below.


## API

```js
const TLV = require('tlv');
```

### Constructor

```js
const obj = new TLV(opts);
```

Creates a new TLV object. `opts` states the properties the object shall be initialised with. Cf. the property description below for further details.

Furthermore `opts` can have the property `inherit` which states another `TLV` instance of which the properties *class*, *tag* and *type* are inherited.


### Property: class

```js
obj.class = 'context';
const class = obj.class;
```

Sets or gets the class of the TLV object. Valid classes are: `'universal'`, `'application'`, `'context'` and `'private'`.


### Property: type

```js
obj.type = 'primitive';
const type = obj.type;
```

Sets or gets the type of the TLV object. `'primitive'` objects hold binary data. `'constructed'` objects hold further TLV objects.


### Property: tag

```js
obj.tag = 0x10;
const tag = obj.tag;
```

Sets or gets the tag of `obj`.


### Property: length and fullLength

```js
const length = obj.length;
const fullLength = obj.fullLength;
```

Gets the length in bytes. `length` is the size of the object's value. `fullLength` also include the object's header size.


### Property: value

```js
const value = obj.value
```

Gets the hold value. For primitive objects `value` returns a `Buffer` containing its value. If the TLV object is constructed, `value` is an `Array` of `TLV` instances.

```js
const int = new TLV({class: 'univeral', type: 'primitive', tag: 0x02, value: 0x42});
obj.value = int;
```

Stores `int` insided of `obj`. `obj.type` will change to constructed.

```js
const data = Buffer.from('hello');
obj.value = data;
```

Stores `data` insided of `obj`. `obj.type` will change to primitive.


### Property: next

```js
const int = new TLV({class: 'univeral', type: 'primitive', tag: 0x02, value: 0x42});
obj.next = int;
```

Stores `int` after (and not inside of) `obj`;

```js
const next = obj.next;
```

Returns the next TLV object after obj or `null` if `obj` is the last item.


### Method: toBuffer()

```js
const buf = obj.toBuffer();
```

Converts the TLV object into a `Buffer`.


### Method: is()

```js
const SEQ = new TLV({class: 'universal', type: 'constructed', tag: 0x10});
const isSeq = obj.is(SEQ);
```

`isSeq` is `true`, if `obj` has the same *class*, *type* and *tag* as `SEQ`. Value and length are not compared.


### Method: assert()

```js
const SEQ = new TLV({class: 'universal', type: 'constructed', tag: 0x10});
obj.assert(SEQ);
```

Throws an `Error`, if obj is not a *BER SEQ*.
