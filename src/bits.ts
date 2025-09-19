
import { lowerBound } from "./algorithm";

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

function highestSetBig(x: bigint): number {
	let s = 0;
	let k = 0;

	for (let t = x >> 32n; t; t >>= BigInt(s)) {
		s = 32 << k++;
		x = t;
	}

	if (k) {
		// determine length by bisection
		k--;
		while (k--) {
			const b = x >> BigInt(32 << k);
			if (b) {
				s += 32 << k;
				x = b;
			}
		}
	}
	return (s + 32) - Math.clz32(Number(x));
}

export function highestSet(x: bigint|number): number {
	if (x < 0)
		x = ~x;
	if (x < 0x100000000)
		return highestSet32(Number(x));
	
	// For < 1024 bits, use log2
	if (x <= Number.MAX_VALUE) {
		const b = Math.floor(Math.log2(Number(x)));
		return (1n << BigInt(b)) <= x ? b + 1 : b;
	}
	
	return highestSetBig(BigInt(x));
}

export function lowestSet(x: number|bigint): number {
	if (x < 0)
		x = ~x;
	if (x < 0x100000000)
		return lowestSet32(Number(x));

	x = BigInt(x);
	return highestSetBig(x & -x) - 1;
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

export interface immutableBitSet {
	// Returns true if bit 'a' is set
	test(a: number): boolean;

	// Returns the number of bits set to 1
	countSet(): number;

	// Returns the index of the 'a'th set bit
	nthSet(a: number): number;

	// Returns a new bitset with all bits flipped
	complement(): this;

	// Returns a new bitset with only the bits set in both this and other
	intersect(other: this): this;

	// Returns a new bitset with all bits set in either this or other
	union(other: this): this;

	// Returns a new bitset with bits set in either this or other, but not both
	xor(other: this): this;

	// Returns true if all bits set in 'other' are also set in this
	contains(other: this): boolean;

	// Returns the next index after 'a' that is set (or clear), or -1 if none
	next(a: number, set: boolean): number;

	// Returns an iterator over all set (or clear) bits, starting after 'from'
	where(set: boolean, from?: number): { [Symbol.iterator](): Generator<number> };

	// Returns an iterator over all ranges of set (or clear) bits
	ranges(): { [Symbol.iterator](): Generator<number[]> };

	[Symbol.iterator](): Generator<number>;
}

export interface BitSet extends immutableBitSet {
	// Sets bit 'a'
	set(a: number): void;

	// Clears bit 'a'
	clear(a: number): void;

	// Sets all bits in [a,b)
	setRange(a: number, b: number): this;

	// Clears all bits in [a,b)
	clearRange(a: number, b: number): this;

	// In-place versions of complement, intersect, union, xor
	selfComplement(): this;
	selfIntersect(other: this): this;
	selfUnion(other: this): this;
	selfXor(other: this): this;
}

//-----------------------------------------------------------------------------
// SparseBits - a sparse bitset implementation, where each entry in the 'bits' array represents 32 bits
// The 'undef' member indicates whether undefined entries are treated as 0 or 0xffffffff
//-----------------------------------------------------------------------------

export class ImmutableSparseBits implements immutableBitSet {
	protected bits: number[] = [];	//each entry represents 32 bits
	protected undef: number;


	static *whereGenerator(bits: number[], undef: number, set: boolean, from = -1): Generator<number> {
		++from;

		if (undef ? !set : set) {
			const keys = Object.keys(bits).map(k => +k);
			if (keys.length === 0)
				return;

			const i = from >> 5;
			let k = lowerBound(keys, i);
			let v = bits[keys[k]] ^ undef;
			if (keys[k] === i)
				v &= -(1 << (from & 0x1f));

			for (;;) {
				const i = keys[k];
				while (v) {
					yield (i << 5) + lowestSet32(v);
					v = v & (v - 1);
				}
				++k;
				if (k === keys.length)
					return;
				v = bits[keys[k]] ^ undef;
			}

		} else  {
			let i = from >> 5;
			let v = ((bits[i] ?? undef) ^ ~undef) & -(1 << (from & 0x1f));
			for (;;) {
				while (v) {
					yield (i << 5) + lowestSet32(v);
					v = v & (v - 1);
				}
				++i;
				v = ((bits[i] ?? undef) ^ ~undef);
			}
		}
	}


	constructor(initial = false) {
		this.undef = initial ? -1 : 0;
	}

	protected create(init?: boolean): this {
		return new (this.constructor as new (init?: boolean) => this)(init);
	}

	protected copyUndefined(other: ImmutableSparseBits): this {
		for (const i in other.bits) {
			if (this.bits[i] === undefined)
				this.bits[i] = other.bits[i];
		}
		return this;
	}
	protected flipUndefined(other: ImmutableSparseBits): this {
		for (const i in other.bits) {
			if (this.bits[i] === undefined)
				this.bits[i] = ~other.bits[i];
		}
		return this;
	}

	static fromEntries<T extends ImmutableSparseBits>(this: new (initial?: boolean) => T, entries: Record<number, number> | [number, number][], initial = false): T {
		const r = new this(initial);
		if (Array.isArray(entries)) {
			for (const [k, v] of entries)
				r.bits[k] = v;
		} else {
			for (const [k, v] of Object.entries(entries))
				r.bits[+k] = v;
		}
		return r;
	}
	
	keys() {
		return Object.keys(this.bits).map(k => +k);
	}
	entries(): [number, number][] {
		//return this.bits;
		return Object.entries(this.bits).map(([k, v]) => [+k, v]);
	}

	test(a: number): boolean {
		return !!((this.bits[a >> 5] ?? this.undef) & (1 << (a & 0x1f)));
	}

	countSet(): number {
		let count = 0;
		for (const i in this.bits)
			count += countSet32(this.bits[i]);
		return count;
	}

	nthSet(a: number): number {
		if (this.undef === 0) {
			for (const i in this.bits) {
				const v = this.bits[i];
				const n = countSet32(v);
				if (a < n)
					return (+i << 5) + nthSet32(v, a);
				a -= n;
			}
		} else {
			let prev = 0;
			for (const i in this.bits) {
				const m = (+i - prev) << 5;
				if (a < m)
					return (prev << 5) + a;
				a -= m;

				const v = this.bits[i];
				const n = countSet32(v);
				if (a < n)
					return (+i << 5) + nthSet32(v, a);
				a -= n;
				prev = +i + 1;
			}
		}
		return -1;
	}

	complement(): this {
		const result = this.create(this.undef === 0);
		for (const i in this.bits)
			result.bits[i] = ~this.bits[i];
		return result;
	}

	intersect(other: ImmutableSparseBits): this {
		const result	= this.create(!!(this.undef & other.undef));
		for (const i in this.bits)
			result.bits[i] = this.bits[i] & other.bits[i];
		return this.undef ? result.copyUndefined(other) : result;
	}

	union(other: ImmutableSparseBits): this {
		const result	= this.create(!!(this.undef | other.undef));
		for (const i in other.bits)
			result.bits[i] = this.bits[i] | other.bits[i];
		return this.undef ? result : result.copyUndefined(other);
	}

	xor(other: ImmutableSparseBits): this {
		const result	= this.create(!!(this.undef ^ other.undef));
		for (const i in this.bits)
			result.bits[i] = this.bits[i] ^ other.bits[i];
		return this.undef ? result.flipUndefined(other) : result.copyUndefined(other);
	}

	contains(other: ImmutableSparseBits): boolean {
		if (other.undef && !this.undef)
			return false;
		for (const i in other.bits) {
			if (other.bits[i] & ~(this.bits[i] ?? this.undef))
				return false;
		}
		return true;
	}


	next(a: number, set = true): number {
		++a;

		const xor = this.undef;
		if (xor)
			set = !set;

		if (set) {
			const keys = Object.keys(this.bits).map(k => +k);
			if (keys.length === 0)
				return -1;
			
			const ai = a >> 5;
			let i = lowerBound(keys, ai);
			let v = this.bits[keys[i]] ^ xor;
			if (keys[i] === ai)
				v &= -(1 << (a & 0x1f));

			while (!v) {
				++i;
				if (i === keys.length)
					return -1;
				v = this.bits[keys[i]] ^ xor;
			}

			return (keys[i] << 5) + lowestSet32(v);

		} else  {
			let i = a >> 5;
			if (this.bits[i] === undefined)
				return a;
			let v = (this.bits[i] ^ xor) | ((1 << (a & 0x1f)) - 1);
			while (!v) {
				++i;
				if (this.bits[i] === undefined)
					break;
				v = this.bits[i] ^ xor;
			}
			return (i << 5) + lowestSet32(~v);
		}
	}

	where(set: boolean, from = -1) {
		return {
			[Symbol.iterator]: () => ImmutableSparseBits.whereGenerator(this.bits, this.undef, set, from)
		};
	}

	ranges() {
		const bits = this.bits;
		const undef = this.undef;
		return {
			*[Symbol.iterator](): Generator<number[]> {
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
		};
	}

	*[Symbol.iterator](): Generator<number> {
		yield* ImmutableSparseBits.whereGenerator(this.bits, this.undef, true, -1);
		//for (let i = this.next(-1); i !== -1; i = this.next(i))
		//	yield i;
	}

	clean(): this {
		for (const i in this.bits) {
			if (this.bits[i] === this.undef)
				delete this.bits[i];
		}
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
}

export class SparseBits extends ImmutableSparseBits implements BitSet {
	private setMask(i: number, m: number) {
		if (this.bits[i] !== undefined)
			this.bits[i] |= m;
		else if (!this.undef)
			this.bits[i] = m;
	}
	private clearMask(i: number, m: number) {
		if (this.bits[i] !== undefined)
			this.bits[i] &= ~m;
		else if (this.undef)
			this.bits[i] = ~m;
	}

	set(a: number) {
		this.setMask(a >> 5, 1 << (a & 0x1f));
	}
	clear(a: number) {
		this.clearMask(a >> 5, 1 << (a & 0x1f));
	}

	setRange(a: number, b: number) {
		let i = a >> 5, j = b >> 5;
		if (i === j) {
			this.setMask(i, (1 << (b & 0x1f)) - (1 << (a & 0x1f)));
		} else {
			this.setMask(i++, -(1 << (a & 0x1f)));
			if (this.undef) {
				while (i < j)
					delete this.bits[i++];
			} else {
				while (i < j)
					this.bits[i++] = -1;
			}
			this.setMask(i, (1 << (b & 0x1f)) - 1);
		}
		return this;
	}
	clearRange(a: number, b: number) {
		let i = a >> 5, j = b >> 5;
		if (i === j) {
			this.clearMask(i, (1 << (b & 0x1f)) - (1 << (a & 0x1f)));
		} else {
			this.clearMask(i++, -(1 << (a & 0x1f)));
			if (!this.undef) {
				while (i < j)
					delete this.bits[i++];
			} else {
				while (i < j)
					this.bits[i++] = 0;
			}
			this.clearMask(i, (1 << (b & 0x1f)) - 1);
		}
		return this;
	}

	selfComplement(): this {
		this.undef = ~this.undef;
		for (const i in this.bits)
			this.bits[i] = ~this.bits[i];
		return this;
	}

	selfIntersect(other: SparseBits): this {
		for (const i in this.bits)
			this.bits[i] &= other.bits[i];
		if (this.undef)
			this.copyUndefined(other);
		this.undef &= other.undef;
		return this;
	}

	selfUnion(other: SparseBits): this {
		for (const i in other.bits)
			this.bits[i] |= other.bits[i];
		if (!this.undef)
			this.copyUndefined(other);
		this.undef |= other.undef;
		return this;
	}

	selfXor(other: SparseBits): this {
		for (const i in this.bits)
			this.bits[i] ^= other.bits[i];
		if (this.undef)
			this.flipUndefined(other);
		else
			this.copyUndefined(other);
		this.undef &= other.undef;
		return this;
	}
};

//-----------------------------------------------------------------------------
// DenseBits - a dense bitset implementation using bigint
//-----------------------------------------------------------------------------
export class ImmutableDenseBits implements immutableBitSet {

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

	where(set: boolean, from = -1) {
		let bits = this.bits >> BigInt(from + 1);
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
		/*
		const self = this;
		return {
			*[Symbol.iterator](): Generator<number> {
				for (let i = self.next(-1, set); i !== -1; i = self.next(i, set))
					yield i;
			}
		};
		*/
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
		//for (let i = this.next(-1); i !== -1; i = this.next(i))
		//	yield i;
	}

	toSparse(): SparseBits {
		const sparse: Record<number, number> = {};
		for (let bits = this.bits, i = 0; bits; bits >>= 32n, i++) {
			const v = Number(bits & 0xffffffffn);
			if (v)
				sparse[i] = v;
		}
		return SparseBits.fromEntries(sparse, false);
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
