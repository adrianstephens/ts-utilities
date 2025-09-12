import { SparseBits } from "./bits";

/*
Character classes
xyz]
[a-c]	Character class
[^xyz]
[^a-c]	Negated character class
.		Wildcard: Matches any single character except line terminators: \n, \r, \u2028 or \u2029
\d		Digit character class escape: Matches any digit (Arabic numeral). Equivalent to [0-9]
\D		Non-digit character class escape: Matches any character that is not a digit (Arabic numeral)
\w		Word character class escape: Matches any alphanumeric character from the basic Latin alphabet, including the underscore. Equivalent to [A-Za-z0-9_]
\W		Non-word character class escape: Matches any character that is not a word character from the basic Latin alphabet. Equivalent to [^A-Za-z0-9_]
\s		White space character class escape: Matches a single white space character, including space, tab, form feed, line feed, and other Unicode spaces. Equivalent to [\f\n\r\t\v\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]
\S		Non-white space character class escape
\t		Matches a horizontal tab.
\r		Matches a carriage return.
\n		Matches a linefeed.
\v		Matches a vertical tab.
\f		Matches a form-feed.
[\b]	Matches a backspace. If you're looking for the word-boundary assertion (\b), see Assertions.
\0		Matches a NUL character. Do not follow this with another digit.
\cX		Matches a control character using caret notation, where "X" is a letter from A–Z
\xhh	Matches the character with the code hh (two hexadecimal digits).
\uhhhh	Matches a UTF-16 code-unit with the value hhhh (four hexadecimal digits).
\u{hhhh} or \u{hhhhh}	(Only when the u flag is set.) Matches the character with the Unicode value U+hhhh or U+hhhhh (hexadecimal digits).
\p{UnicodeProperty}, \P{UnicodeProperty}	Unicode character class escape: Matches a character based on its Unicode character properties
\		Indicates that the following character should be treated specially, or "escaped"

x|y		Alternation: Matches either "x" or "y"

Boundary-type assertions
^		Input boundary beginning assertion
$		Input boundary end assertion
\b		Word boundary assertion
\B		Non-word-boundary assertion

Other Assertions
x(?=y)	Lookahead assertion
x(?!y)	Negative lookahead assertion
(?<=y)x	Lookbehind assertion
(?<!y)x	Negative lookbehind assertion

Groups and backreferences
(x)			Capturing group
(?<Name>x)	Named capturing group
(?:x)		Non-capturing group
(?flags:x), (?:flags-flags:x)	Modifier (flags can be i, m, s)
\<int>		Backreference
\k<Name>	Named backreference

Quantifiers
x*			Matches the preceding item "x" 0 or more times
x+			Matches the preceding item "x" 1 or more times. Equivalent to {1,}
x?			Matches the preceding item "x" 0 or 1 times. For example, /e?le?/ matches the "el" in "angel" and the "le" in "angle."
x{<int>}	Matches exactly "n" occurrences of the preceding item "x"
x{<int>,}	Matches at least "n" occurrences of the preceding item "x"
x{n,m}		Matches at least "n" and at most "m" occurrences of the preceding item "x"

Non greedy quantifiers
x*?
x+?
x??
x{n}?
x{n,}?
x{n,m}?

*/

const posixClasses: Record<string, string> = {
    alnum: 	'\\p{L}\\p{Nl}\\p{Nd}',
    alpha: 	'\\p{L}\\p{Nl}',
    ascii: 	'\\x00-\\x7f',
    blank: 	'\\p{Zs}\\t',
    cntrl: 	'\\p{Cc}',
    digit: 	'\\p{Nd}',
    graph: 	'^\\p{Z}\\p{C}',
    lower: 	'\\p{Ll}',
    print: 	'\\p{C}',
    punct: 	'\\p{P}',
    space: 	'\\p{Z}\\t\\r\\n\\v\\f',
    upper: 	'\\p{Lu}',
    word: 	'\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}',
    xdigit: 'A-Fa-f0-9',
};

class klass extends SparseBits {
	type: 'class' = 'class';

