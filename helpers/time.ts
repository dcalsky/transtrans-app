export function formatDuration(duration: number): string {
  // Convert milliseconds to seconds
  const totalSeconds = Math.floor(duration / 1000);

  // Calculate minutes and seconds
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Format minutes and seconds to always be two digits
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  // Return the formatted string
  return `${formattedMinutes}:${formattedSeconds}`;
}

export function formatIsoToDatetime(isoString: string): string {
  return new Date(isoString).toISOString().replace('T', ' ').substring(0, 16);
}