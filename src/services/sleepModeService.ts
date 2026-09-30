/**
 * Sleep Mode Checker
 * Evaluates whether current device time is within configured Sleep Mode hours
 */

export function isCurrentTimeInSleepRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = (isNaN(startHour) ? 23 : startHour) * 60 + (isNaN(startMin) ? 0 : startMin);
  const endMinutes = (isNaN(endHour) ? 7 : endHour) * 60 + (isNaN(endMin) ? 0 : endMin);

  if (startMinutes <= endMinutes) {
    // Standard same-day range (e.g., 01:00 to 06:00)
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Overnight range spanning midnight (e.g., 23:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}
