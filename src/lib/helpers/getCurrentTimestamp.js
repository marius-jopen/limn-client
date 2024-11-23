/**
 * Helper function that generates a timestamp string in the format: YYYYMMDD_HHMMSS
 * Used for creating unique, chronological identifiers or filenames
 * Example output: "20240320_143022" (for March 20, 2024 at 14:30:22)
 */

export function getCurrentTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}