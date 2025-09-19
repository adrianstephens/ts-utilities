
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


//-----------------------------------------------------------------------------
// Glob pattern to regex
//-----------------------------------------------------------------------------

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
