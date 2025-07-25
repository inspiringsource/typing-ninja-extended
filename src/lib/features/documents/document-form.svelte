<!--
  DocumentForm Component
  
  Form for adding new documents with title, content, and tags.
  Features:
  - Form validation
  - Tag input with dynamic addition/removal
  - File import capability
  - Character/word count display
  - Auto-save draft functionality
-->

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	interface Props {
		onCancel: () => void;
		onSubmit: (event: CustomEvent<{
			title: string;
			content: string;
			tags: string[];
		}>) => void;
	}

	let { onCancel, onSubmit }: Props = $props();

	const dispatch = createEventDispatcher<{
		submit: {
			title: string;
			content: string;
			tags: string[];
		};
	}>();

	// Form state
	let title = $state('');
	let content = $state('');
	let tags: string[] = $state([]);
	let newTag = $state('');
	let errors: Record<string, string> = $state({});
	let isSubmitting = $state(false);

	// File input reference
	let fileInput: HTMLInputElement;

	/**
	 * Validate form fields
	 */
	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!title.trim()) {
			newErrors.title = 'Title is required';
		} else if (title.trim().length < 3) {
			newErrors.title = 'Title must be at least 3 characters';
		} else if (title.trim().length > 100) {
			newErrors.title = 'Title must be less than 100 characters';
		}

		if (!content.trim()) {
			newErrors.content = 'Content is required';
		} else if (content.trim().length < 50) {
			newErrors.content = 'Content must be at least 50 characters for meaningful practice';
		} else if (content.trim().length > 10000) {
			newErrors.content = 'Content must be less than 10,000 characters';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	};

	/**
	 * Handle form submission
	 */
	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		isSubmitting = true;

		try {
			const submitEvent = new CustomEvent('submit', {
				detail: {
					title: title.trim(),
					content: content.trim(),
					tags: tags.map(tag => tag.trim()).filter(tag => tag.length > 0)
				}
			});
			onSubmit(submitEvent);
			
			// Clear form after successful submission
			title = '';
			content = '';
			tags = [];
			newTag = '';
			errors = {};
		} catch (error) {
			console.error('Error submitting document:', error);
		} finally {
			isSubmitting = false;
		}
	};

	/**
	 * Add a new tag
	 */
	const addTag = () => {
		const tagToAdd = newTag.trim().toLowerCase();
		
		if (tagToAdd && !tags.includes(tagToAdd) && tags.length < 10) {
			tags = [...tags, tagToAdd];
			newTag = '';
		}
	};

	/**
	 * Remove a tag
	 */
	const removeTag = (tagToRemove: string) => {
		tags = tags.filter(tag => tag !== tagToRemove);
	};

	/**
	 * Handle tag input keydown (Enter to add tag)
	 */
	const handleTagKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			addTag();
		}
	};

	/**
	 * Handle file import
	 */
	const handleFileImport = (event: Event) => {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const text = e.target?.result as string;
				if (text) {
					content = text;
					// Suggest title based on filename if title is empty
					if (!title.trim()) {
						const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
						title = fileName.charAt(0).toUpperCase() + fileName.slice(1);
					}
				}
			};
			reader.readAsText(file);
		}
		
		// Reset input so the same file can be selected again
		input.value = '';
	};

	/**
	 * Get word and character count
	 */
	const getContentStats = () => {
		const trimmedContent = content.trim();
		const wordCount = trimmedContent ? trimmedContent.split(/\s+/).length : 0;
		const charCount = trimmedContent.length;
		return { wordCount, charCount };
	};

	/**
	 * Auto-save draft to localStorage
	 */
	const saveDraft = () => {
		if (typeof window !== 'undefined') {
			try {
				const draft = { title, content, tags };
				localStorage.setItem('typing-ninja-document-draft', JSON.stringify(draft));
			} catch (error) {
				console.error('Error saving draft:', error);
			}
		}
	};

	/**
	 * Load draft from localStorage
	 */
	const loadDraft = () => {
		if (typeof window !== 'undefined') {
			try {
				const draft = localStorage.getItem('typing-ninja-document-draft');
				if (draft) {
					const parsed = JSON.parse(draft);
					if (parsed.title || parsed.content || parsed.tags?.length) {
						title = parsed.title || '';
						content = parsed.content || '';
						tags = parsed.tags || [];
					}
				}
			} catch (error) {
				console.error('Error loading draft:', error);
			}
		}
	};

	/**
	 * Clear draft from localStorage
	 */
	const clearDraft = () => {
		if (typeof window !== 'undefined') {
			try {
				localStorage.removeItem('typing-ninja-document-draft');
			} catch (error) {
				console.error('Error clearing draft:', error);
			}
		}
	};

	// Auto-save draft when form data changes
	$effect(() => {
		if (title || content || tags.length > 0) {
			saveDraft();
		}
	});

	// Load draft on component mount
	onMount(() => {
		loadDraft();
	});

	const contentStats = $derived(getContentStats());
</script>

