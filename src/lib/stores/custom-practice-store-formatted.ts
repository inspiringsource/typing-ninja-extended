import { writable } from 'svelte/store';
import type { DocumentWithPerformance } from '../../type';

/**
 * Custom Practice Store - Enhanced for Formatted Text
 * 
 * Manages custom text for typing practice sessions with preserved formatting
 * Allows passing document content from Document Manager to main typing practice
 */
interface CustomPracticeState {
	isCustomPractice: boolean;
	document: DocumentWithPerformance | null;
	customText: string; // Changed to single string to preserve formatting
	isFormattedText: boolean; // Flag to indicate if text should preserve formatting
}

const initialState: CustomPracticeState = {
	isCustomPractice: false,
	document: null,
	customText: '',
	isFormattedText: false
};

function createCustomPracticeStore() {
	const { subscribe, set } = writable<CustomPracticeState>(initialState);

	return {
		subscribe,
		
		/**
		 * Set up custom practice with a document, preserving formatting
		 */
		startCustomPractice: (document: DocumentWithPerformance, preserveFormatting: boolean = true) => {
			let processedText: string;
			
			if (preserveFormatting) {
				// Preserve all formatting including tabs, spaces, and line breaks
				processedText = document.content;
			} else {
				// Legacy mode: convert to words array (for backward compatibility)
				processedText = document.content
					.trim()
					.split(/\s+/) // Split on any whitespace
					.join(' '); // Join with single spaces
			}

			set({
				isCustomPractice: true,
				document,
				customText: processedText,
				isFormattedText: preserveFormatting
			});
		},

		/**
		 * Set up custom practice with raw text (useful for code snippets)
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
		}
	};
}

export const customPracticeStore = createCustomPracticeStore();
