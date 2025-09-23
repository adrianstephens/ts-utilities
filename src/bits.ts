//-----------------------------------------------------------------------------
// Bit twiddling functions
//-----------------------------------------------------------------------------

// Returns the index (0-31) of the lowest set bit, or 32 if none
export function lowestSet32(x: number): number {
    return x === 0 ? 32 : 31 - Math.clz32(x & -x);
}

// Returns the index (1-32) of the highest set bit, or 0 if none
export function highestSet32(x: number): number {
	return x ? 32 - Math.clz32(x) : 0;
}

export function highestSet1024(x: number): number {
	let b = Math.floor(Math.log2(x));
	return 1n << BigInt(b) <= x ? b + 1 : b;
}

// Returns the number of set bits
export function countSet32(x: number): number {
	x = x - ((x >> 1) & 0x55555555)
	x = (x & 0x33333333) + ((x >> 2) & 0x33333333)
	return ((x + (x >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}

// Returns the index (0-31) of the nth set bit, or 32 if none
export function nthSet32(x: number, i: number): number {
	let b2 = x - ((x >> 1) & 0x55555555)
	let b4 = (b2 & 0x33333333) + ((b2 >> 2) & 0x33333333)
	let b8 = (b4 + (b4 >> 4) & 0xF0F0F0F);
	let b16 = (b8 + (b8 >> 8)) & 0xff;

	let n = 0;
	
	if (i >= b16) {
		i -= b16;
		n += 16;
	}
	b8 = (b8 >> n) & 0xff;
	if (i >= b8) {
		i -= b8;
		n += 8;
	}
	b4 = (b4 >> n) & 0x0f;
	if (i >= b4) {
		i -= b4;
		n += 4;
	}
	b2 = (b2 >> n) & 0x03;
	if (i >= b2) {
		i -= b2;
		n += 2;
	}

	if (i >= ((x >> n) & 1))
		++n;
	return n;
}

/*
const testersShift: bigint[] = [];	//32 << i
const testers:		bigint[] = [];	//1 << (32 << i)
const masks:		bigint[][] = [];

export function highestSetCached(x: bigint): number {
	if (x < 0n)
		x = ~x;

	let k = 0
	for (;;) {
		if (!testers[k]) {
			testersShift[k]	= BigInt(32 << k);
			testers[k]		= 1n << testersShift[k];
		}
		if (x < testers[k])
			break
		k++
	}

	if (k === 0)
		return highestSet32(Number(x));

	// determine length by bisection
	k--
	let i = 1 << k;
	let a = x >> testersShift[k];
	while (k--) {
		let b = a >> testersShift[k]
		if (b) {
			i += 1 << k;
			a = b;
		}
	}

	return (i + 1) * 32 - Math.clz32(Number(a));
}


export function bitcountCached(x: bigint): number {
	let k = 0;
	for (let t = x >> 32n; t;)
		t >>= BigInt(32 << k++);

	if (!masks[k]) {
		const limit = 1n << BigInt(32 << k);
		const nmasks = highestSet32(k + 5);
		masks[k] = Array.from({ length: nmasks }, (_, j) => limit / ((1n << BigInt(1 << j)) + 1n));
	}

	masks[k].forEach((mask, j) =>
		x = (x & mask) + ((x >> BigInt(1 << j)) & mask)
	);

	for (let i = masks[k].length; i < k + 5; ++i)
		x += x >> BigInt(1 << i);

	return Number(x & 0xFFFFFFFFn);
}
*/

/*
function highestSetBig32(x: bigint): number {
	let s = 0;
	let k = 0;

	for (let t = x >> 32n; t; t >>= BigInt(s)) {
		s = 32 << k++;
		x = t;
	}

	if (k) {
		while (--k) {
			const b = x >> BigInt(16 << k);
			if (b) {
				s += 16 << k;
				x = b;
			}
		}
	}
	return (s + 32) - Math.clz32(Number(x));
}
*/

function highestSetBig1024(x: bigint): number {
	let s = 0;
	let k = 0;

	for (let t = x >> 1024n; t; t >>= BigInt(s)) {
		s = 1024 << k++;
		x = t;
	}

	if (k) {
		while (--k) {
			const b = x >> BigInt(512 << k);
			if (b) {
				s += 512 << k;
				x = b;
			}
		}
	}

	return highestSet1024(Number(x)) + s;
}

export function highestSet(x: bigint|number): number {
	if (x < 0)
		x = ~x;

	return	x < 0x100000000			? highestSet32(Number(x))
		:	x <= Number.MAX_VALUE	? highestSet1024(Number(x))
		:	highestSetBig1024(BigInt(x));
}

export function lowestSet(x: number|bigint): number {
	if (typeof x === 'number') {
		x = x < 0 ? (~x & (x + 1)) : x & -x;
		return	(x < 0x100000000 ? highestSet32(x) : highestSet1024(x)) - 1;
	}
	return	highestSetBig1024(x < 0 ? (~x & (x + 1n)) : x & -x) - 1;
}

export function countSet(x: bigint|number): number {
	if (x < 0)
		x = ~x;
	if (x < 0x100000000)
		return countSet32(Number(x));

	x = BigInt(x);
	let k = 5;
	for (let t = x >> 32n; t;)
		t >>= BigInt(1 << k++);

	const n			= 1 << k;
	const limit		= 1n << BigInt(n);

	let s = 1;
	for (; s < k; s <<= 1) {
		const bi	= BigInt(s);
		const mask	= limit / ((1n << bi) + 1n);
		x = (x & mask) + ((x >> bi) & mask);
	}

	//we can add the rest with a multiply and shift (which turns out to be slower)
	//const mask = limit / ((1n << bi) - 1n);
	//x = (x * mask) >> BigInt(n - i);

	//we can skip the masking when the total can fit
	for (; s < n; s <<= 1)
		x += x >> BigInt(s);

	return Number(x & ((1n << BigInt(k)) - 1n));
}

export function nthSet(x: bigint|number, i: number): number {
	if (x < 0)
		x = ~x;
	if (x < 0x100000000)
		return nthSet32(Number(x), i);

	x = BigInt(x);
	let k = 5;
	for (let t = x >> 32n; t;)
		t >>= BigInt(1 << k++);

	const limit		= 1n << BigInt(1 << k);
	const counts: bigint[] = [];
	counts.push(x);
	
	let s = 1;
	for (; s < k; s <<= 1) {
		const bi	= BigInt(s);
		const mask	= limit / ((1n << bi) + 1n);
		x = (x & mask) + ((x >> bi) & mask);
		counts.push(x);
	}
	while (counts.length < k) {
		x += x >> BigInt(s);
		counts.push(x);
		s <<= 1;
	}

	let n = 0;
	for (let j = k; j--;) {
		const s = 1 << j;
		const b = Number((counts[j] >> BigInt(n)) & 0xffffffffn) & (s * 2 - 1);

		if (i >= b) {
			i -= b;
			n += s;
		}
	}

	return n;
}

// Returns the index of the highest clear bit
export function highestClear(x: number|bigint): number {
	return highestSet(~x);
}

// Returns the index of the lowest clear bit
export function lowestClear(x: number|bigint): number {
	return lowestSet(~x);
}

// Returns the number of clear bits
export function countClear(x: bigint|number): number {
	return countSet(~x);
}

// Clears the lowest set bit
export function clearLowest(x: bigint): bigint;
export function clearLowest(x: number): number;
export function clearLowest(x: bigint|number): bigint|number;
export function clearLowest(x: bigint|number): bigint|number {
	return typeof x === 'bigint' ? x & (x - 1n) : x & (x - 1);
}

//-----------------------------------------------------------------------------
// interfaces
//-----------------------------------------------------------------------------

export interface BitSet {
	// non-mutating methods

	// Returns true if bit 'a' is set
	test(a: number): boolean;
	// Returns true if this and other have exactly the same bits set
	equals(other: this): boolean;
	// Returns true if all bits set in 'other' are also set in this
	contains(other: this): boolean;
	// Returns true if any bits are set in both this and other
	intersects(other: this): boolean;
	// Returns the number of bits set to 1
	countSet(): number;
	// Returns the index of the 'a'th set bit
	nthSet(a: number): number;
	// Returns a new bitset with all bits flipped
	complement(): BitSet;
	// Returns a new bitset with only the bits set in both this and other
	intersect(other: this): BitSet;
	// Returns a new bitset with all bits set in either this or other
	union(other: this): BitSet;
	// Returns a new bitset with bits set in either this or other, but not both
	xor(other: this): BitSet;
	// Returns a new bitset with bits set in this but not in other
	difference(other: this): BitSet;
	// Returns the next index after 'a' that is set (or clear), or -1 if none
	next(a: number, set: boolean): number;
	// Returns an iterator over all set (or clear) bits, starting after 'from'
	where(set: boolean, from?: number, to?: number): { [Symbol.iterator](): Generator<number> };
	// Returns an iterator over all ranges of set (or clear) bits
	ranges(set?: boolean): { [Symbol.iterator](): Generator<number[]> };
	slice(from: number, to?: number): BitSet;
	[Symbol.iterator](): Generator<number>;

	//mutating methods

	// Sets bit 'a'
	set(a: number): void;
	// Clears bit 'a'
	clear(a: number): void;
	// Sets all bits in [a,b)
	setRange(a: number, b: number): this;
	// Clears all bits in [a,b)
	clearRange(a: number, b: number): this;
	// In-place versions of complement, intersect, union, xor
	selfComplement?(): this;
	selfIntersect(other: this): this;
	selfUnion(other: this): this;
	selfXor(other: this): this;
	selfDifference(other: this): this;
}

//-----------------------------------------------------------------------------
// DenseBits - a dense bitset implementation using bigint
//-----------------------------------------------------------------------------

export class DenseBits implements BitSet {

	constructor(protected bits: bigint = 0n) {
	}
	protected create(bits?: bigint): this {
		return new (this.constructor as new (bits?: bigint) => this)(bits);
	}

	static fromIndices<T extends DenseBits>(this: new (bits: bigint) => T, ...indices: number[]): T {
		let bits = 0n;
		for (const i of indices)
			bits |= 1n << BigInt(i);
		return new this(bits);
	}

	get length() {
		return highestSet(this.bits);
	}
	test(a: number) {
		return !!(this.bits & (1n << BigInt(a)));
	}
	equals(other: this): boolean {
		return this.bits === other.bits;
	}
	contains(other: this): boolean {
		return (this.bits & other.bits) === other.bits;
	}
	intersects(other: this): boolean {
		return (this.bits & other.bits) !== 0n;
	}
	countSet(): number {
		return countSet(this.bits);
	}
	nthSet(a: number): number {
		return nthSet(this.bits, a);
	}
	complement(): this {
		return this.create(~this.bits);
	}
	intersect(other: DenseBits): this {
		return this.create(this.bits & other.bits);
	}
	union(other: DenseBits): this {
		return this.create(this.bits | other.bits);
	}
	xor(other: DenseBits): this {
		return this.create(this.bits ^ other.bits);
	}
	difference(other: DenseBits): this {
		return this.create(this.bits & ~other.bits);
	}
	next(a: number, set = true): number {
		let s = this.bits >> BigInt(a + 1);
		s = set ? s & -s : (s + 1n) & ~s;
		return s ? a + highestSet(s) : -1;
	}
	where(set: boolean, from = -1, to?: number) {
		let bits = this.bits >> BigInt(from + 1);
		if (to !== undefined)
			bits &= (1n << BigInt(to - from - 1)) - 1n;
		return {
			*[Symbol.iterator](): Generator<number> {
				while (bits) {
					const i = highestSet(set ? bits & -bits : (bits + 1n) & ~bits);
					from += i;
					yield from;
					bits >>= BigInt(i);
				}
			}
		};
	}
	ranges(set = true) {
		let bits = this.bits;
		return {
			*[Symbol.iterator](): Generator<number[]> {
				let offset = 0;
				while (bits) {
					const i = highestSet(bits & -bits);
					if (!set && offset + i > 1)
						yield [offset ? offset - 1 : 0, offset + i - 1];
					bits >>= BigInt(i);
					const j = highestSet(~bits & (bits + 1n));
					bits >>= BigInt(j);
					if (set)
						yield [offset + i - 1, offset + i + j - 1];
					offset += i + j;
				}
			}
		};
	}

	*[Symbol.iterator](): Generator<number> {
		yield* this.where(true);
	}

	toSparse(): SparseBits2 {
		const sparse: Record<number, number> = {};
		for (let bits = this.bits, i = 0; bits; bits >>= 32n, i++) {
			const v = Number(bits & 0xffffffffn);
			if (v)
				sparse[i] = v;
		}
		return SparseBits2.fromEntries(sparse, false);
	}

	slice(from: number, to?: number): BitSet {
		return to === undefined
			? this.create(this.bits >> BigInt(from))
			: this.create(this.bits >> BigInt(from) & ((1n << BigInt(to - from)) - 1n));
	}

	// mutating methods

	protected setMask(m: bigint) {
		this.bits |= m;
	}
	protected clearMask(m: bigint) {
		this.bits &= ~m;
	}
	set(a: number) {
		this.setMask(1n << BigInt(a));
	}
	clear(a: number) {
		this.clearMask(1n << BigInt(a));
	}
	setRange(a: number, b: number) {
		this.setMask((1n << BigInt(b)) - (1n << BigInt(a)));
		return this;
	}
	clearRange(a: number, b: number) {
		this.clearMask((1n << BigInt(b)) - (1n << BigInt(a)));
		return this;
	}
	selfComplement(): this {
		this.bits = ~this.bits;
		return this;
	}
	selfIntersect(other: DenseBits): this {
		this.bits &= other.bits;
		return this;
	}
	selfUnion(other: DenseBits): this {
		this.bits |= other.bits;
		return this;
	}
	selfXor(other: DenseBits): this {
		this.bits ^= other.bits;
		return this;
	}
	selfDifference(other: DenseBits): this {
		this.bits &= ~other.bits;
		return this;
	}
};

//-----------------------------------------------------------------------------
// DenseBits32 - a dense bitset implementation using Uint32Array
//-----------------------------------------------------------------------------

export class DenseBits32 implements BitSet {
	constructor(protected bits: Uint32Array = new Uint32Array(1)) {
	}
	protected create(bits?: Uint32Array): this {
		return new (this.constructor as new (bits?: Uint32Array) => this)(bits);
	}

	static fromIndices<T extends DenseBits>(this: new (bits: Uint32Array) => T, ...indices: number[]): T {
		const max = Math.max(...indices);
		const bits = new Uint32Array(Math.ceil((max + 1) / 32));
		for (const i of indices)
			bits[i >>> 5] |= 1 << (i & 31);
		return new this(bits);
	}

	get length() {
		const n = this.bits.length;
		return highestSet32(this.bits[n - 1]) + (n - 1) * 32;
	}
	test(a: number) {
		return !!(this.bits[a >>> 5] & (1 << (a & 31)));
	}
	equals(other: this): boolean {
		if (this.bits.length !== other.bits.length)
			return false;
		for (let i = 0; i < this.bits.length; i++) {
			if (this.bits[i] !== other.bits[i])
				return false;
		}
		return true;
	}
	contains(other: this): boolean {
		return other.bits.every((b, i) => (b & this.bits[i]) === b);
	}
	intersects(other: this): boolean {
		return this.bits.some((b, i) => (b & other.bits[i]) !== 0);
	}
	countSet(): number {
		return this.bits.reduce((a, b) => a + countSet32(b), 0);
	}
	nthSet(a: number): number {
		for (let i = 0; i < this.bits.length; i++) {
			const c = countSet32(this.bits[i]);
			if (a < c)
				return i * 32 + nthSet32(this.bits[i], a);
			a -= c;
		}
		return -1;
	}
	complement(): this {
		return this.create(this.bits.map(b => ~b));
	}
	intersect(other: DenseBits32): this {
		return this.create(this.bits.map((b, i) => b & other.bits[i]));
	}
	union(other: DenseBits32): this {
		if (other.bits.length > this.bits.length)
			return this.create(other.bits.map((b, i) => b | this.bits[i]));
		return this.create(this.bits.map((b, i) => b | other.bits[i]));
	}
	xor(other: DenseBits32): this {
		if (other.bits.length > this.bits.length)
			return this.create(other.bits.map((b, i) => b ^ this.bits[i]));
		return this.create(this.bits.map((b, i) => b ^ other.bits[i]));
	}
	difference(other: DenseBits32): this {
		return this.create(this.bits.map((b, i) => b & ~other.bits[i]));
	}
	next(a: number, set = true): number {
		++a;
		const xor = set ? 0 : -1;
		for (let i = a >>> 5; i < this.bits.length; i++) {
			let b = this.bits[i] ^ xor;
			if (b) {
				if (i === (a >>> 5)) {
					b &= -(1 << (a & 31));
					if (!b)
						continue;
				}
				return i * 32 + lowestSet32(b);
			}
		}
		return -1;
	}
	where(set: boolean, from = -1, to?: number) {
		const bits = this.bits;
		++from;
		to = to === undefined ? bits.length * 32 : Math.min(to, bits.length * 32);
		return {
			*[Symbol.iterator](): Generator<number> {
				const xor = set ? 0 : -1;
				const end = (to + 31) >>> 5;
				for (let i = from >>> 5; i < end; i++) {
					let b = bits[i] ^ xor;
					if (i === (from >>> 5))
						b &= -(1 << (from & 31));
					if (i === end - 1)
						b &= (1 << (to & 31)) - 1;
					while (b) {
						yield i * 32 + lowestSet32(b);
						b = b & (b - 1);
					}
				}
			}
		};
	}
	ranges(set = true) {
		const bits = this.bits;
		return {
			*[Symbol.iterator](): Generator<number[]> {
				let start = -1, end = 0;
				for (let i = 0; i < bits.length; i++) {
					let b = bits[i];
					const c0 = +i * 32;

					while ((start < 0 ? b : ~b) !== 0) {
						if (start === -1) {
							start = c0 + lowestSet32(b);
							if (!set && end != start)
								yield [end, start];
							end = -1;
							b = b | (b - 1);
						} else {
							end = c0 + lowestSet32(~b);
							if (set)
								yield [start, end];
							start = -1;
							b = b & (b + 1);
						}
					}
				}
				if (set) {
					if (start >= 0)
						yield [start, bits.length * 32];
				} else {
					yield [end, Infinity];
				}
			}
		};
	}

	*[Symbol.iterator](): Generator<number> {
		yield* this.where(true);
	}

	toSparse(): SparseBits2 {
		const sparse = Object.fromEntries(Array.from(this.bits.entries()).filter(([_, v]) => v));
		return SparseBits2.fromEntries(sparse, false);
	}

	slice(from: number, to?: number): BitSet {
		to = to === undefined ? this.bits.length * 32 : Math.min(to, this.bits.length * 32);
		const fromi = from >>> 5, toi = (to + 31) >>> 5;

		const shift = from & 31;
		const bits = shift === 0
			? this.bits.slice(fromi, toi)
			: this.bits.subarray(fromi, toi).map((b, i) => (b >>> shift) | (this.bits[fromi + i + 1] << (32 - shift)));

		const maskBits = (to - from) & 31;
		if (maskBits)
			bits[bits.length - 1] &= (1 << maskBits) - 1;

		return this.create(bits);
	}

	// mutating methods

	protected setMask(i: number, m: number) {
		if (i >= this.bits.length) {
			const bits = new Uint32Array(i + 1);
			bits.set(this.bits);
			this.bits = bits;
		}
		this.bits[i] |= m;
	}
	protected clearMask(i: number, m: number) {
		if (i < this.bits.length)
			this.bits[i] &= ~m;
	}
	set(a: number) {
		this.setMask(a >>> 5, 1 << (a & 31));
	}
	clear(a: number) {
		this.clearMask(a >>> 5, 1 << (a & 31));
	}
	setRange(a: number, b: number) {
		const ai = a >>> 5, bi = b >>> 5;
		if (ai === bi) {
			this.setMask(ai, (1 << (b & 31)) - (1 << (a & 31)));
		} else {
			this.setMask(bi, (1 << (b & 31)) - 1);
			this.setMask(ai, -(1 << (a & 31)));
			for (let i = ai + 1; i < bi; i++)
				this.bits[i] = -1;
		}
		return this;
	}
	clearRange(a: number, b: number) {
		const ai = a >>> 5, bi = b >>> 5;
		if (ai < this.bits.length) {
			if (ai === bi) {
				this.clearMask(ai, (1 << (b & 31)) - (1 << (a & 31)));
			} else {
				this.clearMask(ai, -(1 << (a & 31)));
				if (bi >= this.bits.length) {
					this.bits = this.bits.slice(0, ai + 1);
				} else {
					for (let i = ai + 1; i < bi; i++)
						this.bits[i] = 0;
					this.clearMask(bi, (1 << (b & 31)) - 1);
				}
			}
		}
		return this;
	}
	selfComplement(): this {
		this.bits = this.bits.map(b => ~b);
		return this;
	}
	selfIntersect(other: DenseBits32): this {
		this.bits = this.bits.map((b, i) => b & other.bits[i]);
		return this;
	}
	selfUnion(other: DenseBits32): this {
		this.bits = other.bits.length > this.bits.length
			? other.bits.map((b, i) => b | this.bits[i])
			: this.bits.map((b, i) => b | other.bits[i]);
		return this;
	}
	selfXor(other: DenseBits32): this {
		this.bits = other.bits.length > this.bits.length
			? other.bits.map((b, i) => b ^ this.bits[i])
			: this.bits.map((b, i) => b ^ other.bits[i]);
		return this;
	}
	selfDifference(other: DenseBits32): this {
		this.bits = this.bits.map((b, i) => b & ~other.bits[i]);
		return this;
	}
	clean() {
		let i = this.bits.length;
		while (i-- && this.bits[i] === 0)
			;
		this.bits = this.bits.slice(0, i + 1);
		return this;
	}
};

//-----------------------------------------------------------------------------
// SparseBits - a sparse bitset where each entry in the 'bits' array represents 32 bits
//-----------------------------------------------------------------------------

function sparseFromIndices(indices: number[]) {
	const bits: number[] = [];
	for (const i of indices)
		bits[i >> 5] |= 1 << (i & 0x1f);
	return bits;
}

function sparseCopyUndefined(bits: number[], other: number[], xor = 0) {
	for (const i in other) {
		if (bits[i] === undefined)
			bits[i] = other[i] ^ xor;
	}
	return bits;
}

function sparseDeleteUndefined(bits: number[], other: number[]) {
	for (const i in bits) {
		if (other[i] === undefined)
			delete bits[i];
	}
	return bits;
}

function sparseClean(bits: number[], undef = 0) {
	for (const i in bits) {
		if (bits[i] === undef)
			delete bits[i];
	}
}

function sparseTest(bits: number[], a: number, undef = 0): boolean {
	return !!((bits[a >> 5] ?? undef) & (1 << (a & 0x1f)));
}

function sparseSetMask(bits: number[], i: number, m: number, undef = 0) {
	if (bits[i] !== undefined)
		bits[i] |= m;
	else if (!undef)
		bits[i] = m;
}
function sparseClearMask(bits: number[], i: number, m: number, undef = 0) {
	if (bits[i] !== undefined)
		bits[i] &= ~m;
	else if (undef)
		bits[i] = ~m;
}

function sparseSetRange(bits: number[], a: number, b: number, undef = 0) {
	let i = a >> 5, j = b >> 5;
	if (i === j) {
		sparseSetMask(bits, i, (1 << (b & 0x1f)) - (1 << (a & 0x1f)), undef);
	} else {
		sparseSetMask(bits, i++, -(1 << (a & 0x1f)), undef);
		if (undef) {
			while (i < j)
				delete bits[i++];
		} else {
			while (i < j)
				bits[i++] = -1;
		}
		sparseSetMask(bits, i, (1 << (b & 0x1f)) - 1, undef);
	}
}
function sparseClearRange(bits: number[], a: number, b: number, undef = 0) {
	let i = a >> 5, j = b >> 5;
	if (i === j) {
		sparseClearMask(bits, i, (1 << (b & 0x1f)) - (1 << (a & 0x1f)), undef);
	} else {
		sparseClearMask(bits, i++, -(1 << (a & 0x1f)), undef);
		if (!undef) {
			while (i < j)
				delete bits[i++];
		} else {
			while (i < j)
				bits[i++] = 0;
		}
		sparseClearMask(bits, i, (1 << (b & 0x1f)) - 1, undef);
	}
}

function sparseCountSet(bits: number[]): number {
	let count = 0;
	for (const i in bits)
		count += countSet32(bits[i]);
	return count;
}

function sparseNthSet(bits: number[], a: number, undef = 0): number {
	if (undef === 0) {
		for (const i in bits) {
			const v = bits[i];
			const n = countSet32(v);
			if (a < n)
				return (+i << 5) + nthSet32(v, a);
			a -= n;
		}
	} else {
		let prev = 0;
		for (const i in bits) {
			const m = (+i - prev) << 5;
			if (a < m)
				return (prev << 5) + a;
			a -= m;

			const v = bits[i];
			const n = countSet32(v);
			if (a < n)
				return (+i << 5) + nthSet32(v, a);
			a -= n;
			prev = +i + 1;
		}
	}
	return -1;
}

function sparseComplement(bits: number[]): number[] {
	return bits.map(b => ~b);
}
function sparseIntersect(bits: number[], other: number[]): number[] {
	const result: number[] = [];
	for (const i in bits) {
		if (other[i] !== undefined) {
			result[i] = bits[i] & other[i];
		}
	}
	return result;
}
function sparseUnion(bits: number[], other: number[]): number[] {
	const result: number[] = [];
	for (const i in bits) {
		if (other[i] !== undefined) {
			result[i] = bits[i] | other[i];
		}
	}
	return result;
}
function sparseXor(bits: number[], other: number[]): number[] {
	const result: number[] = [];
	for (const i in bits) {
		if (other[i] !== undefined) {
			result[i] = bits[i] ^ other[i];
		}
	}
	return result;
}
function sparseDifference(bits: number[], other: number[]): number[] {
	const result: number[] = [];
	for (const i in bits) {
		if (other[i] !== undefined) {
			result[i] = bits[i] & ~other[i];
		}
	}
	return result;
}

function sparseSelfComplement(bits: number[]) {
	for (const i in bits)
		bits[i] = ~bits[i];
	return bits;
}
function sparseSelfIntersect(bits: number[], other: number[]) {
	for (const i in bits)
		if (other[i] !== undefined)
			bits[i] &= other[i];
	return bits;
}
function sparseSelfUnion(bits: number[], other: number[]) {
	for (const i in bits)
		if (other[i] !== undefined)
			bits[i] |= other[i];
	return bits;
}
function sparseSelfXor(bits: number[], other: number[]) {
	for (const i in bits)
		if (other[i] !== undefined)
			bits[i] ^= other[i];
	return bits;
}
function sparseSelfDifference(bits: number[], other: number[]) {
	for (const i in bits)
		if (other[i] !== undefined)
			bits[i] &= ~other[i];
	return bits;
}

function sparseEquals(bits: number[], other: number[]): boolean {
	const ka = Object.keys(bits), kb = Object.keys(other);
	if (ka.length !== kb.length)
		return false;
	for (const k of ka) {
		if (bits[+k] !== other[+k])
			return false;
	}
	return true;
}

function sparseIntersects(bits: number[], other: number[], undef = 0): boolean {
	for (const i in bits) {
		if ((bits[i] & (other[i] ?? undef)))
			return true;
	}
	return false;
}

function sparseContains(bits: number[], other: number[], undef = 0): boolean {
	for (const i in other) {
		if (other[i] & ~(bits[i] ?? undef))
			return false;
	}
	return true;
}

function sparseNext(bits: number[], from: number, set = true, undef = 0): number {
	++from;
	const from32	= from >> 5;
	const fromM		= 1 << (from & 0x1f);

	if (undef ? !set : set) {
		for (const i in bits) {
			if (+i >= from32) {
				const v = (bits[i] ^ undef) & (+i === from32 ? -fromM : -1);
				if (v)
					return (+i << 5) + lowestSet32(v);
			}
		}
		return -1;

	} else  {
		if (bits[from32] === undefined)
			return from;

		let i = from32;
		let v = (bits[i] ^ undef) | (fromM - 1);
		while (!v) {
			if (bits[++i] === undefined)
				break;
			v = bits[i] ^ undef;
		}
		return (i << 5) + lowestSet32(~v);
	}
}

function *sparseWhere(bits: number[], set: boolean, from = -1, to?: number, undef = 0) {
	++from;
	const from32	= from >> 5;
	const to32		= to === undefined ? Infinity : to >> 5;
	const fromM		= 1 << (from & 0x1f);
	const toM		= to === undefined ? 0 : 1 << (to & 0x1f);

	function sub(i: number, v: number) {
		while (v) {
			yield (i << 5) + lowestSet32(v);
			v &= v - 1;
		}
	}

	if (undef ? !set : set) {
		for (const k in bits) {
			const i = +k;
			if (i >= to32)
				break;
			if (i >= from32) {
				let v = bits[i] ^ undef;
				if (i === from32)
					v &= -fromM;
				if (i === to32)
					v &= (toM - 1);
				while (v) {
					yield (i << 5) + lowestSet32(v);
					v = v & (v - 1);
				}
			}
		}

	} else  {
		if (to32 > from32) {
			for (let v = ((bits[from32] ?? undef) ^ ~undef) & -fromM; v; v = v & (v - 1))
				yield (from32 << 5) + lowestSet32(v);

			for (let i = from32 + 1; i < to32; i++) {
				for (let v = ((bits[i] ?? undef) ^ ~undef); v; v = v & (v - 1))
					yield (i << 5) + lowestSet32(v);
			}
			for (let v = ((bits[to32] ?? undef) ^ ~undef) & (toM - 1); v; v = v & (v - 1))
				yield (to32 << 5) + lowestSet32(v);

		} else if (to32 === from32) {
			for (let v = ((bits[from32] ?? undef) ^ ~undef) & (toM - fromM); v; v = v & (v - 1))
				yield (from32 << 5) + lowestSet32(v);
		}

	}
}

function *sparseRanges(bits: number[], set: boolean, undef = 0) {
	let start = -1, end = 0;
	let other = undef ? set : !set;

	for (const i in bits) {
		let b = bits[i] ^ undef;
		const c0 = +i * 32;

		while ((start < 0 ? b : ~b) !== 0) {
			if (start === -1) {
				start = c0 + lowestSet32(b);
				if (other && end != start)
					yield [end, start];
				end = -1;
				b = b | (b - 1);
			} else {
				end = c0 + lowestSet32(~b);
				if (!other)
					yield [start, end];
				start = -1;
				b = b & (b + 1);
			}
		}
		if (start >= 0 && bits[+i + 1] === undefined) {
			if (!other)
				yield [start, c0 + 32];
			start = -1;
		}
	}
	if (other)
		yield [end, Infinity];
}

function sparseSlice(bits: number[], from: number, to?: number) {
	const from32	= from >> 5;
	const to32		= to === undefined ? Infinity : to >> 5;
	const fromM		= 1 << (from & 0x1f);
	const toM		= to === undefined ? 0 : 1 << (to & 0x1f);

	const result: number[] = [];

	for (const i in bits) {
		const idx = +i;
		if (idx >= from32) {
			if (idx > to32)
				break;

			let b = bits[i];
			if (idx === from32)
				b &= -fromM;
			if (idx === to32)
				b &= toM - 1;

			if (b !== 0)
				result[i] = b;
		}
	}
	
	return result;
}

// Extract constructor parameters after the first (bits) parameter
type ExtraParams<T> = T extends new (bits: number[], ...args: infer P) => any ? P : never;

export class SparseBits implements BitSet {
	constructor(protected bits: number[] = []) {
	}

	protected create(bits: number[] = []): this {
		return new (this.constructor as new (bits: number[]) => this)(bits);
	}

	static fromEntries<T extends SparseBits>(this: new (bits: number[], ...extra: any[]) => T, entries: Record<number, number> | [number, number][], ...extra: any[]): T {
		const dest: number[] = [];
		if (Array.isArray(entries)) {
			for (const [k, v] of entries)
				dest[k] = v;
		} else {
			for (const [k, v] of Object.entries(entries))
				dest[+k] = v;
		}
		return new this(dest, ...extra);
	}

	static fromIndices<T extends SparseBits>(this: new (bits: number[], ...extra: any[]) => T, ...indices: number[]): T;
	static fromIndices<T extends SparseBits>(this: new (bits: number[], ...extra: any[]) => T, indices: number[], ...extra: ExtraParams<T>): T;
	static fromIndices<T extends SparseBits>(this: new (bits: number[], ...extra: any[]) => T, indicesOrFirst: number | number[], ...rest: any[]): T {
		return Array.isArray(indicesOrFirst)
			? new this(sparseFromIndices(indicesOrFirst), ...rest)
			: new this(sparseFromIndices([indicesOrFirst, ...rest]));
	}

	copy(): this {
		return this.create(this.bits.slice());
	}

	empty(): boolean {
		for (const i in this.bits) {
			if (this.bits[i] !== 0)
				return false;
		}
		return true;
	}
	keys() {
		return Object.keys(this.bits).map(k => +k);
	}
	entries(): [number, number][] {
		return Object.entries(this.bits).map(([k, v]) => [+k, v]);
	}
	test(a: number): boolean {
		return sparseTest(this.bits, a);
	}
	equals(other: this): boolean {
		return sparseEquals(this.bits, other.bits);
	}
	contains(other: SparseBits): boolean {
		return sparseContains(this.bits, other.bits);
	}
	intersects(other: SparseBits): boolean {
		return sparseIntersects(this.bits, other.bits);
	}
	countSet(): number {
		return sparseCountSet(this.bits);
	}
	nthSet(a: number): number {
		return sparseNthSet(this.bits, a);
	}
	complement() {
		return new SparseBits2(sparseComplement(this.bits), true);
	}
	intersect(other: SparseBits): this {
		return this.create(sparseIntersect(this.bits, other.bits));
	}
	union(other: SparseBits): this {
		return this.create(sparseCopyUndefined(sparseCopyUndefined(sparseUnion(this.bits, other.bits), other.bits), this.bits));
	}
	xor(other: SparseBits): this {
		return this.create(sparseCopyUndefined(sparseCopyUndefined(sparseXor(this.bits, other.bits), other.bits, -1), this.bits, -1));
	}
	difference(other: this): BitSet {
		return this.create(sparseCopyUndefined(sparseDifference(this.bits, other.bits), this.bits));
	}
	next(from: number, set = true): number {
		return sparseNext(this.bits, from, set);
	}
	where(set: boolean, from = -1, to?: number) {
		return {
			[Symbol.iterator]: () => sparseWhere(this.bits, set, from, to)
		};
	}
	ranges(set = true) {
		return {
			[Symbol.iterator]: () => sparseRanges(this.bits, set)
		};
	}
	*[Symbol.iterator](): Generator<number> {
		yield* sparseWhere(this.bits, true, -1);
	}

	clean(): this {
		sparseClean(this.bits);
		return this;
	}
	toDense(): DenseBits {
		let bits = 0n;
		for (const i in this.bits)
			bits |= BigInt(this.bits[i]) << BigInt(+i * 32);
		return new DenseBits(bits);
	}
	slice(from: number, to?: number): BitSet {
		return this.create(sparseSlice(this.bits, from, to));
	}

	//mutating methods

	set(a: number) {
		sparseSetMask(this.bits, a >> 5, 1 << (a & 0x1f));
	}
	clear(a: number) {
		sparseClearMask(this.bits, a >> 5, 1 << (a & 0x1f));
	}
	setRange(a: number, b: number) {
		sparseSetRange(this.bits, a, b);
		return this;
	}
	clearRange(a: number, b: number) {
		sparseClearRange(this.bits, a, b);
		return this;
	}
	selfIntersect(other: SparseBits): this {
		sparseSelfIntersect(this.bits, other.bits);
		sparseDeleteUndefined(this.bits, other.bits);
		return this;
	}
	selfUnion(other: SparseBits): this {
		sparseCopyUndefined(sparseSelfUnion(this.bits, other.bits), other.bits);
		return this;
	}
	selfXor(other: SparseBits): this {
		sparseCopyUndefined(sparseSelfXor(this.bits, other.bits), other.bits);
		return this;
	}
	selfDifference(other: this): this {
		sparseSelfDifference(this.bits, other.bits);
		return this;
	}
};

//-----------------------------------------------------------------------------
// SparseBits2 as above, with 'undef' indicating whether undefined entries are treated as 0 or 0xffffffff
//-----------------------------------------------------------------------------

export class SparseBits2 extends SparseBits {
	protected undef: number;

	constructor(bits: number[] = [], initial = false) {
		super(bits);
		this.undef = initial ? -1 : 0;
	}

	protected create(bits: number[] = [], init?: boolean): this {
		return new (this.constructor as new (bits: number[], init?: boolean) => this)(bits, init);
	}

	copy(): this {
		return this.create(this.bits.slice(), !!this.undef);
	}
	empty(): boolean {
		return !this.undef && super.empty();
	}

	test(a: number): boolean {
		return sparseTest(this.bits, a, this.undef);
	}

	equals(other: this): boolean {
		return this.undef === other.undef && sparseEquals(this.bits, other.bits);
	}
	contains(other: SparseBits2): boolean {
		if (other.undef && !this.undef)
			return false;
		return sparseContains(this.bits, other.bits, this.undef);
	}

	intersects(other: SparseBits2): boolean {
		if (this.undef)
			return !!other.undef || sparseIntersects(other.bits, this.bits, this.undef);
		return sparseIntersects(this.bits, other.bits, other.undef);
	}

	nthSet(a: number): number {
		return sparseNthSet(this.bits, a, this.undef);
	}
	complement(): this {
		return this.create(sparseComplement(this.bits), this.undef === 0);
	}
	intersect(other: SparseBits2): this {
		const bits = sparseIntersect(this.bits, other.bits);
		if (other.undef)
			sparseCopyUndefined(bits, this.bits);
		if (this.undef)
			return this.create(sparseCopyUndefined(bits, other.bits), !!other.undef);
		return this.create(bits, false);
	}
	union(other: SparseBits2): this {
		const bits = sparseUnion(this.bits, other.bits);
		if (!other.undef)
			sparseCopyUndefined(bits, this.bits);
		if (this.undef)
			return this.create(bits, true);
		return this.create(sparseCopyUndefined(bits, other.bits), !!other.undef);
	}
	xor(other: SparseBits2): this {
		return this.create(sparseCopyUndefined(sparseCopyUndefined(sparseXor(this.bits, other.bits), other.bits, this.undef), this.bits, other.undef), !!(this.undef ^ other.undef));
	}
	difference(other: SparseBits2): BitSet {
		const bits = sparseDifference(this.bits, other.bits);
		if (!other.undef) {
			sparseCopyUndefined(bits, this.bits);
			return this.create(bits, !!this.undef);
		}
		if (this.undef)
			sparseCopyUndefined(bits, other.bits, -1);
		return this.create(bits, false);
	}
	next(from: number, set = true): number {
		return sparseNext(this.bits, from, set, this.undef);
	}
	where(set: boolean, from = -1, to?: number) {
		return {
			[Symbol.iterator]: () => sparseWhere(this.bits, set, from, to, this.undef)
		};
	}
	ranges(set = true) {
		return {
			[Symbol.iterator]: () => sparseRanges(this.bits, set, this.undef)
		};
	}
	*[Symbol.iterator](): Generator<number> {
		yield* sparseWhere(this.bits, true, -1, undefined, this.undef);
	}
	clean(): this {
		sparseClean(this.bits, this.undef);
		return this;
	}
	toDense(): DenseBits {
		let bits = 0n;
		if (this.undef) {
			for (const i in this.bits)
				bits |= BigInt(~this.bits[i]) << BigInt(+i * 32);
			bits = ~bits;
		} else {
			for (const i in this.bits)
				bits |= BigInt(this.bits[i]) << BigInt(+i * 32);
		}
		return new DenseBits(bits);
	}
	slice(from: number, to?: number): BitSet {
		return this.undef
			? this.create(sparseSelfComplement(sparseSlice(sparseComplement(this.bits), from, to)), true)
			: this.create(sparseSlice(this.bits, from, to), false);
	}

	//mutating methods

	set(a: number) {
		sparseSetMask(this.bits, a >> 5, 1 << (a & 0x1f), this.undef);
	}
	clear(a: number) {
		sparseClearMask(this.bits, a >> 5, 1 << (a & 0x1f), this.undef);
	}
	setRange(a: number, b: number) {
		sparseSetRange(this.bits, a, b, this.undef);
		return this;
	}
	clearRange(a: number, b: number) {
		sparseClearRange(this.bits, a, b, this.undef);
		return this;
	}
	selfComplement(): this {
		sparseSelfComplement(this.bits);
		this.undef = ~this.undef;
		return this;
	}
	selfIntersect(other: SparseBits2): this {
		sparseSelfIntersect(this.bits, other.bits);
		if (this.undef) {
			sparseCopyUndefined(this.bits, other.bits);
			this.undef = other.undef;
		} else if (!other.undef) {
			sparseDeleteUndefined(this.bits, other.bits);
		}
		return this;
	}
	selfUnion(other: SparseBits2): this {
		sparseSelfUnion(this.bits, other.bits);
		if (!this.undef) {
			sparseCopyUndefined(this.bits, other.bits);
			this.undef = other.undef;
		} else if (other.undef) {
			sparseDeleteUndefined(this.bits, other.bits);
		}
		return this;
	}
	selfXor(other: SparseBits2): this {
		sparseSelfXor(this.bits, other.bits);
		sparseCopyUndefined(this.bits, other.bits, this.undef);
		this.undef ^= other.undef;
		return this;
	}
	selfDifference(other: this): this {
		sparseSelfDifference(this.bits, other.bits);
		if (other.undef) {
			if (this.undef)
				sparseCopyUndefined(this.bits, other.bits, -1);
			this.undef = 0;
		}
		return this;
	}
};
