# Typing Progress Indicator

A reusable progress indicator component and utilities for tracking typing progress in real-time. This implementation provides accurate progress tracking based on correctly typed characters across the entire text content.

## Features

- **Real-time Progress Tracking**: Updates live as the user types
- **Accurate Calculation**: Based on correctly typed characters, not just cursor position
- **Complete Text Coverage**: Tracks progress across the entire text, not just visible lines
- **Visual Status Indicators**: Color-coded progress bars and percentage display
- **Responsive Design**: Adapts to different screen sizes
- **Reusable Utilities**: Modular functions that can be used in different contexts

## Components

### ProgressIndicator.svelte

A complete Svelte component that displays typing progress with visual indicators.

```svelte
<script>
  import ProgressIndicator from '$lib/features/home/components/progress-indicator.svelte';
  
  // Your typing test state
  let gameStates = {
    currentText: ['hello', 'world', 'typing', 'test'],
    userInput: ['hello', 'wor', '', ''],
    currentWordIndex: 1,
    isPlaying: true,
    isPending: false
  };
  
  let gameTheme = themes[0]; // Your theme
</script>

<ProgressIndicator
  currentText={gameStates.currentText}
  userInput={gameStates.userInput}
  currentWordIndex={gameStates.currentWordIndex}
  {gameTheme}
  isPlaying={gameStates.isPlaying}
  isPending={gameStates.isPending}
/>
```

### Progress Utilities

The `progress.ts` utility module provides functions for calculating typing progress metrics.

```typescript
import { calculateTypingProgress, calculateProgressPercentage } from '$lib/utils/progress';

// Basic progress percentage
const percentage = calculateProgressPercentage(
  ['hello', 'world', 'test'],
  ['hello', 'wor', ''],
  1
);
console.log(percentage); // 73.3

// Comprehensive progress data
const progressData = calculateTypingProgress(
  ['hello', 'world', 'test'],
  ['hello', 'wor', ''],
  1
);
console.log(progressData);
/*
{
  progressPercentage: 73.3,
  wordsCompleted: 1,
  totalWords: 3,
  correctChars: 11,
  totalChars: 15,
  accuracy: 91.7,
  status: 'high'
}
*/
```

## How Progress Calculation Works

The progress calculation is based on correctly typed characters across the entire text content:

1. **Total Characters**: Sum of all characters in all words
2. **Correct Characters**: Count of characters that match the expected text
3. **Progress Percentage**: `(correctChars / totalChars) * 100`

### Character Counting Logic

```typescript
// For each word in the text
for (let wordIndex = 0; wordIndex < currentText.length; wordIndex++) {
  const word = currentText[wordIndex];
  const input = userInput[wordIndex] || '';
  
  if (wordIndex < currentWordIndex) {
    // Completed words: count all correct characters
    for (let charIndex = 0; charIndex < Math.min(word.length, input.length); charIndex++) {
      if (word[charIndex] === input[charIndex]) {
        correctChars++;
      }
    }
  } else if (wordIndex === currentWordIndex) {
    // Current word: count correct characters typed so far
    for (let charIndex = 0; charIndex < Math.min(word.length, input.length); charIndex++) {
      if (word[charIndex] === input[charIndex]) {
        correctChars++;
      }
    }
  }
  // Future words don't contribute to progress yet
}
```

## Usage in Different Contexts

### Custom Component

```svelte
<script>
  import { calculateTypingProgress } from '$lib/utils/progress';
  
  export let currentText;
  export let userInput;
  export let currentWordIndex;
  
  $: progress = calculateTypingProgress(currentText, userInput, currentWordIndex);
</script>

<div class="my-progress-display">
  <h3>Progress: {progress.progressPercentage}%</h3>
  <div class="progress-bar">
    <div style="width: {progress.progressPercentage}%"></div>
  </div>
  <p>Words: {progress.wordsCompleted} / {progress.totalWords}</p>
</div>
```

### Reactive Store

```typescript
import { createProgressStore } from '$lib/utils/progress';

// Create a reactive progress store
const progressStore = createProgressStore();

// Update when typing state changes
$: progressStore.update(currentText, userInput, currentWordIndex);

// Access progress data
$: console.log('Progress:', progressStore.progress.progressPercentage + '%');
```

### Integration with Existing Game State

```svelte
<script>
  import { calculateProgressPercentage } from '$lib/utils/progress';
  
  // Your existing game state
  let gameStates = $state({
    currentText: [],
    userInput: [],
    currentWordIndex: 0,
    // ... other properties
  });
  
  // Add reactive progress calculation
  $: currentProgress = calculateProgressPercentage(
    gameStates.currentText,
    gameStates.userInput,
    gameStates.currentWordIndex
  );
  
  // Use in your UI
</script>

<div>Progress: {currentProgress.toFixed(1)}%</div>
```

## Status Categories

The progress indicator uses color-coded status categories:

- **start** (0-24%): Gray - Just getting started
- **low** (25-49%): Orange - Early progress
- **medium** (50-74%): Yellow - Halfway there
- **high** (75-99%): Blue - Almost complete
- **complete** (100%): Green - Finished!

## Responsive Behavior

The component automatically adjusts its layout for different screen sizes:

- **Desktop**: Fixed position in top-right corner
- **Tablet/Mobile**: Static position above text, horizontal layout
- **Small screens**: Hides word count to save space

## Customization

### Styling

The component uses Tailwind CSS classes and accepts a `gameTheme` prop for consistent styling with your application theme.

### Position

To change the position, modify the CSS in the component:

```css
.progress-container {
  position: fixed;
  top: 120px;
  right: 20px;
  /* Change position as needed */
}
```

### Progress Calculation

To modify how progress is calculated, update the logic in `calculateTypingProgress()` in `src/lib/utils/progress.ts`.

## API Reference

### ProgressIndicator Props

- `currentText: string[]` - Array of words in the typing test
- `userInput: string[]` - Array of user input for each word
- `currentWordIndex: number` - Index of currently active word
- `gameTheme: Theme` - Theme object for styling
- `isPlaying: boolean` - Whether the typing test is active
- `isPending: boolean` - Whether the test is waiting to start

### Progress Utility Functions

- `calculateTypingProgress()` - Returns complete progress data
- `calculateProgressPercentage()` - Returns just the percentage
- `getProgressStatus()` - Returns status category for a percentage
- `createProgressStore()` - Creates a reactive Svelte store

This implementation provides a robust, reusable solution for tracking and displaying typing progress in your application.
