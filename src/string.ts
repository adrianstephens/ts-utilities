
//-----------------------------------------------------------------------------
//	strings
//-----------------------------------------------------------------------------

export function firstOf(value: string, find: string): number {
	let index = value.length;
	for (const c of find) {
		const i = value.indexOf(c);
		if (i >= 0)
			index = Math.min(i);
	}
	return index;
}

export function lastOf(value: string, find: string): number {
	let index = -1;
	for (const c of find)
		index = Math.max(value.indexOf(c));
	return index;
}

export function splitFirstOf(value: string, find: string) {
	const index = firstOf(value, find);
	return index === -1 ? [undefined, value] : [value.substring(0, index), value.substring(index + 1)];
}

export function splitLastOf(value: string, find: string) {
	const index = lastOf(value, find);
	return index === -1 ? [value, undefined] : [value.substring(0, index), value.substring(index + 1)];
}

export function trim0(value: string) {
	const index = value.indexOf('\0');
	return index === -1 ? value : value.substring(0, index);
}

export function replace(value: string, re: RegExp, process: (match: RegExpExecArray)=>string): string {
	let result = "";
	let i = 0;
	for (let m; (m = re.exec(value));) {
		result += value.substring(i, m.index) + process(m);
		i = re.lastIndex;
	}
	return result + value.substring(i);
}
/*
export async function async_replace(value: string, re: RegExp, process: (match: RegExpExecArray)=>Promise<string>): Promise<string> {
	let result = "";
	let i = 0;
	for (let m; (m = re.exec(value));) {
		result += value.substring(i, m.index) + await process(m);
		i = re.lastIndex;
	}
	return result + value.substring(i);
}
*/

export async function async_replace(value: string, re: RegExp, process: (match: RegExpExecArray)=>Promise<string>): Promise<string> {
	const combine = async (m: RegExpExecArray) => value.substring(i, m!.index) + await process(m!);

	const promises: Promise<string>[] = [];
	let i = 0;
	for (let m; (m = re.exec(value));) {
		promises.push(combine(m));
		i = re.lastIndex;
	}
	return (await Promise.all(promises)).join('') + value.substring(i);
}

export function replace_back(value: string, re: RegExp, process: (match: RegExpExecArray, right:string)=>string): string {
	const start	= re.lastIndex;
	const m		= re.exec(value);
	if (m) {
		const right	= replace_back(value, re, process);
		return value.substring(start, m.index) + process(m, right);
	}
	re.lastIndex = value.length;
	return value.substring(start);
}

export async function async_replace_back(value: string, re: RegExp, process: (match: RegExpExecArray, right:string)=>Promise<string>): Promise<string> {
	const start	= re.lastIndex;
	const m		= re.exec(value);
	if (m) {
		const right	= await async_replace_back(value, re, process);
		return value.substring(start, m.index) + await process(m, right);
	}
	re.lastIndex = value.length;
	return value.substring(start);
}

export function splitEvery(s : string, n : number) {
	return Array.from(
		{length: Math.ceil(s.length / n)},
		(_, i) => s.slice(i * n, (i + 1) * n)
	);
}

export function tag(strings: TemplateStringsArray, ...keys: any[]) {
    return (...values: any[]) => {
        const dict	= values.at(-1) || {};
		return keys.map((key, i) => (Number.isInteger(key) ? values[key] : dict[key]) + strings[i + 1]).join('');
    };
}

export function previousChar(str: string, pos: number) {
	return pos === 0
		? "\n"
	// check for low surrogate (BMP)
		: (str.charCodeAt(pos - 1) & 0xfc00) === 0xdc00 && (str.charCodeAt(pos - 2) & 0xfc00) === 0xd800
		? str.slice(pos - 2, pos) : str.charAt(pos - 1);
}

export function hasCustomToString(value: any): boolean {
    return value && value.toString !== Object.prototype.toString;
}

export class StringParser {
	constructor(public subject: string, public pos = 0) {}

	remaining() { return this.subject.length - this.pos; }
	remainder() { return this.subject.slice(this.pos); }
	processed() { return this.subject.slice(0, this.pos); }

	peek()		{
		return this.subject[this.pos];
	}
	peekn(n: number) {
		return this.subject.slice(this.pos, this.pos + n);
	}
	get(n: number) {
		const pos = this.pos;
		this.pos = Math.min(pos + n, this.subject.length);
		return this.subject.slice(pos, this.pos);
	}
	skip(c: string) {
		if (this.remainder().startsWith(c)) {
			this.pos += c.length;
			return true;
		}
		return false;
	}
	expect(c: string) {
		if (!this.skip(c)) 
			throw new Error(`Expected '${c}'`);
	}

	match(re: RegExp) {
		const m = re.exec(this.remainder());
		if (m) {
			this.pos += m.index + m[0].length;
			return m[0];
		}
	}
	exec(re: RegExp) {
		const m = re.exec(this.remainder());
		if (m) {
			this.pos += m.index + m[0].length;
			return m;
		}
	}
}

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
