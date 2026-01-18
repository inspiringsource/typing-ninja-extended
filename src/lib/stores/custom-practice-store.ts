import { writable } from 'svelte/store';
import type { DocumentWithPerformance } from '../../type';

/**
 * Custom Practice Store
 *
 * Manages custom text for typing practice sessions
 * Allows passing document content from Document Manager to main typing practice
 */
interface CustomPracticeState {
	isCustomPractice: boolean;
	document: DocumentWithPerformance | null;
	customText: string | string[];
	isFormattedText: boolean;
}

const initialState: CustomPracticeState = {
	isCustomPractice: false,
	document: null,
	customText: [],
	isFormattedText: false
};

import { documentStore } from './document-store';

function createCustomPracticeStore() {
	const { subscribe, set, update } = writable<CustomPracticeState>(initialState);

	// Watch for document deletions
	documentStore.documents.subscribe((docs) => {
		update((state) => {
			if (state.isCustomPractice && state.document) {
				const paramsDoc = docs.find((d) => d.id === state.document?.id);
				if (!paramsDoc) {
					// Document was deleted, reset state
					return initialState;
				}
			}
			return state;
		});
	});

	return {
		subscribe,

		/**
		 * Set up custom practice with a document (Legacy/Word mode)
		 */
		startCustomPractice: (document: DocumentWithPerformance) => {
			// Convert document content to words array, preserving line breaks and punctuation
			const words = document.content
				.trim()
				.split(/(\s+)/) // Split on whitespace but keep the separators
				.filter((word) => word.trim().length > 0) // Remove empty strings
				.map((word) => word.trim()); // Clean up whitespace

			set({
				isCustomPractice: true,
				document,
				customText: words,
				isFormattedText: false
			});
		},

		/**
		 * Set up custom practice with a document (Formatted mode)
		 */
		startCustomPracticeFormatted: (document: DocumentWithPerformance) => {
			set({
				isCustomPractice: true,
				document,
				customText: document.content,
				isFormattedText: true
			});
		},

		/**
		 * Set up custom practice with raw text (Formatted mode)
		 */
		startCustomPracticeWithText: (text: string, title: string = 'Custom Text') => {
			const mockDocument: DocumentWithPerformance = {
				id: 'custom-' + Date.now(),
				title,
				content: text,
				tags: ['custom'],
				createdAt: new Date(),
				updatedAt: new Date(),
				performances: []
			};

			set({
				isCustomPractice: true,
				document: mockDocument,
				customText: text,
				isFormattedText: true
			});
		},

		/**
		 * Clear custom practice and return to normal mode
		 */
		clearCustomPractice: () => {
			set(initialState);
		},

		/**
		 * Get current custom practice state
		 */
		getCurrentDocument: (): DocumentWithPerformance | null => {
			let currentDocument = null;
			subscribe((state) => {
				currentDocument = state.document;
			})();
			return currentDocument;
		}
	};
}

export const customPracticeStore = createCustomPracticeStore();
