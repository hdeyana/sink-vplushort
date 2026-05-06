import { describe, expect, it } from 'vitest'
import { fetch, postJson } from './utils'

describe('/', () => {
  it('returns 200 for homepage request', async () => {
    const response = await fetch('/')
    expect(response.status).toBe(200)
  })

  it('redirects CriOS user agent to apple URL', async () => {
    const slug = `crios-apple-${crypto.randomUUID()}`
    const apple = 'https://apps.apple.com/app/sink-test'

    const createResponse = await postJson('/api/link/create', {
      url: 'https://example.com',
      slug,
      apple,
    })
    expect(createResponse.status).toBe(201)
    const createData = await createResponse.json() as { link: { apple?: string } }
    expect(createData.link.apple).toBe(apple)

    const response = await fetch(`/${slug}`, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147 Version/11.1.1 Safari/605.1.15',
      },
    })

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe(apple)
  })

  it('forwards extra query params to store URL when redirectWithQuery is enabled', async () => {
    const slug = `android-q-${crypto.randomUUID()}`
    const google = 'https://play.google.com/store/apps/details?id=com.example.app'

    const createResponse = await postJson('/api/link/create', {
      url: 'https://example.com',
      slug,
      google,
      redirectWithQuery: true,
    })
    expect(createResponse.status).toBe(201)

    const response = await fetch(`/${slug}?utm_source=newsletter&id=should-not-overwrite`, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
      },
    })

    expect(response.status).toBe(301)
    const location = response.headers.get('Location') || ''
    // Original store params must be preserved (id=com.example.app not overwritten)
    expect(location).toContain('id=com.example.app')
    expect(location).not.toContain('id=should-not-overwrite')
    // New params must be appended
    expect(location).toContain('utm_source=newsletter')
  })

  it('does not forward query to store URL when redirectWithQuery is disabled', async () => {
    const slug = `android-noq-${crypto.randomUUID()}`
    const google = 'https://play.google.com/store/apps/details?id=com.example.noq'

    const createResponse = await postJson('/api/link/create', {
      url: 'https://example.com',
      slug,
      google,
    })
    expect(createResponse.status).toBe(201)

    const response = await fetch(`/${slug}?utm_source=newsletter`, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
      },
    })

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe(google)
  })
})
