<script lang="ts">
	import { onMount } from 'svelte';
	import { generateRandomText } from '$lib/utils';
	import TextDisplay from '$lib/features/home/components/text-display.svelte';
	import Timer from '$lib/features/home/components/timer.svelte';
	import type { GameState } from '../type';
	import Result from '$lib/features/home/components/result.svelte';
	import Filter from '$lib/features/home/components/filter.svelte';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import KeyboardDisplay from '$lib/features/home/components/keyboard-display.svelte';
	import ProgressIndicator from '$lib/features/home/components/progress-indicator.svelte';
	import { themes } from '$lib/data';
	import Header from '$lib/components/header.svelte';
	import { customPracticeStore } from '$lib/stores/custom-practice-store';
	import { documentStore } from '$lib/stores/document-store';

	let gameStates = $state<GameState>({
		currentText: [],
		currentWordIndex: 0,
		userInput: [],
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
		isShowKeyboard: true
	});

	let gameTheme = $state(themes[0]);

	let recentKeys: string[] = $state([]);
	let timerInterval: any = $state(0);

	// Custom practice state
	let customPracticeState = $state({
		isCustomPractice: false,
		document: null as import('../type').DocumentWithPerformance | null,
		customText: [] as string[] | string,
		isFormattedText: false
	});

	// Subscribe to custom practice store
	customPracticeStore.subscribe((state) => {
		customPracticeState = state;
	});

	const startTimer = () => {
		stopTimer();
		timerInterval = setInterval(() => {
			if (gameStates.mode === 'time') {
				gameStates.timeElapsed--;
			} else {
				gameStates.timeElapsed++;
			}
			updateWPM();
		}, 1000);
	};

	const stopTimer = () => {
		clearInterval(timerInterval);
	};

	const updateWPM = () => {
		const minutes =
			gameStates.mode === 'time'
				? (gameStates.timeElapsedMode - gameStates.timeElapsed) / 60
				: gameStates.timeElapsed / 60;
		const wordsTyped = gameStates.correctChars / 5; // Assuming average word length of 5 characters
		gameStates.wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
	};

	const initGame = () => {
		gameStates.isPlaying = false;
		gameStates.isFinish = false;
		gameStates.isPending = true;
		gameStates.isShowKeyboard = true;
		gameStates.currentWordIndex = 0;
		gameStates.correctChars = 0;
		gameStates.totalChars = 0;
		gameStates.accuracy = 100;
		gameStates.wpm = 0;

		// Check if we have custom practice text (and it's in the correct format for this mode)
		if (
			customPracticeState.isCustomPractice &&
			Array.isArray(customPracticeState.customText) &&
			customPracticeState.customText.length > 0
		) {
			gameStates.currentText = customPracticeState.customText;
			gameStates.timeElapsed = 0;
			// Force to words mode for custom practice
			gameStates.mode = 'words';
		} else if (gameStates.mode === 'words') {
			gameStates.currentText = generateRandomText(gameStates.totalGenerateWords);
			gameStates.timeElapsed = 0;
		} else {
			gameStates.currentText = generateRandomText(100); // Generate a large number of words for time mode
			gameStates.timeElapsed = gameStates.timeElapsedMode;
		}
		gameStates.userInput = gameStates.currentText.map(() => '');
	};

	// Initialize game on mount
	onMount(() => {
		initGame();
		return () => {
			stopTimer();
		};
	});

	const startGame = () => {
		gameStates.isPending = false;
		gameStates.isPlaying = true;
		startTimer();
	};

	const stopGame = () => {
		gameStates.isPlaying = false;
		gameStates.isFinish = true;
		gameStates.isPending = false;
		stopTimer();

		// Save performance data for custom practice
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
	};

	function onHandleUserInputKeyDown(e: KeyboardEvent) {
		if (!gameStates.isPlaying && gameStates.isPending) {
			startGame();
		}

		if (!gameStates.isPlaying) return;

		const key = e.key;

		// Add the pressed key to recentKeys
		if (key.length === 1 || key === 'Backspace' || key === 'Space') {
			recentKeys = [...recentKeys, key === ' ' ? 'Space' : key];
		}

		const currentWord = gameStates.currentText[gameStates.currentWordIndex];
		let currentInput = gameStates.userInput[gameStates.currentWordIndex];

		if (key === ' ') {
			if (gameStates.currentWordIndex < gameStates.currentText.length - 1) {
				gameStates.currentWordIndex++;
			} else if (gameStates.mode === 'words') {
				stopGame();
			}
		} else if (key.length === 1) {
			currentInput += key;
			gameStates.userInput[gameStates.currentWordIndex] = currentInput;
			gameStates.totalChars++;

			if (gameStates.mode === 'words') {
				if (gameStates.currentWordIndex === gameStates.userInput.length - 1) {
					if (
						gameStates.currentText[gameStates.currentWordIndex].length ===
						gameStates.userInput[gameStates.userInput.length - 1].length
					) {
						stopGame();
					}
				}
			}

			if (
				currentInput.length <= currentWord.length &&
				key === currentWord[currentInput.length - 1]
			) {
				gameStates.correctChars++;
			}
		} else if (key === 'Backspace') {
			if (currentInput.length > 0) {
				const lastChar = currentInput[currentInput.length - 1];
				const expectedChar = currentWord[currentInput.length - 1];

				currentInput = currentInput.slice(0, -1);
				gameStates.userInput[gameStates.currentWordIndex] = currentInput;
				gameStates.totalChars--;

				if (lastChar === expectedChar) {
					gameStates.correctChars--;
				}
			} else if (gameStates.currentWordIndex > 0) {
				gameStates.currentWordIndex--;
			}
		}

		updateAccuracy();
	}

	function updateAccuracy() {
		gameStates.accuracy =
			Math.round((gameStates.correctChars / gameStates.totalChars) * 100) || 100;
	}

	$effect(() => {
		if (gameStates.mode === 'time' && gameStates.timeElapsed === 0 && gameStates.isPlaying) {
			stopGame();
		}
	});
