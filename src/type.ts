export type GameState = {
	isPlaying: boolean;
	isFinish: boolean;
	isPending: boolean;
	isShowKeyboard: boolean;
	currentText: string[];
	currentWordIndex: number;
	userInput: string[];
	accuracy: number;
	wpm: number;
	correctChars: number;
	totalChars: number;
	timeElapsed: number;
	timeElapsedMode: number;
	totalGenerateWords: number;
	mode: 'time' | 'words';
};

// Enhanced GameState for formatted text support
export type FormattedGameState = {
	isPlaying: boolean;
	isFinish: boolean;
	isPending: boolean;
	isShowKeyboard: boolean;
	currentText: string; // Single string to preserve formatting
	currentCharIndex: number; // Track character position instead of word position
	userInput: string; // Single string for user input
	accuracy: number;
	wpm: number;
	correctChars: number;
	totalChars: number;
	timeElapsed: number;
	timeElapsedMode: number;
	totalGenerateWords: number;
	mode: 'time' | 'words';
	isFormattedMode: boolean; // Flag to indicate formatted text mode
};

// Document Manager Types
export type Document = {
	id: string;
	title: string;
	content: string;
	tags: string[];
	createdAt: Date;
	updatedAt: Date;
};

export type PerformanceRecord = {
	id: string;
	documentId: string;
	wpm: number;
	accuracy: number;
	correctChars: number;
	totalChars: number;
	timeElapsed: number;
	completedAt: Date;
};

export type DocumentWithPerformance = Document & {
	performances: PerformanceRecord[];
	bestWpm?: number;
	bestAccuracy?: number;
	averageWpm?: number;
	averageAccuracy?: number;
};
