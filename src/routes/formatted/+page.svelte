<script lang="ts">
	import { onMount } from 'svelte';
	import { generateRandomText } from '$lib/utils';
	import TextDisplayFormatted from '$lib/features/home/components/text-display-formatted.svelte';
	import TextDisplaySyntaxHighlighted from '$lib/features/home/components/text-display-syntax-highlighted.svelte';
	import Timer from '$lib/features/home/components/timer.svelte';
	import type { FormattedGameState } from '../../type';
	import Result from '$lib/features/home/components/result.svelte';
	import Filter from '$lib/features/home/components/filter.svelte';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import KeyboardDisplay from '$lib/features/home/components/keyboard-display.svelte';
	import ProgressIndicator from '$lib/features/home/components/progress-indicator.svelte';
	import { themes } from '$lib/data';
	import Header from '$lib/components/header.svelte';
	import { customPracticeStore as formattedCustomPracticeStore } from '$lib/stores/custom-practice-store';
	import { documentStore } from '$lib/stores/document-store';

	let gameStates = $state<FormattedGameState>({
		currentText: '',
		currentCharIndex: 0,
		userInput: '',
		accuracy: 100,
		wpm: 0,
		correctChars: 0,
		totalChars: 0,
		timeElapsed: 0,
		timeElapsedMode: 15,
		totalGenerateWords: 25,
		mode: 'words',
		isPlaying: false,
		isFinish: false,
		isPending: true,
		isShowKeyboard: true,
		isFormattedMode: true,
		isSyntaxHighlighted: false
	});

	let gameTheme = $state(themes[0]);
	let recentKeys: string[] = $state([]);
	let timerInterval: any = $state(0);

	// Custom practice state for formatted text
	let customPracticeState = $state({
		isCustomPractice: false,
		document: null as import('../../type').DocumentWithPerformance | null,
		customText: '' as string | string[],
		isFormattedText: false
	});

	// Syntax highlighting toggle protection
	let syntaxToggleInProgress = $state(false);

	// Subscribe to formatted custom practice store
	formattedCustomPracticeStore.subscribe((state) => {
		customPracticeState = state;
	});

	function initGame() {
		clearInterval(timerInterval);

		// Use custom practice text if available, otherwise generate random text
		if (
			customPracticeState.isCustomPractice &&
			customPracticeState.customText &&
			typeof customPracticeState.customText === 'string'
		) {
			gameStates.currentText = customPracticeState.customText;
		} else {
			// For formatted mode, create a sample formatted text
			const sampleCode = `function fibonacci(n) {
	if (n <= 1) {
		return n;
	}
	return fibonacci(n - 1) + fibonacci(n - 2);
}

// Example usage
console.log(fibonacci(10));`;
			gameStates.currentText = sampleCode;
		}

		gameStates.currentCharIndex = 0;
		gameStates.userInput = '';
		gameStates.accuracy = 100;
		gameStates.wpm = 0;
		gameStates.correctChars = 0;
		gameStates.totalChars = 0;
		gameStates.timeElapsed = 0;
		gameStates.isPlaying = false;
		gameStates.isFinish = false;
		gameStates.isPending = true;
		recentKeys = [];
	}

	function startGame() {
		gameStates.isPlaying = true;
		gameStates.isPending = false;
		gameStates.timeElapsed = gameStates.timeElapsedMode;

		if (gameStates.mode === 'time') {
			timerInterval = setInterval(() => {
				gameStates.timeElapsed--;
				updateWPM();
				if (gameStates.timeElapsed <= 0) {
					stopGame();
				}
			}, 1000);
		} else {
			timerInterval = setInterval(() => {
				gameStates.timeElapsed++;
				updateWPM();
			}, 1000);
		}
	}

	function stopGame() {
		gameStates.isPlaying = false;
		gameStates.isFinish = true;
		clearInterval(timerInterval);
		updateWPM();

		// Save performance if in custom practice mode
		if (customPracticeState.isCustomPractice && customPracticeState.document) {
			documentStore.addPerformance(
				customPracticeState.document.id,
				gameStates.wpm,
				gameStates.accuracy,
				gameStates.correctChars,
				gameStates.totalChars,
				gameStates.timeElapsed
			);
		}
	}

	function updateWPM() {
		if (gameStates.mode === 'time') {
			const timeElapsed = (gameStates.timeElapsedMode - gameStates.timeElapsed) / 60;
			gameStates.wpm = timeElapsed > 0 ? Math.round(gameStates.correctChars / 5 / timeElapsed) : 0;
		} else {
			const timeElapsed = gameStates.timeElapsed / 60;
			gameStates.wpm = timeElapsed > 0 ? Math.round(gameStates.correctChars / 5 / timeElapsed) : 0;
		}
	}

	function onHandleUserInputKeyDown(e: KeyboardEvent) {
		if (!gameStates.isPlaying && gameStates.isPending) {
			startGame();
		}

		if (!gameStates.isPlaying) return;

		const key = e.key;

		// Add the pressed key to recentKeys
		if (key.length === 1 || key === 'Backspace' || key === 'Tab' || key === 'Enter') {
			recentKeys = [
				...recentKeys,
				key === ' ' ? 'Space' : key === '\t' ? 'Tab' : key === '\n' ? 'Enter' : key
			];
		}

		const currentChar = gameStates.currentText[gameStates.currentCharIndex];

		if (key === 'Tab') {
			e.preventDefault(); // Prevent tab from changing focus
			// Insert 4 spaces instead of a tab character
			handleTabInput();
		} else if (key === 'Enter') {
			handleCharacterInput('\n');
		} else if (key.length === 1) {
			handleCharacterInput(key);
		} else if (key === 'Backspace') {
			handleBackspace();
		}

		updateAccuracy();
	}

	function handleTabInput() {
		// When user presses Tab, we want to handle it as 4 spaces
		const expectedChar = gameStates.currentText[gameStates.currentCharIndex];

		if (expectedChar === '\t') {
			// If the expected character is a tab, treat the tab press as correct
			// and add 4 spaces to user input to represent the tab
			gameStates.userInput += '    '; // 4 spaces to represent tab
			gameStates.totalChars += 4; // Count as 4 characters for WPM calculation
			gameStates.correctChars += 4; // All 4 spaces are considered correct
			gameStates.currentCharIndex++; // Move past the expected tab character
		} else {
			// If not expecting a tab, insert 4 spaces as regular characters
			for (let i = 0; i < 4; i++) {
				handleCharacterInput(' ');
			}
		}

		// Check if finished typing all text
		if (gameStates.currentCharIndex >= gameStates.currentText.length) {
			stopGame();
		}
	}

	function handleCharacterInput(inputChar: string) {
		const expectedChar = gameStates.currentText[gameStates.currentCharIndex];

		gameStates.userInput += inputChar;
		gameStates.totalChars++;

		// Enhanced matching logic for tabs and spaces
		let isCorrect = false;

		if (inputChar === expectedChar) {
			// Direct match
			isCorrect = true;
			gameStates.currentCharIndex++;
		} else if (expectedChar === '\t' && inputChar === ' ') {
			// User is typing spaces for a tab - check if we have 4 spaces
			const userInputEnd = gameStates.userInput;
			let trailingSpaces = 0;
			for (let i = userInputEnd.length - 1; i >= 0; i--) {
				if (userInputEnd[i] === ' ') {
					trailingSpaces++;
				} else {
					break;
				}
			}

			if (trailingSpaces === 4) {
				// User has typed 4 spaces, consider it a complete tab
				isCorrect = true;
				gameStates.currentCharIndex++; // Move past the tab character
			} else if (trailingSpaces < 4) {
				// User is still typing spaces for the tab
				isCorrect = true;
				// Don't advance currentCharIndex yet, still expecting more spaces
			}
		} else {
			// Regular mismatch
			gameStates.currentCharIndex++;
		}

		if (isCorrect) {
			gameStates.correctChars++;
		}

		// Check if finished typing all text
		if (gameStates.currentCharIndex >= gameStates.currentText.length) {
			stopGame();
		}
	}

	function handleBackspace() {
		if (gameStates.userInput.length > 0) {
			const removedChar = gameStates.userInput[gameStates.userInput.length - 1];

			// Remove the character from user input
			gameStates.userInput = gameStates.userInput.slice(0, -1);
			gameStates.totalChars = Math.max(0, gameStates.totalChars - 1);

			// Determine what expected character we're backing up from
			const currentExpectedChar = gameStates.currentText[gameStates.currentCharIndex];
			const previousExpectedChar =
				gameStates.currentCharIndex > 0
					? gameStates.currentText[gameStates.currentCharIndex - 1]
					: '';

			// Handle backspace logic for tabs vs regular characters
			if (removedChar === ' ') {
				// Check if we're backspacing within a tab sequence
				let trailingSpaces = 0;
				for (let i = gameStates.userInput.length - 1; i >= 0; i--) {
					if (gameStates.userInput[i] === ' ') {
						trailingSpaces++;
					} else {
						break;
					}
				}

				if (currentExpectedChar === '\t') {
					// We're still within a tab that expects 4 spaces
					gameStates.correctChars = Math.max(0, gameStates.correctChars - 1);
					// Don't change currentCharIndex - still working on the same tab
				} else if (previousExpectedChar === '\t' && trailingSpaces === 3) {
					// We just completed a 4-space tab and are backspacing the 4th space
					gameStates.correctChars = Math.max(0, gameStates.correctChars - 1);
					gameStates.currentCharIndex = Math.max(0, gameStates.currentCharIndex - 1);
				} else {
					// Regular space character
					if (removedChar === previousExpectedChar) {
						gameStates.correctChars = Math.max(0, gameStates.correctChars - 1);
					}
					gameStates.currentCharIndex = Math.max(0, gameStates.currentCharIndex - 1);
				}
			} else {
				// Regular character backspace
				if (removedChar === previousExpectedChar) {
					gameStates.correctChars = Math.max(0, gameStates.correctChars - 1);
				}
				gameStates.currentCharIndex = Math.max(0, gameStates.currentCharIndex - 1);
			}
		}
	}

	function updateAccuracy() {
		gameStates.accuracy =
			gameStates.totalChars > 0
				? Math.round((gameStates.correctChars / gameStates.totalChars) * 100)
				: 100;
	}

	$effect(() => {
		if (gameStates.mode === 'time' && gameStates.timeElapsed === 0 && gameStates.isPlaying) {
			stopGame();
		}
	});

	// Initialize the game state
	initGame();

	// Protected syntax highlighting toggle
	function toggleSyntaxHighlighting() {
		if (syntaxToggleInProgress) return; // Prevent rapid toggling
		if (gameStates.isPlaying) return; // Prevent toggling while typing

		syntaxToggleInProgress = true;
		gameStates.isSyntaxHighlighted = !gameStates.isSyntaxHighlighted;

		// Release the lock after a short delay
		setTimeout(() => {
			syntaxToggleInProgress = false;
		}, 200);
	}