	setChar(char: string) {
		this.set(char.charCodeAt(0));
	}
	test(char: string): boolean {
		return this.has(char.charCodeAt(0));
	}

	setString(c: string) {
		for (let i = 0; i < c.length; i++)
			this.set(c.charCodeAt(i));
		return this;
	}
	clearString(c: string) {
		for (let i = 0; i < c.length; i++)
			this.clear(c.charCodeAt(i));
		return this;
	}

	toString(): string {
		let s = this.undef ? '^' : '';
		for (const i in this.bits) {
			const b = this.bits[i] ^ this.undef;
			const c0 = +i * 32;

			for (let j = 0; j < 32; j++) {
				if (b & (1 << j)) {
					const c1 = c0 + j;
					while (j < 32 && (b & (1 << j)))
						j++;
					const c2 = c0 + j - 1;
					s += String.fromCharCode(c1).replace(/[-\\\]]/g, '\\$&');
					if (c1 !== c2)
						s += '-' + String.fromCharCode(c2).replace(/[-\\\]]/g, '\\$&');
				}
			}
		}
		return s;
	}

	static fromString(value: string): klass {
		return new klass(false).setString(value);
	}
};

export function stringClass(value: string): klass {
	return new klass(false).setString(value);
}
export function negStringClass(value: string): klass {
	return new klass(true).clearString(value);
}

export function text(c: string): string {
	return c;
}

/*
interface text {
	type: 'text';
	value: string;
}
export function text(c: string): text {
	return {type: 'text', value: c};
}
*/

interface concatenation {
	type: 'concat';
	parts: part[];
}
export function concatenation(parts: part[]): concatenation | part {
	return parts.length === 1 ? parts[0] : {type: 'concat', parts};
}

interface alternation {
	type: 'alt';
	parts: part[];
}
export function alternation(parts: part[]): alternation | part {
	return parts.length === 1 ? parts[0] : {type: 'alt', parts};
}

type noncaptureOptions = 'ahead' | 'behind' | 'neg_ahead' | 'neg_behind' | {i?: boolean; m?: boolean; s?: boolean};
interface noncapture {
	type: 'noncapture';
	part: part;
	options?: noncaptureOptions
};
export function noncapture(part: part, options?: noncaptureOptions): noncapture {
	return {type: 'noncapture', part, options};
}

interface capture {
	type: 'capture';
	name?: string;
	part: part;
}
export function capture(part: part, name?: string): capture {
	return {type: 'capture', part, name};
}

interface unicode {
	type: 'unicode' | 'notunicode';
	property: string;
}

interface quantified {
	type: 'quantified';
	part: part;
	min: number;
	max: number; // -1 = inf
	greedy: boolean;
}
export function quantified(part: part, min: number, max: number = -1, greedy = true): quantified {
	return {type: 'quantified', part, min, max, greedy};
}

interface boundary {
	type: 'wordbound' | 'nowordbound' | 'inputboundstart' | 'inputboundend';
}
export function boundary(type: boundary['type']): boundary {
	return {type};
}

interface reference {
	type: 'reference';
	value: number|string;
}
export function reference(value: number|string): reference {
	return {type: 'reference', value};
}

type part0 = /*text |*/ concatenation | alternation | noncapture | capture | klass | unicode | quantified | boundary | reference;
type part = string | part0;

//function is<T extends part0>(part: part, type: T['type']): part is T {
//	return typeof part !== 'string' && part.type === type;
//}

function is<T extends part0['type']>(part: part, type: T): part is Extract<part0, { type: T }> {
	return typeof part !== 'string' && part.type === type;
}

export function anchored(part: part): part {
	return concatenation([boundary('inputboundstart'), part, boundary('inputboundend')]);
}


interface PendingGroup {
	type: 'group';
	group: capture | noncapture;
	tos: part[];
}

