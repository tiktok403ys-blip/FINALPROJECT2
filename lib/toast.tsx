// Simple toast wrapper to handle missing react-hot-toast
export const toast = {
  success: (message: string) => {
    if (typeof window !== 'undefined') {
      // Fallback to browser alert if react-hot-toast is not available
      console.log('Success:', message)
      // You can replace this with a custom toast implementation
    }
  },
  error: (message: string) => {
    if (typeof window !== 'undefined') {
      console.error('Error:', message)
      // You can replace this with a custom toast implementation
    }
  },
  loading: (message: string) => {
    if (typeof window !== 'undefined') {
      console.log('Loading:', message)
      // You can replace this with a custom toast implementation
    }
  },
  dismiss: () => {
    // Dismiss implementation
  }
}

// Export a simple Toaster component
export const Toaster = () => {
  return null // Simple fallback
}