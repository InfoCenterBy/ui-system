import { serve } from '@hono/node-server'
import { createApp } from './app'

const port = 5181

serve({ fetch: createApp().fetch, port, hostname: '127.0.0.1' }, () => {
	console.log(`Builder server on http://localhost:${port}`)
})
