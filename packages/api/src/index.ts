import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import tenantsRoute from './routes/tenants.js'
import contactsRoute from './routes/contacts.js'
import messagesRoute from './routes/messages.js'
import conversationsRoute from './routes/conversations.js'

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:5173'],
  allowHeaders: ['Content-Type', 'X-Tenant-Id'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  credentials: true,
}))

app.get('/', (c) => {
  return c.json({ 
    message: 'Multi-Tenant CRM API',
    version: '1.0.0',
    endpoints: {
      tenants: '/tenants',
      contacts: '/contacts',
      messages: '/messages',
      conversations: '/conversations'
    }
  })
})

app.route('/tenants', tenantsRoute)
app.route('/contacts', contactsRoute)
app.route('/messages', messagesRoute)
app.route('/conversations', conversationsRoute)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
