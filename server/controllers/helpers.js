// Function to pause a function (non-blocking)
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }