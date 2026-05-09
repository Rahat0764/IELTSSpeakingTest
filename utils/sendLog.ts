export async function sendLog(message: string, type: 'info' | 'error' | 'warn' = 'info') {
  try {
    await fetch('/api/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, type }),
    });
  } catch {
    // silently fail
  }
}
