<!--
  DocumentManager Component
  
  A comprehensive document management system for the typing practice app.
  Features:
  - Add new documents with title, content, and tags
  - View and search through saved documents
  - Filter documents by tags
  - Track and display performance statistics for each document
  - Integrate with typing practice sessions
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { documentStore } from '$lib/stores/document-store';
	import type { DocumentWithPerformance } from '../../../type';
	import DocumentList from './document-list.svelte';
	import DocumentForm from './document-form.svelte';
	import DocumentViewer from './document-viewer.svelte';

	// Component state
	let documents: DocumentWithPerformance[] = $state([]);
	let filteredDocuments: DocumentWithPerformance[] = $state([]);
	let selectedDocument: DocumentWithPerformance | null = $state(null);
	let currentView: 'list' | 'add' | 'view' | 'practice' = $state('list');
	let searchQuery = $state('');
	let selectedTags: string[] = $state([]);
	let availableTags: string[] = $state([]);
	let loading = $state(true);

	// Props for integration with typing practice
	interface Props {
		onStartPractice?: (document: DocumentWithPerformance) => void;
		onSavePerformance?: (documentId: string, performance: {
			wpm: number;
			accuracy: number;
			correctChars: number;
			totalChars: number;
			timeElapsed: number;
		}) => void;
	}

	let { onStartPractice, onSavePerformance }: Props = $props();

	/**
	 * Load documents and update available tags
	 */
	const loadDocuments = async () => {
		try {
			loading = true;
			documents = await documentStore.getDocumentsWithPerformance();
			await updateFilteredDocuments();
			updateAvailableTags();
		} catch (error) {
			console.error('Error loading documents:', error);
		} finally {
			loading = false;
		}
	};

	/**
	 * Update filtered documents based on search query and selected tags
	 */
	const updateFilteredDocuments = async () => {
		let filtered = documents;

		// Apply search query filter
		if (searchQuery.trim()) {
			filtered = await documentStore.searchDocuments(searchQuery);
		}

		// Apply tag filter
		if (selectedTags.length > 0) {
			filtered = filtered.filter(doc =>
				selectedTags.some(tag =>
					doc.tags.some(docTag =>
						docTag.toLowerCase().includes(tag.toLowerCase())
					)
				)
			);
		}

		filteredDocuments = filtered;
	};

	/**
	 * Extract all unique tags from documents
	 */
	const updateAvailableTags = () => {
		const allTags = documents.flatMap(doc => doc.tags);
		availableTags = [...new Set(allTags)].sort();
	};

	/**
	 * Handle adding a new document
	 */
	const handleAddDocument = (event: CustomEvent<{
		title: string;
		content: string;
		tags: string[];
	}>) => {
		const { title, content, tags } = event.detail;
		documentStore.addDocument(title, content, tags);
		loadDocuments();
		currentView = 'list';
	};

	/**
	 * Handle selecting a document for viewing or practicing
	 */
	const handleSelectDocument = (document: DocumentWithPerformance) => {
		selectedDocument = document;
		currentView = 'view';
	};

	/**
	 * Handle starting practice with a document
	 */
	const handleStartPractice = (document: DocumentWithPerformance) => {
		if (onStartPractice) {
			onStartPractice(document);
		} else {
			// Default behavior - switch to practice view
			selectedDocument = document;
			currentView = 'practice';
		}
	};

	/**
	 * Handle saving performance data after a practice session
	 */
	const handleSavePerformance = (performance: {
		wpm: number;
		accuracy: number;
		correctChars: number;
		totalChars: number;
		timeElapsed: number;
	}) => {
		if (selectedDocument) {
			if (onSavePerformance) {
				onSavePerformance(selectedDocument.id, performance);
			} else {
				// Default behavior - save to store
				documentStore.addPerformance(
					selectedDocument.id,
					performance.wpm,
					performance.accuracy,
					performance.correctChars,
					performance.totalChars,
					performance.timeElapsed
				);
			}
			loadDocuments(); // Refresh to show updated stats
		}
	};

	/**
	 * Handle deleting a document
	 */
	const handleDeleteDocument = (documentId: string) => {
		if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
			documentStore.deleteDocument(documentId);
			loadDocuments();
			if (selectedDocument?.id === documentId) {
				selectedDocument = null;
				currentView = 'list';
			}
		}
	};

	/**
	 * Toggle tag filter
	 */
	const toggleTagFilter = (tag: string) => {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter(t => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
		updateFilteredDocuments();
	};

	/**
	 * Clear all filters
	 */
	const clearFilters = () => {
		searchQuery = '';
		selectedTags = [];
		updateFilteredDocuments();
	};

	// Reactive statements to handle search and filter updates
	$effect(() => {
		updateFilteredDocuments();
	});

	// Load documents on component mount
	onMount(() => {
		loadDocuments();
	});
</script>

<div class="document-manager">
	<!-- Header with navigation -->
	<div class="header">
		<div class="title-section">
			<h1>Document Manager</h1>
			<p class="subtitle">Manage your custom typing practice documents</p>
		</div>
		
		<div class="action-buttons">
			<button 
				class="btn {currentView === 'list' ? 'btn-active' : 'btn-secondary'}"
				onclick={() => currentView = 'list'}
			>
				📚 My Documents
			</button>
			<button 
				class="btn {currentView === 'add' ? 'btn-active' : 'btn-primary'}"
				onclick={() => currentView = 'add'}
			>
				➕ Add Document
			</button>
		</div>
	</div>

	<!-- Main content area -->
	<div class="content">
		{#if loading}
			<div class="loading">
				<div class="spinner"></div>
				<p>Loading documents...</p>
			</div>
		{:else if currentView === 'list'}
			<!-- Document List View -->
			<div class="list-view">
				<!-- Search and Filter Controls -->
				<div class="controls">
					<div class="search-section">
						<input
							type="text"
							placeholder="Search documents by title, content, or tags..."
							bind:value={searchQuery}
							class="search-input"
						/>
					</div>

					{#if availableTags.length > 0}
						<div class="tag-filters">
							<h3>Filter by tags:</h3>
							<div class="tag-list">
								{#each availableTags as tag}
									<button
										class="tag-filter {selectedTags.includes(tag) ? 'tag-active' : ''}"
										onclick={() => toggleTagFilter(tag)}
									>
										{tag}
									</button>
								{/each}
							</div>
							{#if selectedTags.length > 0}
								<button class="clear-filters" onclick={clearFilters}>
									Clear filters
								</button>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Document List -->
				<DocumentList
					documents={filteredDocuments}
					onSelect={handleSelectDocument}
					onStartPractice={handleStartPractice}
					onDelete={handleDeleteDocument}
				/>
			</div>
		{:else if currentView === 'add'}
			<!-- Add Document Form -->
			<DocumentForm onSubmit={handleAddDocument} onCancel={() => currentView = 'list'} />
		{:else if currentView === 'view' && selectedDocument}
			<!-- Document Viewer -->
			<DocumentViewer
				document={selectedDocument}
				onStartPractice={() => handleStartPractice(selectedDocument!)}
				onEdit={() => currentView = 'add'}
				onBack={() => currentView = 'list'}
				onDelete={() => handleDeleteDocument(selectedDocument!.id)}
			/>
		{:else if currentView === 'practice' && selectedDocument}
			<!-- Practice Mode Integration Point -->
			<div class="practice-mode">
				<div class="practice-header">
					<h2>Practicing: {selectedDocument.title}</h2>
					<button class="btn-secondary" onclick={() => currentView = 'view'}>
						← Back to Document
					</button>
				</div>
				
				<div class="practice-content">
					<!-- This is where you would integrate with your typing practice component -->
					<div class="placeholder">
						<p>🚧 Typing practice integration point</p>
						<p>This is where the typing practice component would be rendered.</p>
						<p>Document content: <strong>{selectedDocument.title}</strong></p>
						
						<!-- Example of how to handle practice completion -->
						<button 
							class="btn-primary"
							onclick={() => {
								// Example performance data
								handleSavePerformance({
									wpm: 65,
									accuracy: 94.5,
									correctChars: 245,
									totalChars: 260,
									timeElapsed: 60
								});
								currentView = 'view';
							}}
						>
							🎯 Save Example Performance
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- Error state -->
			<div class="error-state">
				<p>Something went wrong. Please try again.</p>
				<button class="btn-primary" onclick={() => currentView = 'list'}>
					← Back to Documents
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.document-manager {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.title-section h1 {
		margin: 0;
		color: #1a202c;
		font-size: 2rem;
		font-weight: 700;
	}

	.subtitle {
		margin: 0.5rem 0 0 0;
		color: #718096;
		font-size: 1rem;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background: #3182ce;
		color: white;
	}

	.btn-primary:hover {
		background: #2c5aa0;
	}

	.btn-secondary {
		background: #e2e8f0;
		color: #4a5568;
	}

	.btn-secondary:hover {
		background: #cbd5e0;
	}

	.btn-active {
		background: #4299e1;
		color: white;
	}

	.content {
		min-height: 400px;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem;
		color: #718096;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid #e2e8f0;
		border-top: 3px solid #3182ce;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.controls {
		background: #f7fafc;
		padding: 1.5rem;
		border-radius: 0.5rem;
		margin-bottom: 2rem;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 1rem;
	}

	.search-input:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}

	.tag-filters {
		margin-top: 1rem;
	}

	.tag-filters h3 {
		margin: 0 0 0.5rem 0;
		color: #4a5568;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.tag-filter {
		padding: 0.25rem 0.75rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 1rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tag-filter:hover {
		border-color: #3182ce;
	}

	.tag-active {
		background: #3182ce;
		color: white;
		border-color: #3182ce;
	}

	.clear-filters {
		padding: 0.25rem 0.5rem;
		background: none;
		border: none;
		color: #3182ce;
		font-size: 0.875rem;
		cursor: pointer;
		text-decoration: underline;
	}

	.practice-mode {
		background: #f7fafc;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.practice-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		background: white;
		border-bottom: 1px solid #e2e8f0;
	}

	.practice-header h2 {
		margin: 0;
		color: #1a202c;
	}

	.practice-content {
		padding: 2rem;
	}

	.placeholder {
		text-align: center;
		padding: 3rem;
		background: white;
		border-radius: 0.5rem;
		border: 2px dashed #e2e8f0;
	}

	.placeholder p {
		margin: 0.5rem 0;
		color: #718096;
	}

	.error-state {
		text-align: center;
		padding: 4rem;
		color: #718096;
	}

	@media (max-width: 768px) {
		.document-manager {
			padding: 1rem;
		}

		.header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.action-buttons {
			justify-content: center;
		}

		.controls {
			padding: 1rem;
		}

		.tag-list {
			gap: 0.25rem;
		}
	}
</style>
