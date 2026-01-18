<script lang="ts">
	/**
	 * Simple Demo Component - Shows how to integrate the progress indicator
	 * This is a minimal example of how to use the progress utilities
	 */
	import { calculateTypingProgress } from '$lib/utils/progress';
	import type { Theme } from '$lib/data';

	interface Props {
		gameTheme: Theme;
	}

	let { gameTheme }: Props = $props();

	// Demo typing state
	let demoText = $state(['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog']);
	let demoInput = $state(['The', 'qui', '', '', '', '', '', '', '']);
	let demoWordIndex = $state(1);

	// Calculate progress using utility
	let progress = $derived(calculateTypingProgress(demoText, demoInput, demoWordIndex));

	// Simulate typing for demo
	const simulateTyping = () => {
		if (demoWordIndex < demoText.length - 1) {
			// Complete current word and move to next
			demoInput[demoWordIndex] = demoText[demoWordIndex];
			demoWordIndex++;
			demoInput[demoWordIndex] = '';
		} else if (demoInput[demoWordIndex].length < demoText[demoWordIndex].length) {
			// Add next character to current word
			const targetWord = demoText[demoWordIndex];
			const currentLength = demoInput[demoWordIndex].length;
			demoInput[demoWordIndex] = targetWord.substring(0, currentLength + 1);
		}

		// Trigger reactivity
		demoInput = [...demoInput];
	};

	const resetDemo = () => {
		demoInput = ['The', 'qui', '', '', '', '', '', '', ''];
		demoWordIndex = 1;
	};
</script>

<!-- Demo Progress Display -->
<div class="demo-container">
	<h3 class="{gameTheme.textColor} mb-4 text-xl font-bold">Progress Indicator Demo</h3>

	<!-- Progress Display -->
	<div class="progress-demo {gameTheme.opacityAccentBackgroundColor} {gameTheme.textColor}">
		<div class="progress-main">
			<!-- Percentage -->
			<div class="mb-2 font-mono text-3xl font-bold">
				{progress.progressPercentage}%
			</div>

			<!-- Progress Bar -->
			<div class="progress-bar-bg {gameTheme.accentBackgroundColor}">
				<div
					class="progress-bar-fill"
					class:bg-green-500={progress.status === 'complete'}
					class:bg-blue-500={progress.status === 'high'}
					class:bg-yellow-500={progress.status === 'medium'}
					class:bg-orange-500={progress.status === 'low'}
					class:bg-gray-400={progress.status === 'start'}
					style="width: {progress.progressPercentage}%"
				></div>
			</div>

			<!-- Stats -->
			<div class="mt-2 text-sm opacity-75">
				<div>Words: {progress.wordsCompleted} / {progress.totalWords}</div>
				<div>Characters: {progress.correctChars} / {progress.totalChars}</div>
				<div>Status: {progress.status}</div>
			</div>
		</div>
	</div>

	<!-- Demo Text Display -->
	<div class="demo-text mt-4">
		{#each demoText as word, index}
			<span
				class="demo-word {gameTheme.textColor}"
				class:current={index === demoWordIndex}
				class:completed={index < demoWordIndex}
			>
				{#each word.split('') as char, charIndex}
					<span
						class:correct={demoInput[index] && demoInput[index][charIndex] === char}
						class:incorrect={demoInput[index] &&
							demoInput[index][charIndex] &&
							demoInput[index][charIndex] !== char}
						class:pending={!demoInput[index] || !demoInput[index][charIndex]}
					>
						{char}
					</span>
				{/each}
			</span>
		{/each}
	</div>

	<!-- Demo Controls -->
	<div class="demo-controls mt-4 flex gap-2">
		<button
			onclick={simulateTyping}
			class="rounded px-3 py-1 {gameTheme.accentBgColor} {gameTheme.textColor}"
		>
			Type Next
		</button>
		<button onclick={resetDemo} class="rounded bg-gray-500 px-3 py-1 text-white"> Reset </button>
	</div>
</div>

<style>
	.demo-container {
		max-width: 500px;
		margin: 0 auto;
		padding: 20px;
	}

	.progress-demo {
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 20px;
	}

	.progress-main {
		text-align: center;
	}

	.progress-bar-bg {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		margin: 10px 0;
	}

	.progress-bar-fill {
		height: 100%;
		transition:
			width 0.3s ease,
			background-color 0.3s ease;
		border-radius: 4px;
	}

	.demo-text {
		font-family:
			'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
		font-size: 1.5rem;
		line-height: 1.8;
		margin: 20px 0;
	}

	.demo-word {
		margin-right: 0.5rem;
		padding: 2px 4px;
		border-radius: 4px;
	}

	.demo-word.current {
		background-color: rgba(59, 130, 246, 0.2);
	}

	.demo-word.completed {
		opacity: 0.7;
	}

	.demo-word span.correct {
		color: #10b981;
	}

	.demo-word span.incorrect {
		color: #ef4444;
		background-color: rgba(239, 68, 68, 0.1);
	}

	.demo-word span.pending {
		color: #6b7280;
	}

	.demo-controls button {
		transition: all 0.2s ease;
	}

	.demo-controls button:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}
</style>