</script>

<svelte:head>
	<title>Typing-Ninja</title>
	<meta
		name="description"
		content="Typing Ninja is a open-source testing web application with minimalistic design and customization."
	/>
	<meta property="og_site_name" content="“Typing-Ninja" />
	<meta property="og:url" content="https://typing-ninja-two.vercel.app" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={'Typing-Ninja'} />
	<meta
		property="og:description"
		content={'Typing Ninja is a open-source testing web application with minimalistic design and customization.'}
	/>
	<meta property="og:image" content={'https://typing-ninja-two.vercel.app'} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:domain" content="https://typing-ninja-two.vercel.app" />
	<meta property="twitter:url" content="https://typing-ninja-two.vercel.app" />
	<meta name="twitter:title" content={'Typing-Ninja'} />
	<meta
		name="twitter:description"
		content={'Typing Ninja is a open-source testing web application with minimalistic design and customization.'}
	/>
	<meta name="twitter:image" content={'https://typing-ninja-two.vercel.app'} />
</svelte:head>

<main
	class="flex h-full flex-col {gameTheme.backgroundColor}  font-mono {gameTheme.textColor} px-4"
>
	<div class="flex flex-col">
		{#if !gameStates.isFinish}
			<Header isPending={gameStates.isPending} />
			<div class="mx-auto mb-10 mt-32 max-w-6xl md:mt-28">
				{#if gameStates.isPending}
					{#if customPracticeState.isCustomPractice}
						<!-- Custom Practice Header -->
						<div class="mb-6 text-center">
							<div
								class="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
							>
								<span class="text-lg">📄</span>
								<span class="font-medium">Custom Practice:</span>
								<span class="font-bold">{customPracticeState.document?.title}</span>
							</div>
							<div class="mt-2 flex justify-center gap-4">
								<button
									onclick={() => {
										customPracticeStore.clearCustomPractice();
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
						<Filter bind:gameStates bind:gameTheme />

						<!-- Mode Selection -->
						<div class="mb-4 text-center">
							<div class="inline-flex items-center gap-2 text-sm">
								<span class="text-gray-500 dark:text-gray-400">Try different modes:</span>
								<a
									href="/formatted"
									class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
								>
									💻 Code Practice Mode (Formatted)
								</a>
								<span class="text-gray-400">•</span>
								<a
									href="/documents"
									class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
								>
									📚 Documents
								</a>
							</div>
						</div>
					{/if}
				{/if}
				<Timer isPending={gameStates.isPending} timeElapsed={gameStates.timeElapsed} />

				<TextDisplay
					{gameTheme}
					currentText={gameStates.currentText}
					userInput={gameStates.userInput}
					currentWordIndex={gameStates.currentWordIndex}
				/>

				<!-- Progress Indicator - shows typing progress as percentage -->
				<ProgressIndicator
					currentText={gameStates.currentText}
					userInput={gameStates.userInput}
					currentWordIndex={gameStates.currentWordIndex}
					{gameTheme}
					isPlaying={gameStates.isPlaying}
					isPending={gameStates.isPending}
				/>
				{#if gameStates.isPending}
					<div class="mt-10 flex flex-col items-center justify-center gap-y-5">
						{#if gameStates.mode === 'words' && !customPracticeState.isCustomPractice}
							<Tooltip position="top" {gameTheme}>
								<button
									onclick={() => {
										gameStates.currentText = generateRandomText(gameStates.totalGenerateWords);
									}}
								>
									<img src="/restart_icon.svg" alt="restart_icon" class="size-8" />
								</button>
								{#snippet content()}
									<p class={gameTheme.accentColor}>Restart Text</p>
								{/snippet}
							</Tooltip>
						{:else if customPracticeState.isCustomPractice}
							<Tooltip position="top" {gameTheme}>
								<button onclick={initGame}>
									<img src="/restart_icon.svg" alt="restart_icon" class="size-8" />
								</button>
								{#snippet content()}
									<p class={gameTheme.accentColor}>Restart Document</p>
								{/snippet}
							</Tooltip>
						{/if}
						<p class="animate-pulse text-center text-xl {gameTheme.textColor}">
							Press any key to start
						</p>
					</div>
				{/if}
			</div>
			{#if gameStates.isPlaying && gameStates.isShowKeyboard}
				<KeyboardDisplay {gameTheme} {recentKeys} />
			{/if}
		{:else if customPracticeState.isCustomPractice}
			<!-- Custom Practice Results -->
			<div class="mx-auto mt-36 w-full max-w-xl">
				<!-- Success Message -->
				<div class="mb-6 text-center">
					<div
						class="inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-800 dark:bg-green-900 dark:text-green-200"
					>
						<span class="text-lg">🎉</span>
						<span class="font-medium">Document Practice Completed!</span>
					</div>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Performance saved for: <strong>{customPracticeState.document?.title}</strong>
					</p>
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
						class="flex flex-col items-center justify-center gap-y-2 rounded-2xl bg-neutral-900/60 p-5 transition-all hover:shadow-lg {gameTheme.opacityAccentBackgroundColor}"
					>
						<h3 class="text-2xl">Accuracy</h3>
						<span class="text-6xl text-yellow-500">{gameStates.accuracy}%</span>
					</div>
					<div
						class="flex flex-col items-center justify-center gap-y-2 rounded-2xl bg-neutral-900/60 p-5 transition-all hover:shadow-lg {gameTheme.opacityAccentBackgroundColor}"
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
						class="flex flex-col items-center justify-center gap-y-2 rounded-2xl bg-neutral-900/60 p-5 transition-all hover:shadow-lg {gameTheme.opacityAccentBackgroundColor}"
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
					<a
						href="/documents"
						class="rounded-lg bg-gray-600 px-6 py-3 text-center text-white transition-colors hover:bg-gray-700"
					>
						📚 Back to Documents
					</a>
					<button
						onclick={() => {
							customPracticeStore.clearCustomPractice();
							clearInterval(timerInterval);
							initGame();
						}}
						class="rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700"
					>
						🆕 Try Random Text
					</button>
				</div>
			</div>
		{:else}
			<Result {timerInterval} {initGame} {gameStates} {gameTheme} />
		{/if}
	</div>
</main>

<svelte:window on:keydown={onHandleUserInputKeyDown} />
