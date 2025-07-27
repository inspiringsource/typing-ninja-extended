export interface HighlightedChar {
	char: string;
	type: string;
	className: string;
	charIndex: number;
}

/**
 * Simple regex-based syntax highlighter
 * This is a lightweight alternative to Prism.js to avoid import issues
 */

const LANGUAGE_PATTERNS = {
	javascript: {
		keywords: /\b(const|let|var|function|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|class|extends|import|export|from|async|await|typeof|instanceof|new|this|super|static|get|set|yield|delete|in|of|with|debugger|null|undefined|true|false)\b/g,
		strings: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
		comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
		numbers: /\b\d+\.?\d*\b/g,
		functions: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/g,
		operators: /[+\-*/%=!<>&|^~?:]/g,
		punctuation: /[{}[\]();,]/g
	},
	typescript: {
		keywords: /\b(const|let|var|function|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|class|extends|import|export|from|async|await|typeof|instanceof|new|this|super|static|get|set|yield|delete|in|of|with|debugger|null|undefined|true|false|interface|type|enum|namespace|module|declare|abstract|readonly|public|private|protected|implements)\b/g,
		strings: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
		comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
		numbers: /\b\d+\.?\d*\b/g,
		functions: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/g,
		operators: /[+\-*/%=!<>&|^~?:]/g,
		punctuation: /[{}[\]();,]/g
	},
	python: {
		keywords: /\b(def|class|if|elif|else|for|while|break|continue|return|import|from|as|try|except|finally|raise|with|assert|lambda|and|or|not|in|is|global|nonlocal|yield|async|await|True|False|None)\b/g,
		strings: /(["'])(?:(?!\1)[^\\]|\\.)*\1|'''[\s\S]*?'''|"""[\s\S]*?"""/g,
		comments: /#.*$/gm,
		numbers: /\b\d+\.?\d*\b/g,
		functions: /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/g,
		operators: /[+\-*/%=!<>&|^~]/g,
		punctuation: /[{}[\]();,]/g
	},
	java: {
		keywords: /\b(public|private|protected|static|final|abstract|class|interface|extends|implements|import|package|if|else|for|while|do|break|continue|return|try|catch|finally|throw|throws|new|this|super|instanceof|synchronized|volatile|transient|native|strictfp|assert|enum|void|boolean|byte|char|short|int|long|float|double|true|false|null)\b/g,
		strings: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g,
		comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
		numbers: /\b\d+\.?\d*[LlFfDd]?\b/g,
		functions: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/g,
		operators: /[+\-*/%=!<>&|^~?:]/g,
		punctuation: /[{}[\]();,]/g
	}
};

/**
 * Auto-detect programming language from code content
 */
export function detectLanguage(code: string): keyof typeof LANGUAGE_PATTERNS {
	const content = code.toLowerCase().trim();
	
	// TypeScript patterns (check before JavaScript)
	if (content.includes('interface') || content.includes('type ') || content.includes(': string') || content.includes(': number')) {
		return 'typescript';
	}
	
	// JavaScript patterns
	if (content.includes('function') && (content.includes('const') || content.includes('let') || content.includes('=>'))) {
		return 'javascript';
	}
	
	// Python patterns
	if (content.includes('def ') || content.includes('import ') || content.includes('print(') || content.includes('if __name__')) {
		return 'python';
	}
	
	// Java patterns
	if (content.includes('public class') || content.includes('public static void main') || content.includes('System.out.print')) {
		return 'java';
	}
	
	// Default to JavaScript
	return 'javascript';
}

/**
 * Simple syntax highlighting using regex patterns
 */
export function highlightCode(code: string, language?: keyof typeof LANGUAGE_PATTERNS): HighlightedChar[] {
	const detectedLanguage = language || detectLanguage(code);
	const patterns = LANGUAGE_PATTERNS[detectedLanguage] || LANGUAGE_PATTERNS.javascript;
	
	// Create character array with token information
	const chars: HighlightedChar[] = code.split('').map((char, index) => ({
		char,
		type: 'plain',
		className: 'token-plain',
		charIndex: index
	}));
	
	// Apply syntax highlighting patterns
	Object.entries(patterns).forEach(([tokenType, pattern]) => {
		let match;
		const regex = new RegExp(pattern.source, pattern.flags);
		
		while ((match = regex.exec(code)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			
			// Mark characters in this range with the token type
			for (let i = start; i < end && i < chars.length; i++) {
				// Only override if not already highlighted with a more specific token
				if (chars[i].type === 'plain' || tokenType === 'keywords') {
					chars[i].type = tokenType;
					chars[i].className = `token-${tokenType}`;
				}
			}
		}
	});
	
	return chars;
}

/**
 * Get CSS color for token type (Tailwind-compatible)
 */
export function getTokenColor(type: string, status: 'correct' | 'incorrect' | 'current' | 'pending'): string {
	// Base colors for different token types
	const baseColors: Record<string, string> = {
		keywords: 'text-purple-600 dark:text-purple-400',
		strings: 'text-green-600 dark:text-green-400',
		comments: 'text-gray-500 dark:text-gray-400',
		numbers: 'text-blue-600 dark:text-blue-400',
		functions: 'text-yellow-600 dark:text-yellow-400',
		operators: 'text-red-600 dark:text-red-400',
		punctuation: 'text-gray-700 dark:text-gray-300',
		plain: 'text-gray-800 dark:text-gray-200'
	};
	
	// Status-based color overrides
	const statusColors: Record<typeof status, string> = {
		correct: 'text-emerald-600 dark:text-emerald-400',
		incorrect: 'text-red-500 dark:text-red-400',
		current: 'text-blue-800 dark:text-blue-200',
		pending: baseColors[type] || baseColors.plain
	};
	
	return statusColors[status];
}
