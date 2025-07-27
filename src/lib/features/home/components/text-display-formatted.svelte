<script lang="ts">
import type { Theme } from '$lib/data';

interface Props {
	currentText: string; // Changed from string[] to single string to preserve formatting
	userInput: string;   // Changed from string[] to single string
	currentCharIndex: number; // Track character position instead of word position
	gameTheme: Theme;
}

let { currentText, userInput, currentCharIndex, gameTheme }: Props = $props();
let containerRef: HTMLDivElement | null = $state(null);
let currentCharRef: HTMLSpanElement | null = $state(null);

let charsWithStatus = $derived.by(() => {
	// Create a mapping of user input to expected text, handling tab/space conversions
	let userInputIndex = 0;
	let textChars = currentText.split('');
	
	return textChars.map((char, charIndex) => {
		// Determine status based on complex tab/space logic
		let status: 'correct' | 'incorrect' | 'current' | 'pending' = 'pending';
		let isCurrent = false;
		
		if (charIndex < currentCharIndex) {
			// This character should have been typed already
			if (char === '\t') {
				// Check if user typed 4 spaces or a tab for this tab character
				const userSegment = userInput.slice(userInputIndex, userInputIndex + 4);
				if (userSegment === '    ' || (userInputIndex < userInput.length && userInput[userInputIndex] === '\t')) {
					status = 'correct';
					userInputIndex += userSegment === '    ' ? 4 : 1;
				} else {
					status = 'incorrect';
					// Move past whatever the user typed for this tab
					userInputIndex = Math.min(userInputIndex + 1, userInput.length);
				}
			} else {
				// Regular character matching
				if (userInputIndex < userInput.length && userInput[userInputIndex] === char) {
					status = 'correct';
				} else {
					status = 'incorrect';
				}
				userInputIndex++;
			}
		} else if (charIndex === currentCharIndex) {
			status = 'current';
			isCurrent = true;
		} else {
			status = 'pending';
		}
		
		return {
			char,
			status,
			isCurrent
		};
	});
});

function scrollToCurrentChar() {
	if (containerRef && currentCharRef) {
		const containerRect = containerRef.getBoundingClientRect();
		const charRect = currentCharRef.getBoundingClientRect();

		if (charRect.bottom > containerRect.bottom || charRect.top < containerRect.top) {
			currentCharRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}
}

$effect(() => {
	scrollToCurrentChar();
});
</script>

<div
	bind:this={containerRef}
	class="mt-4 max-h-[400px] select-none overflow-auto rounded-lg border p-4 font-mono text-lg leading-relaxed"
	style="white-space: pre-wrap; tab-size: 4;"
>
	{#each charsWithStatus as { char, status, isCurrent }, charIndex}
		{#if isCurrent}
			<span
				bind:this={currentCharRef}
				class={`
					${status === 'current' && `${gameTheme.accentBgColor} rounded-sm px-1`}
					${status === 'correct' && gameTheme.textColor}
					${status === 'incorrect' && 'bg-red-500/20 text-red-500'}
					${status === 'pending' && 'text-gray-400 dark:text-gray-500'}
					${isCurrent && 'animate-pulse'}
				`}
			>
				{char === '\n' ? '\n' : char === '\t' ? '\t' : char}
			</span>
		{:else}
			<span
				class={`
					${status === 'current' && `${gameTheme.accentBgColor} rounded-sm px-1`}
					${status === 'correct' && gameTheme.textColor}
					${status === 'incorrect' && 'bg-red-500/20 text-red-500'}
					${status === 'pending' && 'text-gray-400 dark:text-gray-500'}
				`}
			>
				{char === '\n' ? '\n' : char === '\t' ? '\t' : char}
			</span>
		{/if}
	{/each}
	
	{#if userInput.length > currentText.length}
		<span class="bg-red-500/20 text-red-500">
			{userInput.slice(currentText.length)}
		</span>
	{/if}
</div>
