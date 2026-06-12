import express from 'express'

const app = express()
app.use(express.json())

// Simulate realistic delivery outcomes
function simulateOutcome(): { event: string; delayMs: number }[] {
  const rand = Math.random()
  const baseDelay = Math.floor(Math.random() * 3000) + 1000 // 1-4 seconds

  if (rand < 0.05) {
    // 5% fail immediately
    return [{ event: 'failed', delayMs: baseDelay }]
  } else if (rand < 0.15) {
    // 10% delivered but never opened
    return [{ event: 'delivered', delayMs: baseDelay }]
  } else if (rand < 0.55) {
    // 40% delivered and opened
    return [
      { event: 'delivered', delayMs: baseDelay },
      { event: 'opened', delayMs: baseDelay + 2000 },
    ]
  } else {
    // 45% delivered, opened, and clicked
    return [
      { event: 'delivered', delayMs: baseDelay },
      { event: 'opened', delayMs: baseDelay + 2000 },
      { event: 'clicked', delayMs: baseDelay + 4000 },
    ]
  }
}

// POST /send — CRM calls this to send a message
app.post('/send', async (req, res) => {
  const { communicationId, recipient, channel, message, callbackUrl } = req.body

  console.log(`📤 Sending ${channel} to ${recipient} [${communicationId}]`)

  res.json({ accepted: true, communicationId })

  // Simulate async delivery events
  const events = simulateOutcome()

  for (const { event, delayMs } of events) {
    setTimeout(async () => {
      try {
        await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ communicationId, event }),
        })
        console.log(`  ↩ Callback sent: ${event} for ${communicationId}`)
      } catch (err) {
        console.error(`  ✗ Callback failed for ${communicationId}:`, err)
      }
    }, delayMs)
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'channel-stub' })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`🔌 Channel stub running on http://localhost:${PORT}`)
})