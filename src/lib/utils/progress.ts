/**
 * Typing Progress Utilities
 * 
 * This module provides utilities for calculating typing progress in a typing test application.
 * It includes functions to calculate progress percentages, word completion, and accuracy metrics.
 */

export interface TypingProgressData {
	/** Progress percentage (0-100) based on correctly typed characters */
	progressPercentage: number;
	/** Number of words completed correctly */
	wordsCompleted: number;
	/** Total number of words in the text */
	totalWords: number;
	/** Number of characters typed correctly */
	correctChars: number;
	/** Total number of characters in the text */
	totalChars: number;
	/** Current accuracy percentage */
	accuracy: number;
	/** Status indicator for styling ('start', 'low', 'medium', 'high', 'complete') */
	status: 'start' | 'low' | 'medium' | 'high' | 'complete';
}

/**
 * Calculate comprehensive typing progress metrics
 * 
 * @param currentText - Array of words that make up the full text
 * @param userInput - Array of user input for each word
 * @param currentWordIndex - Index of the word currently being typed
 * @returns TypingProgressData object with all progress metrics
 * 
 * @example
 * ```typescript
 * const progress = calculateTypingProgress(
 *   ['hello', 'world', 'test'],
 *   ['hello', 'wor', ''],
 *   1
 * );
 * console.log(progress.progressPercentage); // e.g., 73.3
 * console.log(progress.wordsCompleted); // 1
 * ```
 */
export function calculateTypingProgress(
	currentText: string[],
	userInput: string[],
	currentWordIndex: number
): TypingProgressData {
	// Handle edge cases
	if (!currentText.length) {
		return {
			progressPercentage: 0,
			wordsCompleted: 0,
			totalWords: 0,
			correctChars: 0,
			totalChars: 0,
			accuracy: 100,
			status: 'start'
		};
	}

	// Calculate total characters in the entire text
	const totalChars = currentText.reduce((total, word) => total + word.length, 0);
	const totalWords = currentText.length;
	
	let correctChars = 0;
	let wordsCompleted = 0;
	let totalTypedChars = 0;

	// Analyze each word for progress calculation
	for (let wordIndex = 0; wordIndex < currentText.length; wordIndex++) {
		const word = currentText[wordIndex];
		const input = userInput[wordIndex] || '';
		
		// Count total characters typed (for accuracy calculation)
		totalTypedChars += input.length;
		
		// For completed words (before current word)
		if (wordIndex < currentWordIndex) {
			// Count characters that match exactly
			let wordCorrectChars = 0;
			for (let charIndex = 0; charIndex < Math.min(word.length, input.length); charIndex++) {
				if (word[charIndex] === input[charIndex]) {
					correctChars++;
					wordCorrectChars++;
				}
			}
			
			// Consider word completed if fully and correctly typed
			if (input.length >= word.length && wordCorrectChars === word.length) {
				wordsCompleted++;
			}
		}
		// For the current word being typed
		else if (wordIndex === currentWordIndex) {
			// Count correct characters typed so far in current word
			for (let charIndex = 0; charIndex < Math.min(word.length, input.length); charIndex++) {
				if (word[charIndex] === input[charIndex]) {
					correctChars++;
				}
			}
		}
		// Future words don't contribute to progress yet
	}

	// Calculate metrics
	const progressPercentage = totalChars > 0 
		? Math.round((correctChars / totalChars) * 1000) / 10 
		: 0;
		
	const accuracy = totalTypedChars > 0 
		? Math.round((correctChars / totalTypedChars) * 100) 
		: 100;

	// Determine status for styling
	let status: TypingProgressData['status'];
	if (progressPercentage >= 100) status = 'complete';
	else if (progressPercentage >= 75) status = 'high';
	else if (progressPercentage >= 50) status = 'medium';
	else if (progressPercentage >= 25) status = 'low';
	else status = 'start';

	return {
		progressPercentage,
		wordsCompleted,
		totalWords,
		correctChars,
		totalChars,
		accuracy,
		status
	};
}

/**
 * Calculate simple character-based progress percentage
 * 
 * @param currentText - Array of words
 * @param userInput - Array of user input
 * @param currentWordIndex - Current word index
 * @returns Progress percentage (0-100)
 * 
 * @example
 * ```typescript
 * const percentage = calculateProgressPercentage(['hello', 'world'], ['hello', 'wor'], 1);
 * console.log(percentage); // 70.0
 * ```
 */
export function calculateProgressPercentage(
	currentText: string[],
	userInput: string[],
	currentWordIndex: number
): number {
	const progress = calculateTypingProgress(currentText, userInput, currentWordIndex);
	return progress.progressPercentage;
}

/**
 * Get progress status category for styling
 * 
 * @param progressPercentage - Progress percentage (0-100)
 * @returns Status category
 */
export function getProgressStatus(progressPercentage: number): TypingProgressData['status'] {
	if (progressPercentage >= 100) return 'complete';
	if (progressPercentage >= 75) return 'high';
	if (progressPercentage >= 50) return 'medium';
	if (progressPercentage >= 25) return 'low';
	return 'start';
}

/**
 * Svelte store for reactive progress tracking
 * 
 * Usage in Svelte components:
 * ```svelte
 * <script>
 *   import { createProgressStore } from '$lib/utils/progress';
 *   
 *   const progressStore = createProgressStore();
 *   
 *   // Update when typing state changes
 *   $: progressStore.update(currentText, userInput, currentWordIndex);
 * </script>
 * 
 * <div>Progress: {$progressStore.progressPercentage}%</div>
 * ```
 */
export function createProgressStore() {
	let currentProgress = $state<TypingProgressData>({
		progressPercentage: 0,
		wordsCompleted: 0,
		totalWords: 0,
		correctChars: 0,
		totalChars: 0,
		accuracy: 100,
		status: 'start'
	});

	return {
		get progress() {
			return currentProgress;
		},
		
		update(currentText: string[], userInput: string[], currentWordIndex: number) {
			currentProgress = calculateTypingProgress(currentText, userInput, currentWordIndex);
		},
		
		reset() {
			currentProgress = {
				progressPercentage: 0,
				wordsCompleted: 0,
				totalWords: 0,
				correctChars: 0,
				totalChars: 0,
				accuracy: 100,
				status: 'start'
			};
		}
	};
}