</script>

<svelte:head>
	<title>Typing-Ninja - Formatted Text Mode</title>
	<meta
		name="description"
		content="Typing Ninja with support for formatted text, code snippets, and preserved formatting."
	/>
</svelte:head>

<main class={`flex h-screen flex-col ${gameTheme.backgroundColor}`}>
	<Header isPending={gameStates.isPending} />
	<div class="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5">
		{#if !gameStates.isFinish}
			<div class="mx-auto w-full max-w-4xl">
				{#if customPracticeState.isCustomPractice}
					<div class="mb-6 text-center">
						<div
							class="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
						>
							<span class="text-lg">📄</span>
							<span class="font-medium">Formatted Practice:</span>
							<span class="font-bold">{customPracticeState.document?.title}</span>
						</div>
						<div class="mt-3 flex justify-center gap-4">
							<button
								onclick={toggleSyntaxHighlighting}
								disabled={syntaxToggleInProgress || gameStates.isPlaying}
								class="inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-colors {gameStates.isSyntaxHighlighted
									? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
									: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'} hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-purple-800"
								title={gameStates.isPlaying
									? 'Cannot change highlighting during typing'
									: 'Toggle syntax highlighting'}
							>
								<span class="text-xs">🎨</span>
								{gameStates.isSyntaxHighlighted ? 'Disable' : 'Enable'} Syntax Highlighting
							</button>
						</div>
						<div class="mt-2 flex justify-center gap-4">
							<button
								onclick={() => {
									formattedCustomPracticeStore.clearCustomPractice();
									initGame();
								}}
								class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
							>
								← Exit Custom Practice
							</button>
							<a
								href="/documents"
								class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
							>
								📚 Back to Documents
							</a>
						</div>
					</div>
				{:else}
					<div class="mb-6 text-center">
						<div
							class="inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-800 dark:bg-green-900 dark:text-green-200"
						>
							<span class="text-lg">💻</span>
							<span class="font-medium">Formatted Text Mode</span>
							<span class="text-sm">(Preserves tabs, spaces, and line breaks)</span>
						</div>
						<div class="mt-2">
							<a
								href="/"
								class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
							>
								← Back to Regular Mode
							</a>
						</div>
					</div>
				{/if}

				<Timer isPending={gameStates.isPending} timeElapsed={gameStates.timeElapsed} />

				{#if gameStates.isSyntaxHighlighted}
					<TextDisplaySyntaxHighlighted
						{gameTheme}
						currentText={gameStates.currentText}
						userInput={gameStates.userInput}
						currentCharIndex={gameStates.currentCharIndex}
					/>
				{:else}
					<TextDisplayFormatted
						{gameTheme}
						currentText={gameStates.currentText}
						userInput={gameStates.userInput}
						currentCharIndex={gameStates.currentCharIndex}
					/>
				{/if}

				{#if gameStates.isPending}
					<div class="mt-10 flex flex-col items-center justify-center gap-y-5">
						<Tooltip position="top" {gameTheme}>
							<button onclick={initGame}>
								<img src="/restart_icon.svg" alt="restart_icon" class="size-8" />
							</button>
							{#snippet content()}
								<p class={gameTheme.accentColor}>Restart Text</p>
							{/snippet}
						</Tooltip>
						<p class="animate-pulse text-center text-xl {gameTheme.textColor}">
							Press any key to start typing (Tab and Enter work too!)
						</p>
						<div class="max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
							<p>✨ This mode preserves all formatting including:</p>
							<p>• Line breaks and indentation</p>
							<p>• <strong>Tab handling:</strong> Press Tab OR type 4 spaces</p>
							<p>• Spaces exactly as shown</p>
							<p>• Perfect for practicing code typing!</p>
						</div>
					</div>
				{/if}
			</div>
			{#if gameStates.isPlaying && gameStates.isShowKeyboard}
				<KeyboardDisplay {gameTheme} {recentKeys} />
			{/if}
		{:else}
			<div class="mx-auto mt-36 w-full max-w-xl">
				<div class="mb-6 text-center">
					<div
						class="inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-800 dark:bg-green-900 dark:text-green-200"
					>
						<span class="text-lg">🎉</span>
						<span class="font-medium">Formatted Practice Completed!</span>
					</div>
					{#if customPracticeState.isCustomPractice}
						<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
							Performance saved for: <strong>{customPracticeState.document?.title}</strong>
						</p>
					{/if}
				</div>

				<!-- Results Grid -->
				<div class="grid grid-cols-2 gap-7">
					<div
						class="flex flex-col items-center justify-center gap-y-2 rounded-2xl {gameTheme.opacityAccentBackgroundColor} p-5 transition-all hover:shadow-lg"
					>
						<h3 class="text-2xl">WPM</h3>
						<span class="text-6xl text-yellow-500">{gameStates.wpm}</span>
					</div>
					<div
						class="flex flex-col items-center justify-center gap-y-2 rounded-2xl {gameTheme.opacityAccentBackgroundColor} p-5 transition-all hover:shadow-lg"
					>
						<h3 class="text-2xl">Accuracy</h3>
						<span class="text-6xl text-yellow-500">{gameStates.accuracy}%</span>
					</div>
					<div
						class="flex flex-col items-center justify-center gap-y-2 rounded-2xl {gameTheme.opacityAccentBackgroundColor} p-5 transition-all hover:shadow-lg"
					>
						<h3 class="text-2xl">Characters</h3>
						<div>
							<p>Correct: {gameStates.correctChars}/{gameStates.totalChars}</p>
							<p>
								Incorrect: {gameStates.totalChars - gameStates.correctChars}/{gameStates.totalChars}
							</p>
						</div>
					</div>
					<div
						class="flex flex-col items-center justify-center gap-y-2 rounded-2xl {gameTheme.opacityAccentBackgroundColor} p-5 transition-all hover:shadow-lg"
					>
						<h3 class="text-2xl">Time</h3>
						<span class="text-3xl text-yellow-500">{gameStates.timeElapsed}s</span>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
					<button
						onclick={() => {
							clearInterval(timerInterval);
							initGame();
						}}
						class="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
					>
						🔄 Practice Again
					</button>
					{#if customPracticeState.isCustomPractice}
						<a
							href="/documents"
							class="rounded-lg bg-gray-600 px-6 py-3 text-center text-white transition-colors hover:bg-gray-700"
						>
							📚 Back to Documents
						</a>
					{/if}
					<button
						onclick={() => {
							formattedCustomPracticeStore.clearCustomPractice();
							clearInterval(timerInterval);
							initGame();
						}}
						class="rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700"
					>
						💻 Try Another Code Sample
					</button>
				</div>
			</div>
		{/if}
	</div>
</main>

<svelte:window on:keydown={onHandleUserInputKeyDown} />
