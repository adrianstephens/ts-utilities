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

export interface ImmutableBitSet {
	// Returns true if bit 'a' is set
	test(a: number): boolean;

	// Returns the number of bits set to 1
	countSet(): number;

	// Returns the index of the 'a'th set bit
	nthSet(a: number): number;

	// Returns a new bitset with all bits flipped
	complement(): ImmutableBitSet;

	// Returns a new bitset with only the bits set in both this and other
	intersect(other: this): ImmutableBitSet;

	// Returns a new bitset with all bits set in either this or other
	union(other: this): ImmutableBitSet;

	// Returns a new bitset with bits set in either this or other, but not both
	xor(other: this): ImmutableBitSet;

	// Returns true if all bits set in 'other' are also set in this
	contains(other: this): boolean;

	// Returns the next index after 'a' that is set (or clear), or -1 if none
	next(a: number, set: boolean): number;

	// Returns an iterator over all set (or clear) bits, starting after 'from'
	where(set: boolean, from?: number, to?: number): { [Symbol.iterator](): Generator<number> };

	// Returns an iterator over all ranges of set (or clear) bits
	ranges(): { [Symbol.iterator](): Generator<number[]> };

	slice(from: number, to?: number): ImmutableBitSet;

	[Symbol.iterator](): Generator<number>;
}

export interface BitSet extends ImmutableBitSet {
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
}

//-----------------------------------------------------------------------------
// DenseBits - a dense bitset implementation using bigint
//-----------------------------------------------------------------------------
export class ImmutableDenseBits implements ImmutableBitSet {

