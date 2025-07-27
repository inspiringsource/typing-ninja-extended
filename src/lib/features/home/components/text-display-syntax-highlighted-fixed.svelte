<script lang="ts">
import type { Theme } from '$lib/data';
import { highlightCode, detectLanguage, getTokenColor } from '$lib/utils/syntax-highlighter';

interface Props {
	currentText: string;
	userInput: string;
	currentCharIndex: number;
	gameTheme: Theme;
	language?: string; // Optional language override
}

let { currentText, userInput, currentCharIndex, gameTheme, language }: Props = $props();
let containerRef: HTMLDivElement | null = $state(null);
let currentCharRef: HTMLSpanElement | null = $state(null);
let highlightedChars: any[] = $state([]);
let detectedLang = $state('');

// Highlight the code when text changes
$effect(() => {
	if (currentText) {
		detectedLang = language || detectLanguage(currentText);
		try {
			highlightedChars = highlightCode(currentText, detectedLang as keyof typeof LANGUAGE_PATTERNS);
		} catch (error) {
			console.warn('Syntax highlighting failed, using plain text:', error);
			// Fallback to plain highlighting
			highlightedChars = currentText.split('').map((char, index) => ({
				char,
				type: 'plain',
				className: 'token-plain',
				charIndex: index
			}));
		}
	}
});

// Simple character status mapping without complex tab logic
let charsWithStatus = $derived.by(() => {
	if (!highlightedChars.length) return [];
	
	return highlightedChars.map((highlightedChar, charIndex) => {
		const { char, type, className } = highlightedChar;
		
		let status: 'correct' | 'incorrect' | 'current' | 'pending' = 'pending';
		let isCurrent = false;
		
		if (charIndex < currentCharIndex) {
			// Character has been typed - check if it's correct
			const userChar = userInput[charIndex];
			status = userChar === char ? 'correct' : 'incorrect';
		} else if (charIndex === currentCharIndex) {
			status = 'current';
			isCurrent = true;
		} else {
			status = 'pending';
		}
		
		return {
			char,
			type,
			className,
			status,
			isCurrent,
			colorClass: getTokenColor(type, status)
		};
	});
});

// Optimized scrolling - only scroll when current character changes and is out of view
let lastCurrentIndex = $state(-1);
$effect(() => {
	if (currentCharIndex !== lastCurrentIndex && currentCharIndex !== -1) {
		lastCurrentIndex = currentCharIndex;
		// Use a small delay to ensure DOM is updated
		setTimeout(() => {
			if (containerRef && currentCharRef) {
				const containerRect = containerRef.getBoundingClientRect();
				const charRect = currentCharRef.getBoundingClientRect();

				// Only scroll if current character is completely out of view
				if (charRect.bottom > containerRect.bottom + 20 || charRect.top < containerRect.top - 20) {
					currentCharRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}
		}, 10);
	}
});
</script>

<div class="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
	<span class="flex items-center gap-1">
		<span class="inline-block w-2 h-2 bg-purple-500 rounded-full"></span>
		Language: <strong class="text-purple-600 dark:text-purple-400">{detectedLang}</strong>
	</span>
	<span class="text-gray-400">•</span>
	<span class="flex items-center gap-1">
		<span class="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
		Syntax Highlighting: <strong class="text-blue-600 dark:text-blue-400">Enabled</strong>
	</span>
</div>

<div
	bind:this={containerRef}
	class="mt-4 max-h-[400px] select-none overflow-auto rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4 font-mono text-lg leading-relaxed shadow-sm"
	style="white-space: pre-wrap; tab-size: 4;"
>
	{#each charsWithStatus as charData, charIndex}
		{@const { char, status, isCurrent, colorClass } = charData}
		{#if isCurrent}
			<span
				bind:this={currentCharRef}
				class="relative {colorClass} bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
				style="box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);"
			>{char === '\n' ? '\n' : char === '\t' ? '\t' : char}</span>
		{:else}
			<span
				class="{status === 'correct' ? 'bg-green-100 dark:bg-green-900/30' : ''} {status === 'incorrect' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : ''} {colorClass} {status === 'pending' ? 'opacity-70' : ''}"
			>{char === '\n' ? '\n' : char === '\t' ? '\t' : char}</span>
		{/if}
	{/each}
	
	{#if userInput.length > currentText.length}
		<span class="bg-red-500/20 text-red-500">
			{userInput.slice(currentText.length)}
		</span>
	{/if}
</div>

<style>
	/* Additional syntax highlighting styles */
	:global(.token.keyword) {
		font-weight: 600;
	}
	
	:global(.token.string) {
		font-style: normal;
	}
	
	:global(.token.comment) {
		font-style: italic;
		opacity: 0.8;
	}
	
	:global(.token.function) {
		font-weight: 500;
	}
	
	:global(.token.operator) {
		font-weight: 600;
	}
	
	:global(.token.number) {
		font-weight: 500;
	}
</style>
