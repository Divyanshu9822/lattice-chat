import { type ClassValue, clsx } from 'clsx';

/**
 * Utility function to merge class names conditionally
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Generate a unique ID for components and data structures
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Format a timestamp into a human-readable relative time string
 * Handles both Date objects and date strings (from JSON serialization)
 */
export function formatTimestamp(date: Date | string): string {
  // Convert string dates back to Date objects if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) {
    return 'Unknown';
  }
  
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return dateObj.toLocaleDateString();
}
