import { serve } from '@hono/node-server'
import { createApp } from './app'

// BUILDER_PORT lets several copies run side by side, the UI uses the next port
const port = Number(process.env.BUILDER_PORT ?? 5180) + 1

serve({ fetch: createApp().fetch, port, hostname: '127.0.0.1' }, () => {
	console.log(`Builder server on http://localhost:${port}`)
})
