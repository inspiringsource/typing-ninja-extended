<script lang="ts">
	import type { Theme } from '$lib/data';
	import { calculateTypingProgress, type TypingProgressData } from '$lib/utils/progress';

	interface Props {
		currentText: string[];
		userInput: string[];
		currentWordIndex: number;
		gameTheme: Theme;
		isPlaying: boolean;
		isPending: boolean;
	}

	let { currentText, userInput, currentWordIndex, gameTheme, isPlaying, isPending }: Props =
		$props();

	/**
	 * Calculate progress using utility function
	 * Provides comprehensive progress data including percentage, word count, and status
	 */
	let progressData = $derived.by((): TypingProgressData => {
		if (isPending) {
			return {
				progressPercentage: 0,
				wordsCompleted: 0,
				totalWords: currentText.length,
				correctChars: 0,
				totalChars: 0,
				accuracy: 100,
				status: 'start'
			};
		}
		return calculateTypingProgress(currentText, userInput, currentWordIndex);
	});
</script>

<!-- 
	Progress Indicator Component
	
	Usage:
	<ProgressIndicator 
		{currentText} 
		{userInput} 
		{currentWordIndex} 
		{gameTheme} 
		{isPlaying} 
		{isPending} 
	/>
	
	This component calculates and displays typing progress as a percentage.
	Progress is based on correctly typed characters across the entire text.
	The indicator updates live as the user types and shows 100% when complete.
-->

{#if !isPending}
	<div class="progress-container">
		<!-- Main Progress Display -->
		<div class="progress-main {gameTheme.opacityAccentBackgroundColor} {gameTheme.textColor}">
			<div class="progress-percentage">
				<span class="progress-number" class:complete={progressData.status === 'complete'}>
					{progressData.progressPercentage}%
				</span>
			</div>

			<!-- Progress Bar -->
			<div class="progress-bar-container {gameTheme.accentBackgroundColor}">
				<div
					class="progress-bar-fill"
					class:bg-green-500={progressData.status === 'complete'}
					class:bg-blue-500={progressData.status === 'high'}
					class:bg-yellow-500={progressData.status === 'medium'}
					class:bg-orange-500={progressData.status === 'low'}
					class:bg-gray-400={progressData.status === 'start'}
					style="width: {Math.min(progressData.progressPercentage, 100)}%"
				></div>
			</div>

			<!-- Additional Info (optional, shows on hover) -->
			<div class="progress-details">
				<span class="text-sm opacity-75">
					{progressData.wordsCompleted} / {progressData.totalWords} words
				</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.progress-container {
		position: fixed;
		top: 120px;
		right: 20px;
		z-index: 10;
		user-select: none;
	}

	.progress-main {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		border-radius: 12px;
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transition: all 0.3s ease;
		min-width: 120px;
	}

	.progress-main:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
	}

	.progress-percentage {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.progress-number {
		font-size: 1.5rem;
		font-weight: bold;
		font-family:
			'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
		transition: all 0.3s ease;
	}

	.progress-number.complete {
		color: #10b981;
		text-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
	}

	.progress-bar-container {
		width: 100px;
		height: 6px;
		border-radius: 3px;
		overflow: hidden;
		position: relative;
	}

	.progress-bar-fill {
		height: 100%;
		border-radius: 3px;
		transition:
			width 0.3s ease,
			background-color 0.3s ease;
		box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
	}

	.progress-details {
		text-align: center;
		line-height: 1.2;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.progress-container {
			position: static;
			display: flex;
			justify-content: center;
			margin: 16px 0;
		}

		.progress-main {
			flex-direction: row;
			gap: 12px;
			padding: 8px 12px;
		}

		.progress-number {
			font-size: 1.25rem;
		}

		.progress-bar-container {
			width: 80px;
		}
	}

	/* Hide on very small screens to save space */
	@media (max-width: 480px) {
		.progress-details {
			display: none;
		}
	}
</style>
