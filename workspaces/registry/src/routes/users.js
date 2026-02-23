import { getAuthedUser } from '../utils/auth'

export async function getUsername (c) {
  const { uuid } = await getAuthedUser({c})
  return c.json({ username: uuid }, 200)
}

export async function getUserProfile (c) {
  const { uuid } = await getAuthedUser({c})
  return c.json({ name: uuid }, 200)
}

export async function addUser(c) {
  try {
    // Handle different request formats from npm
    let username, email, password
    
    if (c.req.method === 'PUT') {
      // npm adduser sends username in URL path
      const pathUsername = c.req.param('username') || c.req.path.split(':').pop()
      const body = await c.req.json()
      username = pathUsername
      email = body.email || ''
      password = body.password || body._password || 'default'
    } else {
      // Regular POST request
      const body = await c.req.json()
      username = body.username || body.name
      email = body.email || ''
      password = body.password || body._password || 'default'
    }
    
    if (!username) {
      return c.json({ error: 'Username required' }, 400)
    }
    
    // Generate UUID for user
    const uuid = crypto.randomUUID()
    
    // Create user token (in a real implementation, you'd hash the password)
    const token = `user-${uuid}-${Date.now()}`
    
    // Insert user token
    const query = "INSERT INTO tokens (token, uuid, scope) VALUES (?1, ?2, ?3)"
    const scope = JSON.stringify([
      { values: ["*"], types: { pkg: { read: true, write: true }, user: { read: true, write: true } } }
    ])
    
    await c.env.DB.prepare(query).bind(token, uuid, scope).run()
    
    // Return npm-compatible response
    return c.json({
      username,
      email,
      token,
      created: new Date().toISOString(),
      id: uuid,
      ok: true
    })
  } catch (error) {
    Logger.error('User creation failed', { error: error.message })
    return c.json({ error: 'User creation failed' }, 500)
  }
}