	constructor(protected bits: bigint = 0n) {
	}
	protected create(bits?: bigint): this {
		return new (this.constructor as new (bits?: bigint) => this)(bits);
	}
	get length() {
		return highestSet(this.bits);
	}
	test(a: number) {
		return !!(this.bits & (1n << BigInt(a)));
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
	intersect(other: ImmutableDenseBits): this {
		return this.create(this.bits & other.bits);
	}
	union(other: ImmutableDenseBits): this {
		return this.create(this.bits | other.bits);
	}
	xor(other: ImmutableDenseBits): this {
		return this.create(this.bits ^ other.bits);
	}
	contains(other: this): boolean {
		return (this.bits & other.bits) === other.bits;
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
	ranges() {
		let bits = this.bits;
		return {
			*[Symbol.iterator](): Generator<number[]> {
				let offset = 0;
				while (bits) {
					const i = highestSet(bits & -bits);
					bits >>= BigInt(i);
					const j = highestSet(~bits & (bits + 1n));
					bits >>= BigInt(j);
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

	slice(from: number, to?: number): ImmutableBitSet {
		return to === undefined
			? this.create(this.bits >> BigInt(from))
			: this.create(this.bits >> BigInt(from) & ((1n << BigInt(to - from)) - 1n));
	}
};

export class DenseBits extends ImmutableDenseBits implements BitSet {
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
};

//-----------------------------------------------------------------------------
// SparseBits - a sparse bitset implementation, where each entry in the 'bits' array represents 32 bits
//-----------------------------------------------------------------------------

function sparseFromEntries(entries: Record<number, number> | [number, number][]) {
	const dest: number[] = [];
	if (Array.isArray(entries)) {
		for (const [k, v] of entries)
			dest[k] = v;
	} else {
		for (const [k, v] of Object.entries(entries))
			dest[+k] = v;
	}
	return dest;
}

function sparseCopyUndefined(bits: number[], other: number[], xor = 0) {
	for (const i in other) {
		if (bits[i] === undefined)
			bits[i] = other[i] ^ xor;
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

function sparseComplement(bits: number[]) {
	return bits.map(b => ~b);
}
function sparseIntersect(bits: number[], other: number[], undef = 0) {
	return bits.map((b, i) => b & (other[i] ?? undef));
}
function sparseUnion(bits: number[], other: number[], undef = 0) {
	return bits.map((b, i) => b | (other[i] ?? undef));
}
function sparseXor(bits: number[], other: number[], undef = 0) {
	return bits.map((b, i) => b ^ (other[i] ?? undef));
}

function sparseSelfComplement(bits: number[]) {
	for (const i in bits)
		bits[i] = ~bits[i];
	return bits;
}
function sparseSelfIntersect(bits: number[], other: number[]) {
	for (const i in bits)
		bits[i] &= other[i];
	return bits;
}
function sparseSelfUnion(bits: number[], other: number[]) {
	for (const i in bits)
		bits[i] |= other[i];
	return bits;
}
function sparseSelfXor(bits: number[], other: number[]) {
	for (const i in bits)
		bits[i] ^= other[i];
	return bits;
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

	if (undef ? !set : set) {
		const ai = from >> 5;
		for (const i in bits) {
			if (+i >= ai) {
				const v = bits[i] ^ undef;
				if (v)
					return (+i << 5) + lowestSet32(v);
			}
		}
		return -1;

	} else  {
		let i = from >> 5;
		if (bits[i] === undefined)
			return from;
		let v = (bits[i] ^ undef) | ((1 << (from & 0x1f)) - 1);
		while (!v) {
			++i;
			if (bits[i] === undefined)
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

function *sparseRanges(bits: number[], undef = 0) {
	let start = -1, end = 0;

	for (const i in bits) {
		let b = bits[i] ^ undef;
		const c0 = +i * 32;

		while ((start < 0 ? b : ~b) !== 0) {
			if (start === -1) {
				start = c0 + lowestSet32(b);
				if (undef)
					yield [end, start];
				end = -1;
				b = b | (b - 1);
			} else {
				end = c0 + lowestSet32(~b);
				if (!undef)
					yield [start, end];
				start = -1;
				b = b & (b + 1);
			}
		}
		if (start >= 0 && bits[+i + 1] === undefined) {
			if (!undef)
				yield [start, c0 + 32];
			start = -1;
		}
	}
	if (undef)
		yield [end, Infinity];
}

function sparseSlice(bits: number[], from: number, to?: number) {
	const from32 = from >> 5;
	const to32 = to === undefined ? Infinity : to >> 5;
	const fromBit = from & 0x1f;
	const toBit = to === undefined ? 0 : to & 0x1f;

	const result: number[] = [];

	for (const i in bits) {
		const idx = +i;
		if (idx < from32 || idx > to32) continue;

		let b = bits[i];

		// Mask start bits
		if (idx === from32)
			b &= -(1 << fromBit);
			
		// Mask end bits
		if (idx === to32 && to !== undefined)
			b &= (1 << toBit) - 1;

		if (b !== 0)
			result[i] = b;
	}
	
	return result;
}

export class ImmutableSparseBits implements ImmutableBitSet {
	constructor(protected bits: number[] = []) {
	}

	protected create(bits: number[] = []): this {
		return new (this.constructor as new (bits: number[]) => this)(bits);
	}

	static fromEntries<T extends ImmutableSparseBits>(this: new (...args: any[]) => T, entries: Record<number, number> | [number, number][], ...args: any[]): T {
		const r = new this(...args);
		r.bits = sparseFromEntries(entries);
		return r;
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
	countSet(): number {
		return sparseCountSet(this.bits);
	}
	nthSet(a: number): number {
		return sparseNthSet(this.bits, a);
	}
	complement() {
		return new ImmutableSparseBits2(sparseComplement(this.bits), true);
	}
	intersect(other: ImmutableSparseBits): this {
		return this.create(sparseIntersect(this.bits, other.bits));
	}
	union(other: ImmutableSparseBits): this {
		return this.create(sparseCopyUndefined(sparseUnion(this.bits, other.bits), other.bits));
	}
	xor(other: ImmutableSparseBits): this {
		return this.create(sparseCopyUndefined(sparseXor(this.bits, other.bits), other.bits));
	}
	contains(other: ImmutableSparseBits): boolean {
		return sparseContains(this.bits, other.bits);
	}
	next(from: number, set = true): number {
		return sparseNext(this.bits, from, set);
	}
	where(set: boolean, from = -1, to?: number) {
		return {
			[Symbol.iterator]: () => sparseWhere(this.bits, set, from, to)
		};
	}
	ranges() {
		return {
			[Symbol.iterator]: () => sparseRanges(this.bits)
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
	slice(from: number, to?: number): ImmutableBitSet {
		return this.create(sparseSlice(this.bits, from, to));
	}
}

export class SparseBits extends ImmutableSparseBits implements BitSet {
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
};

//-----------------------------------------------------------------------------
// SparseBits2 as above, with an 'undef' member indicating whether undefined entries are treated as 0 or 0xffffffff
//-----------------------------------------------------------------------------

export class ImmutableSparseBits2 extends ImmutableSparseBits {
	protected undef: number;

	constructor(bits: number[] = [], initial = false) {
		super(bits);
		this.undef = initial ? -1 : 0;
	}

	protected create(bits: number[] = [], init?: boolean): this {
		return new (this.constructor as new (bits: number[], init?: boolean) => this)(bits, init);
	}

	test(a: number): boolean {
		return sparseTest(this.bits, a, this.undef);
	}
	nthSet(a: number): number {
		return sparseNthSet(this.bits, a, this.undef);
	}
	complement(): this {
		return this.create(sparseComplement(this.bits), this.undef === 0);
	}
	intersect(other: ImmutableSparseBits2): this {
		if (this.undef)
			return this.create(sparseCopyUndefined(sparseIntersect(this.bits, other.bits, other.undef), other.bits), !!other.undef);
		return this.create(sparseIntersect(this.bits, other.bits), false);
	}
	union(other: ImmutableSparseBits2): this {
		if (this.undef)
			return this.create(sparseUnion(this.bits, other.bits), true);
		return this.create(sparseCopyUndefined(sparseUnion(this.bits, other.bits), other.bits), !!other.undef);
	}
	xor(other: ImmutableSparseBits2): this {
		return this.create(sparseCopyUndefined(sparseXor(this.bits, other.bits), other.bits, this.undef), !!(this.undef ^ other.undef));
	}
	contains(other: ImmutableSparseBits2): boolean {
		if (other.undef && !this.undef)
			return false;
		return sparseContains(this.bits, other.bits, this.undef);
	}
	next(from: number, set = true): number {
		return sparseNext(this.bits, from, set, this.undef);
	}
	where(set: boolean, from = -1, to?: number) {
		return {
			[Symbol.iterator]: () => sparseWhere(this.bits, set, from, to, this.undef)
		};
	}
	ranges() {
		return {
			[Symbol.iterator]: () => sparseRanges(this.bits, this.undef)
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
	slice(from: number, to?: number): ImmutableBitSet {
		return this.create(sparseSlice(this.bits, from, to), !!this.undef);
	}
}

export class SparseBits2 extends ImmutableSparseBits2 implements BitSet {
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
		this.undef = ~this.undef;
		sparseSelfComplement(this.bits);
		return this;
	}
	selfIntersect(other: SparseBits2): this {
		sparseSelfIntersect(this.bits, other.bits);
		if (this.undef) {
			sparseCopyUndefined(this.bits, other.bits);
			this.undef = other.undef;
		}
		return this;
	}
	selfUnion(other: SparseBits2): this {
		sparseSelfUnion(this.bits, other.bits);
		if (!this.undef) {
			sparseCopyUndefined(this.bits, other.bits);
			this.undef = other.undef;
		}
		return this;
	}
	selfXor(other: SparseBits2): this {
		sparseSelfXor(this.bits, other.bits);
		sparseCopyUndefined(this.bits, other.bits, this.undef);
		this.undef ^= other.undef;
		return this;
	}
};
