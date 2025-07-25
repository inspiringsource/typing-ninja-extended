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
	customText: string[];
}

const initialState: CustomPracticeState = {
	isCustomPractice: false,
	document: null,
	customText: []
};

function createCustomPracticeStore() {
	const { subscribe, set } = writable<CustomPracticeState>(initialState);

	return {
		subscribe,
		
		/**
		 * Set up custom practice with a document
		 */
		startCustomPractice: (document: DocumentWithPerformance) => {
			// Convert document content to words array, preserving line breaks and punctuation
			const words = document.content
				.trim()
				.split(/(\s+)/) // Split on whitespace but keep the separators
				.filter(word => word.trim().length > 0) // Remove empty strings
				.map(word => word.trim()); // Clean up whitespace

			set({
				isCustomPractice: true,
				document,
				customText: words
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
			subscribe(state => {
				currentDocument = state.document;
			})();
			return currentDocument;
		}
	};
}

export const customPracticeStore = createCustomPracticeStore();
