import { calculateTypingProgress, calculateProgressPercentage } from './progress';

/**
 * Test file for progress calculation utilities
 * Run this to verify the progress calculation logic works correctly
 */

console.log('Testing Progress Calculation Utilities\n');

// Test 1: Basic progress calculation
console.log('Test 1: Basic progress calculation');
const text1 = ['hello', 'world'];
const input1 = ['hello', 'wor'];
const progress1 = calculateTypingProgress(text1, input1, 1);
console.log('Text:', text1);
console.log('Input:', input1);
console.log('Current word index:', 1);
console.log('Result:', progress1);
console.log('Expected: ~73.3% (8 correct chars out of 10 total)');
console.log('');

// Test 2: Complete text
console.log('Test 2: Complete text');
const text2 = ['test', 'complete'];
const input2 = ['test', 'complete'];
const progress2 = calculateTypingProgress(text2, input2, 2);
console.log('Text:', text2);
console.log('Input:', input2);
console.log('Result:', progress2);
console.log('Expected: 100%');
console.log('');

// Test 3: Just started
console.log('Test 3: Just started');
const text3 = ['start', 'typing', 'now'];
const input3 = ['s', '', ''];
const progress3 = calculateTypingProgress(text3, input3, 0);
console.log('Text:', text3);
console.log('Input:', input3);
console.log('Result:', progress3);
console.log('Expected: ~8.3% (1 correct char out of 12 total)');
console.log('');

// Test 4: With errors
console.log('Test 4: With typing errors');
const text4 = ['hello', 'world'];
const input4 = ['hxllo', 'wo'];
const progress4 = calculateTypingProgress(text4, input4, 1);
console.log('Text:', text4);
console.log('Input:', input4);
console.log('Result:', progress4);
console.log('Expected: ~60% (6 correct chars: h,llo,w,o out of 10 total)');
console.log('');

// Test 5: Progress percentage only
console.log('Test 5: Progress percentage function');
const percentage = calculateProgressPercentage(['quick', 'test'], ['quick', 'te'], 1);
console.log('Result:', percentage + '%');
console.log('Expected: ~77.8% (7 correct chars out of 9 total)');
