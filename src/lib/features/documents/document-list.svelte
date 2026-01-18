<!--
  DocumentList Component
  
  Displays a list of documents with their metadata and performance statistics.
  Features:
  - Grid layout for document cards
  - Performance statistics display
  - Quick actions (view, practice, delete)
  - Empty state handling
-->

<script lang="ts">
	import type { DocumentWithPerformance } from '../../../type';

	interface Props {
		documents: DocumentWithPerformance[];
		onSelect: (document: DocumentWithPerformance) => void;
		onStartPractice: (document: DocumentWithPerformance) => void;
		onStartFormattedPractice?: (document: DocumentWithPerformance) => void;
		onDelete: (documentId: string) => void;
	}

	let { documents, onSelect, onStartPractice, onStartFormattedPractice, onDelete }: Props =
		$props();

	/**
	 * Format date for display
	 */
	const formatDate = (date: Date): string => {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(date);
	};

	/**
	 * Format performance statistics for display
	 */
	const formatStat = (value: number | undefined, suffix: string = ''): string => {
		if (value === undefined) return 'N/A';
		return `${Math.round(value * 10) / 10}${suffix}`;
	};

	/**
	 * Get a preview of the document content (first few words)
	 */
	const getContentPreview = (content: string, maxWords: number = 20): string => {
		const words = content.split(' ').slice(0, maxWords);
		return words.join(' ') + (content.split(' ').length > maxWords ? '...' : '');
	};
	// Sorting state
	type SortOption = 'updated' | 'wpm' | 'practiced' | 'alphabetical';
	let sortBy: SortOption = $state('updated');

	// Derived sorted documents
	let sortedDocuments = $derived.by(() => {
		const docs = [...documents];
		switch (sortBy) {
			case 'updated':
				return docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
			case 'wpm':
				return docs.sort((a, b) => (b.bestWpm || 0) - (a.bestWpm || 0));
			case 'practiced':
				return docs.sort((a, b) => b.performances.length - a.performances.length);
			case 'alphabetical':
				return docs.sort((a, b) => a.title.localeCompare(b.title));
			default:
				return docs;
		}
	});
</script>