export function parse(re: string): part {
	const stack:	(alternation | PendingGroup)[] = [];
	let tos:		part[] = [];

	let i = 0;

	function skipTo(c: string) {
		const start = i;
		while (i < re.length && re[i] !== c)
			i++;
		if (re[i] !== c)
			throw new Error(`Missing '${c}'`);
		return re.substring(start, i++);
	}

	function int(): number {
		const start = i;
		while (re[i] >= '0' && re[i] <= '9')
			i++;
		return parseInt(re.substring(start, i));
	}

	function backslashed(): string | klass | unicode {
		const c = re[i++];
		switch (c) {
			default:	return c;
			case 'd':	return klass.fromString('0123456789');  //digit
			case 'D':	return klass.fromString('0123456789').complement();  //non-digit
			case 'w':	return klass.fromString('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_');  //word
			case 'W':	return klass.fromString('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_').complement();  //non-word
			case 's':	return klass.fromString(' \t\r\n\f\v');  //whitespace
			case 'S':	return klass.fromString(' \t\r\n\f\v').complement();  //non-whitespace
			case 't':	return '\t';  //tab
			case 'r':	return '\r';  //carriage return
			case 'n':	return '\n';  //newline
			case 'v':	return '\v';  //vertical tab
			case 'f':	return '\f';  //form feed
			case 'b':	return '\b';  //backspace
			case '0':	return '\0';  //NUL
			case 'c':	return String.fromCharCode(re.charCodeAt(i++) & 31); //control character
			case 'x':
				if (i + 2 > re.length)
					throw new Error('bad \\x escape');
				i += 2;
				return String.fromCharCode(parseInt(re.substring(i - 2, i), 16));

			case 'u':
				if (re[i] === '{') {
					i++; // skip '{'
					const hex = skipTo('}');
					return String.fromCodePoint(parseInt(hex, 16));
				}
				if (i + 4 > re.length)
					throw new Error('bad \\u escape');
				i += 4;
				return String.fromCharCode(parseInt(re.substring(i - 4, i), 16));
			case 'p':
			case 'P':
			    if (re[i] !== '{')
    				throw new Error('\\p and \\P must be followed by {property}');
				i++; // skip '{'
				return {type: c === 'P' ? 'notunicode' : 'unicode', property: skipTo('}')};
		}
	}

	function character() {
		const c = re[i++];
		return c === '\\' ? backslashed() : c;
	}


	function makeQuantified(min: number, max: number) {
		const greedy = re[i] !== '?';
		if (!greedy)
			i++;
		const top = tos.pop();
		if (!top)
			throw new Error('nothing to quantify');

		if (typeof top === 'string' && top.length > 1) {
			tos.push(top.slice(0, -1));
			tos.push(quantified(top.slice(-1), min, max, greedy));
		} else {
			tos.push(quantified(top, min, max, greedy));
		}
/*
		if (typeof top !== 'string' && top.type === 'text' && top.value.length > 1) {
			tos.push(text(top.value.slice(0, -1)));
			tos.push(quantified(text(top.value.slice(-1)), min, max, greedy));
		} else {
			tos.push(quantified(top, min, max, greedy));
		}
			*/
	}

	const specialChars = /[\\^$*+?{()|[]/;

	while (i < re.length) {
		const remaining	= re.substring(i);
		const next		= remaining.search(specialChars);

		if (next === -1) {
			//tos.push({type: 'text', value: remaining});
			tos.push(remaining);
			break;
		}

		if (next > 0)
			//tos.push({type: 'text', value: remaining.substring(0, next)});
			tos.push(remaining.substring(0, next));

		i += next;
		const c = re[i++];
		switch (c) {
			case '\\':
				if (re[i] === 'b') {
					i++;
					tos.push({type: 'wordbound',});
				} else if (re[i] === 'B') {
					i++;
					tos.push({type: 'nowordbound',});
				} else if (re[i] >= '1' && re[i] <= '9') {
					const n = int();
					tos.push({type: 'reference', value: n});
				} else if (re[i] === 'k' && re[i + 1] === '<') {
					i += 2;
					const name = skipTo('>');
					tos.push({type: 'reference', value: name});
				} else {
					const b = backslashed();
					tos.push(b);
					//tos.push(typeof b === 'string' ? text(b) : b);
				}
				break;

		//Boundary-type assertions
			case '^':
				tos.push({type: 'inputboundstart', });
				break;
			case '$':
				tos.push({type: 'inputboundend', });
				break;

		//Quantifiers
			case '*':
				makeQuantified(0, -1);
				break;
			case '+':
				makeQuantified(1, -1);
				break;
			case '?':
				makeQuantified(0, 1);
				break;
			case '{': {
				const	min = int();
				let		max = min;
				if (re[i] === ',') {
					++i; // skip ','
					max = re[i] !== '}' ? int() : -1;
				}
				++i; // skip '}'
				makeQuantified(min, max);
				break;
			}

		//Alternation
			case '|': {
				const top = stack.at(-1);
				if (top?.type === 'alt') {
					top.parts.push(concatenation(tos));
				} else {
					stack.push({type: 'alt', parts: [concatenation(tos)]});
				}
				tos = [];
				break;
			}

		//Groups
			case '(':
				let group: capture | noncapture;
				const dummy = '';//text(''); // placeholder
				if (re[i] === '?') {
					i++;
					switch (re[i++]) {
						case ':':
							group = noncapture(dummy);
							break;
						case '=':
							group = noncapture(dummy, 'ahead');
							break;
						case '!':
							group = noncapture(dummy, 'neg_ahead');
							break;
						case '<':
							if (re[i] === '=') {
								i++;
								group = noncapture(dummy, 'behind');
							} else if (re[i] === '!') {
								i++;
								group = noncapture(dummy, 'neg_behind');
							} else {
								group = capture(dummy, skipTo('>'));
							}
							break;
						default: {
							let		set = true;
							const	flags: {i?: boolean; m?: boolean; s?: boolean} = {};
							--i; // go back to first flag character
							while (i < re.length) {
								const f = re[i++];
								if (f === ':')
									break;
								if (f === '-')
									set = false;
								else if (f === 'i' || f === 'm' || f === 's')
									flags[f] = set;
							}
							group = noncapture(dummy, flags);
							break;
						}
					}
				} else {
					group = capture(dummy, '');
				}

				stack.push({type: 'group', group: group, tos});
				tos = [];
				break;

			case ')': {
				const group = stack.pop();
				if (group?.type !== 'group')
					throw new Error('unmatched )');

				group.group.part = concatenation(tos);
				tos = [...group.tos, group.group];
				break;
			}

		//Character classes
			case '[': {
				const neg = re[i] === '^';
				if (neg)
					i++;

				let cs = new klass(false);
				if (re[i] === ']' || re[i] === '-')
					cs.set(re.charCodeAt(i++));

				while (i < re.length && re[i] !== ']') {
					const c = character();
					if (typeof c === 'string') {
						if (re[i] === '-' && i + 1 < re.length && re[i + 1] !== ']') {
							++i;
							const to = character();
							if (typeof to !== 'string')
								throw new Error('bad character class');
							if (c.charCodeAt(0) > to.charCodeAt(0))
								throw new Error('bad character class range');
							cs.setRange(c.charCodeAt(0), to.charCodeAt(0) + 1);
						} else {
							cs.setChar(c);
						}
					} else if (is(c, 'class')) {
						cs.union(c);
					}
				}
				i++; // skip ']'
				tos.push(neg ? cs.complement() : cs);
				break;
			}
		}
	}

	if (stack.length) {
		const top = stack.pop()!;
		if (top.type === 'alt') {
			top.parts.push(concatenation(tos));
			tos = [top];
		}
		if (stack.length)
			throw new Error('unmatched (');
	}

	return concatenation(tos);
}

export function toRegExpString(part: part): string {
	if (typeof part === 'string')
		return part.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');

	switch (part.type) {
		//case 'text':
		//	return part.value.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');

		case 'concat':
			return part.parts.map(p => toRegExpString(p)).join('');

		case 'alt':
			return part.parts.map(p => {
				const s = toRegExpString(p);
				return is(p, 'alt') ? `(?:${s})` : s;
			}).join('|');

		case 'quantified': {
			let p = toRegExpString(part.part);
			p	+=	part.min === 0 && part.max === -1 ? '*'
				:	part.min === 1 && part.max === -1 ? '+'
				:	part.min === 0 && part.max === 1 ? '?'
				:	part.max === -1 ? `{${part.min},}`
				:	part.min === part.max ? `{${part.min}}`
				:	`{${part.min},${part.max}}`;
			return p + (part.greedy ? '' : '?');
		}

		case 'noncapture': {
			let header = '';
			const opts = part.options;
			if (opts) {
				if (typeof opts === 'string') {
					header = {
						ahead:		'=',
						behind:		'<=',
						neg_ahead:	'!',
						neg_behind:	'<!'
					}[opts];
				} else if ((opts.i ?? opts.m ?? opts.s) !== undefined) {
					let posflags = (opts.i ? 'i' : '') + (opts.m ? 'm' : '') + (opts.s ? 's' : '');
					let negflags = (opts.i === false ? 'i' : '') + (opts.m === false ? 'm' : '') + (opts.s === false ? 's' : '');
					header = `${posflags}${negflags ? '-' : ''}${negflags}:`;
				}
			}
			return `(?${header}${toRegExpString(part.part)})`;
		}

		case 'capture':
			return `(${part.name ? `?<${part.name}>` : ''}${toRegExpString(part.part)})`;

		case 'class':
			return `[${part.toString()}]`;

		case 'unicode':
			return `\\p{${part.property}}`;

		case 'notunicode':
			return `\\P{${part.property}}`;

		case 'wordbound':
			return '\\b';
		case 'nowordbound':
			return '\\B';
		case 'inputboundstart':
			return '^';
		case 'inputboundend':
			return '$';

		case 'reference':
			return typeof part.value === 'number' ? `\\${part.value}` : `\\k<${part.value}>`;
	}
}

export function parseGlob(glob: string): string {
	let result = '';
	let depth = 0;

	for (let i = 0; i < glob.length; ++i) {
		let c = glob[i];
		switch (c) {
			case '\\':
				c = glob[++i];
				if ('*?+.,^$()|[]a-zA-Z'.includes(c))
					result += '\\';
				break;

			case '*':
				if (glob[i + 1] === '*') {
					result += '.*';
					++i;
				} else {
					result += '[^/]*';
				}
				continue;

			case '?':
				c = '.';
				break;

			case '+': case '.': case '^': case '$': case '(': case ')': case '|':
				result += `\\`;
				break;

			case '[': {
				const end = glob.indexOf(']', i + 1);
				if (end > i) {
					const next = glob[i + 1];
					if (next === ':' && glob[end - 1] === ':') {
						const p = posixClasses[glob.slice(i + 2, end - 1)];
						if (p) {
							result += `[${p}]`;
							i = end;
							continue;
						} else {
							console.log(`Warning: Unknown POSIX class ${glob.slice(i + 2, end - 1)} in glob pattern ${glob}`);
						}
					}
					const neg = next === '!' || next === '^';
					result += `[${neg ? '^' : ''}${glob.slice(neg ? i + 2 : i + 1, end)}]`;
					i = end;
					continue;
				}
				result += '\\';
				break;
			}

			case '{':
				++depth;
				c = '(';
				break;

			case '}':
				if (depth > 0) {
					--depth;
					c = ')';
				}
				break;

			case ',':
				if (depth > 0)
					c = '|';
				break;

		}
		result += c;
	}
	if (depth > 0) {
		console.log(`Warning: Unmatched { in glob pattern ${glob}`);
		result += ')'.repeat(depth);
	}
	return result;
}

export function anchoredRe(re: string) {
	return new RegExp(`^${re}$`);
}

export function globToRe(glob: string) {
	return anchoredRe(parseGlob(glob));
}

export function globToReMulti(globs: string[]) {
	return anchoredRe(globs.map(parseGlob).join('|'));
}