<div class="document-form">
	<div class="form-header">
		<h2>Add New Document</h2>
		<p class="form-description">Create a custom document for typing practice</p>
	</div>

	<form onsubmit={handleSubmit} class="form">
		<!-- Title Input -->
		<div class="form-group">
			<label for="title" class="form-label">
				Document Title *
			</label>
			<input
				id="title"
				type="text"
				bind:value={title}
				placeholder="Enter a descriptive title for your document"
				class="form-input {errors.title ? 'input-error' : ''}"
				maxlength="100"
			/>
			{#if errors.title}
				<div class="error-message">{errors.title}</div>
			{/if}
		</div>

		<!-- Content Input -->
		<div class="form-group">
			<div class="content-header">
				<label for="content" class="form-label">
					Document Content *
				</label>
				<div class="content-actions">
					<button
						type="button"
						onclick={() => fileInput.click()}
						class="import-btn"
					>
						📁 Import from File
					</button>
					<input
						bind:this={fileInput}
						type="file"
						accept=".txt,.md,.rtf"
						onchange={handleFileImport}
						style="display: none"
					/>
				</div>
			</div>
			
			<textarea
				id="content"
				bind:value={content}
				placeholder="Paste or type the text you want to practice typing. The content should be at least 50 characters for meaningful practice."
				class="form-textarea {errors.content ? 'input-error' : ''}"
				rows="12"
				maxlength="10000"
			></textarea>
			
			<div class="content-stats">
				<span class="stat">Words: {contentStats.wordCount}</span>
				<span class="stat">Characters: {contentStats.charCount}</span>
			</div>
			
			{#if errors.content}
				<div class="error-message">{errors.content}</div>
			{/if}
		</div>

		<!-- Tags Input -->
		<div class="form-group">
			<label for="tags" class="form-label">
				Tags (Optional)
			</label>
			<div class="tags-input">
				<input
					id="tags"
					type="text"
					bind:value={newTag}
					onkeydown={handleTagKeydown}
					placeholder="Add tags to categorize your document (press Enter to add)"
					class="form-input"
					maxlength="30"
				/>
				<button
					type="button"
					onclick={addTag}
					disabled={!newTag.trim() || tags.includes(newTag.trim().toLowerCase()) || tags.length >= 10}
					class="add-tag-btn"
				>
					Add Tag
				</button>
			</div>
			
			{#if tags.length > 0}
				<div class="tags-display">
					{#each tags as tag}
						<span class="tag">
							{tag}
							<button
								type="button"
								onclick={() => removeTag(tag)}
								class="remove-tag"
							>
								×
							</button>
						</span>
					{/each}
				</div>
			{/if}
			
			{#if tags.length >= 10}
				<div class="info-message">Maximum 10 tags allowed</div>
			{/if}
		</div>

		<!-- Form Actions -->
		<div class="form-actions">
			<button
				type="button"
				onclick={() => {
					clearDraft();
					onCancel();
				}}
				class="btn btn-secondary"
				disabled={isSubmitting}
			>
				Cancel
			</button>
			<button
				type="submit"
				class="btn btn-primary"
				disabled={isSubmitting || !title.trim() || !content.trim()}
			>
				{#if isSubmitting}
					<span class="spinner"></span>
					Adding...
				{:else}
					➕ Add Document
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.document-form {
		max-width: 800px;
		margin: 0 auto;
		background: white;
		border-radius: 0.75rem;
		padding: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.form-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.form-header h2 {
		margin: 0 0 0.5rem 0;
		color: #1a202c;
		font-size: 2rem;
		font-weight: 700;
	}

	.form-description {
		margin: 0;
		color: #718096;
		font-size: 1rem;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-weight: 600;
		color: #4a5568;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.form-input {
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.form-input:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}

	.form-textarea {
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 1rem;
		font-family: 'Courier New', monospace;
		line-height: 1.5;
		resize: vertical;
		min-height: 200px;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.form-textarea:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}

	.input-error {
		border-color: #e53e3e !important;
	}

	.input-error:focus {
		box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1) !important;
	}

	.error-message {
		color: #e53e3e;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.info-message {
		color: #3182ce;
		font-size: 0.875rem;
	}

	.content-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.import-btn {
		padding: 0.5rem 1rem;
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.import-btn:hover {
		background: #edf2f7;
		border-color: #cbd5e0;
	}

	.content-stats {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: #718096;
	}

	.stat {
		font-weight: 500;
	}

	.tags-input {
		display: flex;
		gap: 0.5rem;
	}

	.tags-input .form-input {
		flex: 1;
	}

	.add-tag-btn {
		padding: 0.75rem 1rem;
		background: #3182ce;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
		white-space: nowrap;
	}

	.add-tag-btn:hover:not(:disabled) {
		background: #2c5aa0;
	}

	.add-tag-btn:disabled {
		background: #cbd5e0;
		cursor: not-allowed;
	}

	.tags-display {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		background: #edf2f7;
		color: #4a5568;
		border-radius: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.remove-tag {
		background: none;
		border: none;
		color: #718096;
		cursor: pointer;
		font-size: 1rem;
		font-weight: bold;
		padding: 0;
		margin: 0;
		width: 1rem;
		height: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s;
	}

	.remove-tag:hover {
		background: #cbd5e0;
		color: #4a5568;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
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
		font-size: 1rem;
	}

	.btn-primary {
		background: #3182ce;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2c5aa0;
	}

	.btn-secondary {
		background: #e2e8f0;
		color: #4a5568;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #cbd5e0;
	}

	.btn:disabled {
		background: #cbd5e0;
		color: #a0aec0;
		cursor: not-allowed;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.document-form {
			padding: 1.5rem;
			margin: 1rem;
		}

		.content-header {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.tags-input {
			flex-direction: column;
		}

		.form-actions {
			flex-direction: column-reverse;
		}

		.content-stats {
			flex-direction: column;
			gap: 0.25rem;
		}
	}
</style>
