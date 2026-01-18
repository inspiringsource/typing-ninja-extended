# Formatted Typing Test - Demo Document

## Code Sample for Testing

Here's a sample JavaScript function with proper indentation and formatting:

```javascript
function fibonacci(n) {
	if (n <= 1) {
		return n;
	}
	return fibonacci(n - 1) + fibonacci(n - 2);
}

// Example usage
const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
for (let i = 0; i < numbers.length; i++) {
	console.log(`fibonacci(${numbers[i]}) = ${fibonacci(numbers[i])}`);
}
```

## Python Example

```python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr

    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]

    return quick_sort(left) + middle + quick_sort(right)

# Test the function
test_array = [3, 6, 8, 10, 1, 2, 1]
sorted_array = quick_sort(test_array)
print(f"Original: {test_array}")
print(f"Sorted: {sorted_array}")
```

This document demonstrates how formatted text preserves:

- Proper indentation with tabs
- Line breaks and spacing
- Code structure and readability
- Comments and documentation
