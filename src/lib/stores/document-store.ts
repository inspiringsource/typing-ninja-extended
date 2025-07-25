import { writable } from 'svelte/store';
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
					const docs = JSON.parse(storedDocuments) as (Omit<Document, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string })[];
					// Convert date strings back to Date objects
					const documentsWithDates = docs.map((doc) => ({
						...doc,
						createdAt: new Date(doc.createdAt),
						updatedAt: new Date(doc.updatedAt)
					}));
					this.documents.set(documentsWithDates);
				}
				
				if (storedPerformances) {
					const perfs = JSON.parse(storedPerformances) as (Omit<PerformanceRecord, 'completedAt'> & { completedAt: string })[];
					// Convert date strings back to Date objects
					const performancesWithDates = perfs.map((perf) => ({
						...perf,
						completedAt: new Date(perf.completedAt)
					}));
					this.performances.set(performancesWithDates);
				}
			} catch (error) {
				console.error('Error loading documents from storage:', error);
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
			} catch (error) {
				console.error('Error saving documents to storage:', error);
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
			} catch (error) {
				console.error('Error saving performances to storage:', error);
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
			tags: tags.map(tag => tag.trim()).filter(tag => tag.length > 0),
			createdAt: new Date(),
			updatedAt: new Date()
		};

		this.documents.update(docs => {
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
		this.documents.update(docs => {
			const updated = docs.map(doc => 
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
		this.documents.update(docs => {
			const updated = docs.filter(doc => doc.id !== id);
			this.saveDocumentsToStorage(updated);
			return updated;
		});

		// Also remove all performance records for this document
		this.performances.update(perfs => {
			const updated = perfs.filter(perf => perf.documentId !== id);
			this.savePerformancesToStorage(updated);
			return updated;
		});
	}

	/**
	 * Add a performance record for a document
	 */
	addPerformance(documentId: string, wpm: number, accuracy: number, correctChars: number, totalChars: number, timeElapsed: number) {
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

		this.performances.update(perfs => {
			const updated = [...perfs, newPerformance];
			this.savePerformancesToStorage(updated);
			return updated;
		});

		return newPerformance;
	}

	/**
	 * Get documents with their performance statistics
	 */
	getDocumentsWithPerformance(): Promise<DocumentWithPerformance[]> {
		return new Promise((resolve) => {
			let documents: Document[] = [];
			let performances: PerformanceRecord[] = [];
			
			// Subscribe to both stores to get current values
			const unsubscribeDocs = this.documents.subscribe(docs => documents = docs);
			const unsubscribePerfs = this.performances.subscribe(perfs => performances = perfs);
			
			// Calculate statistics for each document
			const documentsWithPerformance: DocumentWithPerformance[] = documents.map(doc => {
				const docPerformances = performances.filter(perf => perf.documentId === doc.id);
				
				let bestWpm: number | undefined;
				let bestAccuracy: number | undefined;
				let averageWpm: number | undefined;
				let averageAccuracy: number | undefined;

				if (docPerformances.length > 0) {
					bestWpm = Math.max(...docPerformances.map(p => p.wpm));
					bestAccuracy = Math.max(...docPerformances.map(p => p.accuracy));
					averageWpm = docPerformances.reduce((sum, p) => sum + p.wpm, 0) / docPerformances.length;
					averageAccuracy = docPerformances.reduce((sum, p) => sum + p.accuracy, 0) / docPerformances.length;
				}

				return {
					...doc,
					performances: docPerformances.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()),
					bestWpm,
					bestAccuracy,
					averageWpm,
					averageAccuracy
				};
			});

			// Clean up subscriptions
			unsubscribeDocs();
			unsubscribePerfs();
			
			resolve(documentsWithPerformance);
		});
	}

	/**
	 * Filter documents by tags
	 */
	filterDocumentsByTags(tags: string[]): Promise<DocumentWithPerformance[]> {
		return this.getDocumentsWithPerformance().then(docs => {
			if (tags.length === 0) return docs;
			
			return docs.filter(doc => 
				tags.some(tag => 
					doc.tags.some(docTag => 
						docTag.toLowerCase().includes(tag.toLowerCase())
					)
				)
			);
		});
	}

	/**
	 * Search documents by title or content
	 */
	searchDocuments(query: string): Promise<DocumentWithPerformance[]> {
		return this.getDocumentsWithPerformance().then(docs => {
			if (!query.trim()) return docs;
			
			const searchTerm = query.toLowerCase();
			return docs.filter(doc => 
				doc.title.toLowerCase().includes(searchTerm) ||
				doc.content.toLowerCase().includes(searchTerm) ||
				doc.tags.some(tag => tag.toLowerCase().includes(searchTerm))
			);
		});
	}
}

// Export singleton instance
export const documentStore = new DocumentStore();
