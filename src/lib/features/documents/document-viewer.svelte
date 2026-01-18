<!--
  DocumentViewer Component
  
  Displays detailed view of a document with performance history.
  Features:
  - Full document content display
  - Performance statistics and history
  - Actions (practice, edit, delete)
  - Performance charts and trends
-->

<script lang="ts">
	import type { DocumentWithPerformance } from '../../../type';

	interface Props {
		document: DocumentWithPerformance;
		onStartPractice: () => void;
		onEdit: () => void;
		onBack: () => void;
		onDelete: () => void;
	}

	let { document, onStartPractice, onEdit, onBack, onDelete }: Props = $props();

	/**
	 * Format date for display
	 */
	const formatDate = (date: Date): string => {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
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
	 * Get content statistics
	 */
	const getContentStats = () => {
		const wordCount = document.content.trim().split(/\s+/).length;
		const charCount = document.content.trim().length;
		const paragraphCount = document.content.trim().split(/\n\s*\n/).length;
		return { wordCount, charCount, paragraphCount };
	};

	/**
	 * Get performance trends
	 */
	const getPerformanceTrends = () => {
		if (document.performances.length < 2) return null;

		const sorted = [...document.performances].sort(
			(a, b) => a.completedAt.getTime() - b.completedAt.getTime()
		);
		const latest = sorted[sorted.length - 1];
		const previous = sorted[sorted.length - 2];

		const wpmTrend = latest.wpm - previous.wpm;
		const accuracyTrend = latest.accuracy - previous.accuracy;

		return {
			wpm: wpmTrend,
			accuracy: accuracyTrend,
			improving: wpmTrend > 0 || accuracyTrend > 0
		};
	};

	/**
	 * Get difficulty assessment based on content
	 */
	const getDifficultyAssessment = () => {
		const content = document.content;
		const wordCount = content.trim().split(/\s+/).length;
		const avgWordLength =
			content
				.replace(/[^\w\s]/g, '')
				.split(/\s+/)
				.reduce((sum, word) => sum + word.length, 0) / wordCount;
		const punctuationDensity = (content.match(/[.,;:!?]/g) || []).length / content.length;
		const numberDensity = (content.match(/\d/g) || []).length / content.length;

		let difficulty = 'Easy';
		let difficultyScore = 0;

		// Factors that increase difficulty
		if (avgWordLength > 5) difficultyScore += 1;
		if (avgWordLength > 7) difficultyScore += 1;
		if (punctuationDensity > 0.05) difficultyScore += 1;
		if (numberDensity > 0.02) difficultyScore += 1;
		if (wordCount > 200) difficultyScore += 1;

		if (difficultyScore >= 4) difficulty = 'Very Hard';
		else if (difficultyScore >= 3) difficulty = 'Hard';
		else if (difficultyScore >= 2) difficulty = 'Medium';

		return { difficulty, score: difficultyScore };
	};

	const contentStats = $derived(getContentStats());
	const performanceTrends = $derived(getPerformanceTrends());
	const difficultyAssessment = $derived(getDifficultyAssessment());
</script>

<div class="document-viewer">
	<!-- Header -->
	<div class="viewer-header">
		<div class="header-content">
			<button class="back-btn" onclick={onBack}> ← Back to Documents </button>
			<div class="document-meta">
				<h1 class="document-title">{document.title}</h1>
				<div class="meta-info">
					<span class="created-date">Created {formatDate(document.createdAt)}</span>
					{#if document.updatedAt.getTime() !== document.createdAt.getTime()}
						<span class="updated-date">• Updated {formatDate(document.updatedAt)}</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="header-actions">
			<button class="btn btn-primary" onclick={onStartPractice}> ⌨️ Start Practice </button>
			<button class="btn btn-secondary" onclick={onEdit}> ✏️ Edit </button>
			<button class="btn btn-danger" onclick={onDelete}> 🗑️ Delete </button>
		</div>
	</div>

	<!-- Content Overview -->
	<div class="content-overview">
		<div class="overview-cards">
			<div class="overview-card">
				<div class="card-icon">📄</div>
				<div class="card-content">
					<div class="card-value">{contentStats.wordCount}</div>
					<div class="card-label">Words</div>
				</div>
			</div>

			<div class="overview-card">
				<div class="card-icon">🔤</div>
				<div class="card-content">
					<div class="card-value">{contentStats.charCount}</div>
					<div class="card-label">Characters</div>
				</div>
			</div>

			<div class="overview-card">
				<div class="card-icon">📊</div>
				<div class="card-content">
					<div class="card-value">{difficultyAssessment.difficulty}</div>
					<div class="card-label">Difficulty</div>
				</div>
			</div>

			<div class="overview-card">
				<div class="card-icon">🎯</div>
				<div class="card-content">
					<div class="card-value">{document.performances.length}</div>
					<div class="card-label">Sessions</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Tags -->
	{#if document.tags.length > 0}
		<div class="tags-section">
			<h3>Tags</h3>
			<div class="tags">
				{#each document.tags as tag}
					<span class="tag">{tag}</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Performance Statistics -->
	{#if document.performances.length > 0}
		<div class="performance-section">
			<h3>Performance Statistics</h3>

			<div class="performance-summary">
				<div class="stat-card">
					<div class="stat-value">{formatStat(document.bestWpm)}</div>
					<div class="stat-label">Best WPM</div>
					{#if performanceTrends && performanceTrends.wpm !== 0}
						<div class="stat-trend {performanceTrends.wpm > 0 ? 'trend-up' : 'trend-down'}">
							{performanceTrends.wpm > 0 ? '↗' : '↘'}
							{Math.abs(performanceTrends.wpm).toFixed(1)}
						</div>
					{/if}
				</div>

				<div class="stat-card">
					<div class="stat-value">{formatStat(document.bestAccuracy, '%')}</div>
					<div class="stat-label">Best Accuracy</div>
					{#if performanceTrends && performanceTrends.accuracy !== 0}
						<div class="stat-trend {performanceTrends.accuracy > 0 ? 'trend-up' : 'trend-down'}">
							{performanceTrends.accuracy > 0 ? '↗' : '↘'}
							{Math.abs(performanceTrends.accuracy).toFixed(1)}%
						</div>
					{/if}
				</div>

				<div class="stat-card">
					<div class="stat-value">{formatStat(document.averageWpm)}</div>
					<div class="stat-label">Average WPM</div>
				</div>

				<div class="stat-card">
					<div class="stat-value">{formatStat(document.averageAccuracy, '%')}</div>
					<div class="stat-label">Average Accuracy</div>
				</div>
			</div>

			<!-- Performance History -->
			<div class="performance-history">
				<h4>Recent Sessions</h4>
				<div class="history-list">
					{#each document.performances.slice(0, 5) as performance}
						<div class="history-item">
							<div class="history-date">
								{formatDate(performance.completedAt)}
							</div>
							<div class="history-stats">
								<span class="history-stat">{performance.wpm} WPM</span>
								<span class="history-stat">{performance.accuracy.toFixed(1)}% accuracy</span>
								<span class="history-stat"
									>{Math.floor(performance.timeElapsed / 60)}:{(performance.timeElapsed % 60)
										.toString()
										.padStart(2, '0')}</span
								>
							</div>
						</div>
					{/each}
				</div>

				{#if document.performances.length > 5}
					<div class="history-more">
						And {document.performances.length - 5} more session{document.performances.length - 5 ===
						1
							? ''
							: 's'}...
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="no-performance">
			<div class="no-performance-content">
				<div class="no-performance-icon">📝</div>
				<h3>No Practice Sessions Yet</h3>
				<p>Start practicing with this document to track your typing performance over time.</p>
				<button class="btn btn-primary" onclick={onStartPractice}>
					🚀 Start Your First Practice Session
				</button>
			</div>
		</div>
	{/if}

	<!-- Document Content -->
	<div class="content-section">
		<h3>Document Content</h3>
		<div class="content-display">
			<pre class="content-text">{document.content}</pre>
		</div>
	</div>
</div>

<style>
	.document-viewer {
		max-width: 1000px;
		margin: 0 auto;
	}

	.viewer-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.header-content {
		flex: 1;
	}

	.back-btn {
		background: none;
		border: none;
		color: #3182ce;
		font-size: 1rem;
		cursor: pointer;
		margin-bottom: 1rem;
		padding: 0.5rem 0;
		transition: color 0.2s;
	}

	.back-btn:hover {
		color: #2c5aa0;
		text-decoration: underline;
	}

	.document-title {
		margin: 0 0 0.5rem 0;
		color: #1a202c;
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.meta-info {
		color: #718096;
		font-size: 0.875rem;
	}

	.header-actions {
		display: flex;
		gap: 1rem;
		flex-shrink: 0;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
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

	.btn-danger {
		background: #e53e3e;
		color: white;
	}

	.btn-danger:hover {
		background: #c53030;
	}

	.content-overview {
		margin-bottom: 2rem;
	}

	.overview-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.overview-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: box-shadow 0.2s;
	}

	.overview-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.card-icon {
		font-size: 2rem;
	}

	.card-content {
		flex: 1;
	}

	.card-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a202c;
		margin-bottom: 0.25rem;
	}

	.card-label {
		color: #718096;
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.tags-section {
		margin-bottom: 2rem;
	}

	.tags-section h3 {
		margin: 0 0 1rem 0;
		color: #4a5568;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		padding: 0.375rem 0.75rem;
		background: #edf2f7;
		color: #4a5568;
		border-radius: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.performance-section {
		background: white;
		border-radius: 0.75rem;
		padding: 2rem;
		margin-bottom: 2rem;
		border: 1px solid #e2e8f0;
	}

	.performance-section h3 {
		margin: 0 0 1.5rem 0;
		color: #1a202c;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.performance-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: #f7fafc;
		border-radius: 0.5rem;
		padding: 1.5rem;
		text-align: center;
		position: relative;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #1a202c;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		color: #718096;
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-trend {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.trend-up {
		background: #c6f6d5;
		color: #22543d;
	}

	.trend-down {
		background: #fed7d7;
		color: #742a2a;
	}

	.performance-history h4 {
		margin: 0 0 1rem 0;
		color: #4a5568;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.history-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f7fafc;
		border-radius: 0.5rem;
		border: 1px solid #e2e8f0;
	}

	.history-date {
		color: #4a5568;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.history-stats {
		display: flex;
		gap: 1rem;
	}

	.history-stat {
		color: #718096;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.history-more {
		text-align: center;
		color: #718096;
		font-size: 0.875rem;
		font-style: italic;
		margin-top: 1rem;
	}

	.no-performance {
		background: white;
		border-radius: 0.75rem;
		padding: 3rem;
		margin-bottom: 2rem;
		border: 1px solid #e2e8f0;
	}

	.no-performance-content {
		text-align: center;
	}

	.no-performance-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.no-performance h3 {
		margin: 0 0 1rem 0;
		color: #4a5568;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.no-performance p {
		margin: 0 0 2rem 0;
		color: #718096;
		font-size: 1rem;
	}

	.content-section {
		background: white;
		border-radius: 0.75rem;
		padding: 2rem;
		border: 1px solid #e2e8f0;
	}

	.content-section h3 {
		margin: 0 0 1.5rem 0;
		color: #1a202c;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.content-display {
		background: #f7fafc;
		border-radius: 0.5rem;
		padding: 1.5rem;
		border: 1px solid #e2e8f0;
	}

	.content-text {
		margin: 0;
		font-family: 'Courier New', monospace;
		font-size: 1rem;
		line-height: 1.6;
		color: #2d3748;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	@media (max-width: 768px) {
		.viewer-header {
			flex-direction: column;
			gap: 1rem;
		}

		.header-actions {
			width: 100%;
			justify-content: stretch;
		}

		.header-actions .btn {
			flex: 1;
			justify-content: center;
		}

		.overview-cards {
			grid-template-columns: 1fr 1fr;
		}

		.performance-summary {
			grid-template-columns: 1fr 1fr;
		}

		.history-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.history-stats {
			flex-direction: column;
			gap: 0.25rem;
		}

		.performance-section,
		.content-section {
			padding: 1.5rem;
		}
	}
</style>
