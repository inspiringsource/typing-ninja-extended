<script lang="ts">
	import DocumentManager from '$lib/features/documents/document-manager.svelte';
	import type { DocumentWithPerformance } from '../../type';

	/**
	 * Handle starting practice with a document
	 * This would integrate with your existing typing practice component
	 */
	const handleStartPractice = (document: DocumentWithPerformance) => {
		console.log('Starting practice with document:', document.title);
		// Here you would:
		// 1. Navigate to the practice route/component
		// 2. Pass the document content to your typing test component
		// 3. Set up the typing test with the custom text
		
		// Example integration:
		// goto(`/practice?documentId=${document.id}`);
		// OR
		// Set some global state that the practice component can read
		alert(`Practice mode would start with: "${document.title}"\n\nContent preview: ${document.content.substring(0, 100)}...`);
	};

	/**
	 * Handle saving performance data after a practice session
	 * This would be called from your typing practice component
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
		// The DocumentManager component will handle saving to localStorage automatically
		// You might also want to:
		// 1. Show a success notification
		// 2. Navigate back to the document list
		// 3. Update any global state
	};
</script>

<svelte:head>
	<title>Document Manager - Typing Ninja</title>
	<meta name="description" content="Manage your custom typing practice documents" />
</svelte:head>

<div class="documents-page">
	<DocumentManager
		onStartPractice={handleStartPractice}
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
