<script lang="ts">
	import { goto } from '$app/navigation';
	import DocumentManager from '$lib/features/documents/document-manager.svelte';
	import { customPracticeStore } from '$lib/stores/custom-practice-store';

	import { documentStore } from '$lib/stores/document-store';
	import type { DocumentWithPerformance } from '../../type';

	/**
	 * Handle starting practice with a document (regular mode)
	 * This integrates with the main typing practice component
	 */
	const handleStartPractice = (document: DocumentWithPerformance) => {
		console.log('Starting regular practice with document:', document.title);

		// Set up custom practice in the store
		customPracticeStore.startCustomPractice(document);

		// Navigate to the main typing practice page
		goto('/');
	};

	/**
	 * Handle starting formatted practice with a document
	 * This integrates with the formatted typing practice component
	 */
	const handleStartFormattedPractice = (document: DocumentWithPerformance) => {
		console.log('Starting formatted practice with document:', document.title);

		// Set up formatted custom practice in the store
		customPracticeStore.startCustomPracticeFormatted(document);

		// Navigate to the formatted typing practice page
		goto('/formatted');
	};

	/**
	 * Handle saving performance data after a practice session
	 * This is called from the main typing practice component
	 */
	const handleSavePerformance = (
		documentId: string,
		performance: {
			wpm: number;
			accuracy: number;
			correctChars: number;
			totalChars: number;
			timeElapsed: number;
		}
	) => {
		console.log('Saving performance for document:', documentId, performance);

		// Save performance to the document store
		documentStore.addPerformance(
			documentId,
			performance.wpm,
			performance.accuracy,
			performance.correctChars,
			performance.totalChars,
			performance.timeElapsed
		);

		// Show success message
		alert(
			`Performance saved!\nWPM: ${performance.wpm}\nAccuracy: ${performance.accuracy.toFixed(1)}%`
		);
	};
</script>

<svelte:head>
	<title>Document Manager - Typing Ninja</title>
	<meta name="description" content="Manage your custom typing practice documents" />
</svelte:head>

<div class="documents-page">
	<DocumentManager
		onStartPractice={handleStartPractice}
		onStartFormattedPractice={handleStartFormattedPractice}
		onSavePerformance={handleSavePerformance}
	/>
</div>

<style>
	.documents-page {
		min-height: 100vh;
		background: #f8fafc;
		padding: 2rem 0;
	}

	@media (max-width: 768px) {
		.documents-page {
			padding: 1rem 0;
		}
	}
</style>
