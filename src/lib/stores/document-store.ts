import { writable, derived } from 'svelte/store';
import type { Document, PerformanceRecord, DocumentWithPerformance } from '../../type';

// Keys for localStorage
const DOCUMENTS_STORAGE_KEY = 'typing-ninja-documents';
const PERFORMANCES_STORAGE_KEY = 'typing-ninja-performances';

/**
 * Document Store - Manages documents and their performance data
 * Provides reactive state management with localStorage persistence
 */
class DocumentStore {
	// Reactive stores for documents and performances
	documents = writable<Document[]>([]);
	performances = writable<PerformanceRecord[]>([]);
	storageError = writable<string | null>(null);

	constructor() {
		this.loadFromStorage();
	}

	/**
	 * Load documents and performances from localStorage on initialization
	 */
	private loadFromStorage() {
		if (typeof window !== 'undefined') {
			try {
				const storedDocuments = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
				const storedPerformances = localStorage.getItem(PERFORMANCES_STORAGE_KEY);

				if (storedDocuments) {
					const docs = JSON.parse(storedDocuments) as (Omit<Document, 'createdAt' | 'updatedAt'> & {
						createdAt: string;
						updatedAt: string;
					})[];
					// Convert date strings back to Date objects
					const documentsWithDates = docs.map((doc) => ({
						...doc,
						createdAt: new Date(doc.createdAt),
						updatedAt: new Date(doc.updatedAt)
					}));
					this.documents.set(documentsWithDates);
				}

				if (storedPerformances) {
					const perfs = JSON.parse(storedPerformances) as (Omit<
						PerformanceRecord,
						'completedAt'
					> & { completedAt: string })[];
					// Convert date strings back to Date objects
					const performancesWithDates = perfs.map((perf) => ({
						...perf,
						completedAt: new Date(perf.completedAt)
					}));
					this.performances.set(performancesWithDates);
				}
			} catch (error) {
				console.error('Error loading documents from storage:', error);
				this.storageError.set('Failed to load your documents. Storage might be corrupted.');
			}
		}
	}

	/**
	 * Save documents to localStorage
	 */
	private saveDocumentsToStorage(documents: Document[]) {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documents));
				this.storageError.set(null); // Clear error on success
			} catch (error: any) {
				console.error('Error saving documents to storage:', error);
				if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
					this.storageError.set('Storage full. Some changes may not be saved.');
				} else {
					this.storageError.set('Failed to save changes to local storage.');
				}
			}
		}
	}

	/**
	 * Save performances to localStorage
	 */
	private savePerformancesToStorage(performances: PerformanceRecord[]) {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(PERFORMANCES_STORAGE_KEY, JSON.stringify(performances));
				this.storageError.set(null);
			} catch (error: any) {
				console.error('Error saving performances to storage:', error);
				// Don't show critical error for performance stats, just log
			}
		}
	}

	/**
	 * Add a new document
	 */
	addDocument(title: string, content: string, tags: string[] = []) {
		const newDocument: Document = {
			id: crypto.randomUUID(),
			title: title.trim(),
			content: content.trim(),
			tags: tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
			createdAt: new Date(),
			updatedAt: new Date()
		};

		this.documents.update((docs) => {
			const updated = [...docs, newDocument];
			this.saveDocumentsToStorage(updated);
			return updated;
		});

		return newDocument;
	}

	/**
	 * Update an existing document
	 */
	updateDocument(id: string, updates: Partial<Pick<Document, 'title' | 'content' | 'tags'>>) {
		this.documents.update((docs) => {
			const updated = docs.map((doc) =>
				doc.id === id
					? {
							...doc,
							...updates,
							updatedAt: new Date()
						}
					: doc
			);
			this.saveDocumentsToStorage(updated);
			return updated;
		});
	}

	/**
	 * Delete a document and all its associated performance records
	 */
	deleteDocument(id: string) {
		this.documents.update((docs) => {
			const updated = docs.filter((doc) => doc.id !== id);
			this.saveDocumentsToStorage(updated);
			return updated;
		});

		// Also remove all performance records for this document
		this.performances.update((perfs) => {
			const updated = perfs.filter((perf) => perf.documentId !== id);
			this.savePerformancesToStorage(updated);
			return updated;
		});
	}

	/**
	 * Add a performance record for a document
	 */
	addPerformance(
		documentId: string,
		wpm: number,
		accuracy: number,
		correctChars: number,
		totalChars: number,
		timeElapsed: number
	) {
		const newPerformance: PerformanceRecord = {
			id: crypto.randomUUID(),
			documentId,
			wpm,
			accuracy,
			correctChars,
			totalChars,
			timeElapsed,
			completedAt: new Date()
		};

		this.performances.update((perfs) => {
			const updated = [...perfs, newPerformance];
			this.savePerformancesToStorage(updated);
			return updated;
		});

		return newPerformance;
	}

	// Derived store for documents with performance data
	documentsWithPerformance = derived(
		[this.documents, this.performances],
		([$documents, $performances]: [Document[], PerformanceRecord[]]): DocumentWithPerformance[] => {
			return $documents.map((doc) => {
				const docPerformances = $performances.filter((perf) => perf.documentId === doc.id);

				let bestWpm: number | undefined;
				let bestAccuracy: number | undefined;
				let averageWpm: number | undefined;
				let averageAccuracy: number | undefined;

				if (docPerformances.length > 0) {
					bestWpm = Math.max(...docPerformances.map((p) => p.wpm));
					bestAccuracy = Math.max(...docPerformances.map((p) => p.accuracy));
					averageWpm = docPerformances.reduce((sum, p) => sum + p.wpm, 0) / docPerformances.length;
					averageAccuracy =
						docPerformances.reduce((sum, p) => sum + p.accuracy, 0) / docPerformances.length;
				}

				return {
					...doc,
					performances: docPerformances.sort(
						(a, b) => b.completedAt.getTime() - a.completedAt.getTime()
					),
					bestWpm,
					bestAccuracy,
					averageWpm,
					averageAccuracy
				};
			});
		}
	);

	/**
	 * Get documents with their performance statistics
	 * @deprecated Use documentsWithPerformance store instead
	 */
	getDocumentsWithPerformance(): Promise<DocumentWithPerformance[]> {
		return new Promise((resolve) => {
			const unsubscribe = this.documentsWithPerformance.subscribe(
				(value: DocumentWithPerformance[]) => {
					resolve(value);
					unsubscribe();
				}
			);
		});
	}

	/**
	 * Filter documents by tags
	 * @deprecated Filter in component
	 */
	filterDocumentsByTags(tags: string[]): Promise<DocumentWithPerformance[]> {
		return this.getDocumentsWithPerformance().then((docs) => {
			if (tags.length === 0) return docs;

			return docs.filter((doc) =>
				tags.some((tag) =>
					doc.tags.some((docTag) => docTag.toLowerCase().includes(tag.toLowerCase()))
				)
			);
		});
	}

	/**
	 * Search documents by title or content
	 * @deprecated Filter in component
	 */
	searchDocuments(query: string): Promise<DocumentWithPerformance[]> {
		return this.getDocumentsWithPerformance().then((docs) => {
			if (!query.trim()) return docs;

			const searchTerm = query.toLowerCase();
			return docs.filter(
				(doc) =>
					doc.title.toLowerCase().includes(searchTerm) ||
					doc.content.toLowerCase().includes(searchTerm) ||
					doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
			);
		});
	}
}

// Export singleton instance
export const documentStore = new DocumentStore();