<div class="document-list">
	{#if documents.length === 0}
		<!-- Empty state -->
		<div class="empty-state">
			<div class="empty-icon">📄</div>
			<h3>No documents found</h3>
			<p>Create your first document to start practicing with custom text.</p>
		</div>
	{:else}
		<!-- Sorting Controls -->
		<div class="mb-6 flex items-center justify-end gap-2 text-sm text-gray-600 dark:text-gray-400">
			<span class="font-medium">Sort by:</span>
			<select
				bind:value={sortBy}
				class="rounded-md border-gray-300 bg-white py-1 pl-2 pr-8 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
			>
				<option value="updated">Recently Updated</option>
				<option value="wpm">Best WPM</option>
				<option value="practiced">Most Practiced</option>
				<option value="alphabetical">A-Z</option>
			</select>
		</div>

		<!-- Document grid -->
		<div class="document-grid">
			{#each sortedDocuments as document (document.id)}
				<div class="document-card">
					<!-- Card Header -->
					<div class="card-header">
						<h3 class="document-title">{document.title}</h3>
						<div class="card-actions">
							<button
								class="action-btn action-view"
								onclick={() => onSelect(document)}
								title="View document details"
								aria-label="View document details"
							>
								👁️
							</button>

							<!-- Practice Options -->
							<div class="practice-dropdown">
								<button
									class="action-btn action-practice"
									onclick={() => onStartPractice(document)}
									title="Start regular typing practice"
									aria-label="Start regular typing practice"
								>
									⌨️
								</button>
								{#if onStartFormattedPractice}
									<button
										class="action-btn action-formatted-practice"
										onclick={() => onStartFormattedPractice?.(document)}
										title="Start code practice (formatted)"
										aria-label="Start code practice (formatted)"
									>
										💻
									</button>
								{/if}
							</div>

							<button
								class="action-btn action-delete"
								onclick={() => onDelete(document.id)}
								title="Delete document"
								aria-label="Delete document"
							>
								🗑️
							</button>
						</div>
					</div>

					<!-- Content Preview -->
					<div class="content-preview">
						<p>{getContentPreview(document.content)}</p>
					</div>

					<!-- Tags -->
					{#if document.tags.length > 0}
						<div class="tags">
							{#each document.tags as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
					{/if}

					<!-- Performance Statistics -->
					{#if document.performances.length > 0}
						<div class="performance-stats">
							<div class="stats-header">
								<span class="stats-title">📊 Performance</span>
								<span class="session-count"
									>{document.performances.length} session{document.performances.length === 1
										? ''
										: 's'}</span
								>
							</div>
							<div class="stats-grid">
								<div class="stat">
									<span class="stat-label">Best WPM</span>
									<span class="stat-value">{formatStat(document.bestWpm)}</span>
								</div>
								<div class="stat">
									<span class="stat-label">Best Accuracy</span>
									<span class="stat-value">{formatStat(document.bestAccuracy, '%')}</span>
								</div>
								<div class="stat">
									<span class="stat-label">Avg WPM</span>
									<span class="stat-value">{formatStat(document.averageWpm)}</span>
								</div>
								<div class="stat">
									<span class="stat-label">Avg Accuracy</span>
									<span class="stat-value">{formatStat(document.averageAccuracy, '%')}</span>
								</div>
							</div>
						</div>
					{:else}
						<div class="no-performance">
							<span class="no-performance-text">📝 No practice sessions yet</span>
						</div>
					{/if}

					<!-- Card Footer -->
					<div class="card-footer">
						<span class="created-date">Created {formatDate(document.createdAt)}</span>
						{#if document.updatedAt.getTime() !== document.createdAt.getTime()}
							<span class="updated-date">Updated {formatDate(document.updatedAt)}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.document-list {
		width: 100%;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #718096;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		color: #4a5568;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.empty-state p {
		margin: 0;
		font-size: 1rem;
	}

	.document-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.document-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		transition: all 0.2s ease-in-out;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.document-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.document-title {
		margin: 0;
		color: #1a202c;
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.3;
		flex: 1;
		margin-right: 1rem;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.action-btn {
		padding: 0.375rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
	}

	.action-btn:hover {
		border-color: #3182ce;
		background: #f7fafc;
	}

	.practice-dropdown {
		display: flex;
		gap: 0.25rem;
	}

	.action-formatted-practice:hover {
		border-color: #d69e2e;
		background: #fef5e7;
	}

	.action-delete:hover {
		border-color: #e53e3e;
		background: #fed7d7;
	}

	.content-preview {
		margin-bottom: 1rem;
	}

	.content-preview p {
		margin: 0;
		color: #4a5568;
		font-size: 0.875rem;
		line-height: 1.5;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.tag {
		padding: 0.25rem 0.5rem;
		background: #edf2f7;
		color: #4a5568;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.performance-stats {
		background: #f7fafc;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.stats-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.stats-title {
		font-weight: 600;
		color: #4a5568;
		font-size: 0.875rem;
	}

	.session-count {
		font-size: 0.75rem;
		color: #718096;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #718096;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-weight: 700;
		color: #1a202c;
		font-size: 1rem;
	}

	.no-performance {
		background: #f7fafc;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
		text-align: center;
	}

	.no-performance-text {
		color: #718096;
		font-size: 0.875rem;
		font-style: italic;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
		font-size: 0.75rem;
		color: #718096;
	}

	.created-date,
	.updated-date {
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.document-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.document-card {
			padding: 1rem;
		}

		.card-header {
			flex-direction: column;
			gap: 0.75rem;
			align-items: stretch;
		}

		.card-actions {
			justify-content: flex-end;
		}

		.stats-grid {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.card-footer {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
