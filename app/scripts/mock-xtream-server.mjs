import http from 'node:http'

const PORT = Number(process.env.MOCK_XTREAM_PORT || 8090)

const categories = [
  { category_id: '100', category_name: 'News' },
  { category_id: '200', category_name: 'Sports' },
  { category_id: '300', category_name: 'Movies' },
]

const streamsByCategory = {
  '100': [
    {
      stream_id: 1001,
      name: 'Global News HD',
      category_id: '100',
      container_extension: 'm3u8',
      direct_source: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    },
    {
      stream_id: 1002,
      name: 'World Report',
      category_id: '100',
      container_extension: 'm3u8',
      direct_source:
        'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    },
  ],
  '200': [
    {
      stream_id: 2001,
      name: 'Sport Arena Live',
      category_id: '200',
      container_extension: 'm3u8',
      direct_source: 'https://test-streams.mux.dev/pts_shift/master.m3u8',
    },
  ],
  '300': [
    {
      stream_id: 3001,
      name: 'Cinema Plus',
      category_id: '300',
      container_extension: 'm3u8',
      direct_source:
        'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mpd/.m3u8',
    },
  ],
}

const allStreams = Object.values(streamsByCategory).flat()

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  response.end(JSON.stringify(payload))
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || '/', `http://localhost:${PORT}`)

  if (request.method === 'OPTIONS') {
    sendJson(response, 200, {})
    return
  }

  if (requestUrl.pathname !== '/player_api.php') {
    sendJson(response, 404, { error: 'Not found' })
    return
  }

  const username = requestUrl.searchParams.get('username')
  const password = requestUrl.searchParams.get('password')

  if (username !== 'demo' || password !== 'demo') {
    sendJson(response, 401, { error: 'Invalid demo credentials' })
    return
  }

  const action = requestUrl.searchParams.get('action')
  if (action === 'get_live_categories') {
    sendJson(response, 200, categories)
    return
  }

  if (action === 'get_live_streams') {
    const categoryId = requestUrl.searchParams.get('category_id')
    if (!categoryId) {
      sendJson(response, 200, allStreams)
      return
    }
    sendJson(response, 200, streamsByCategory[categoryId] || [])
    return
  }

  sendJson(response, 400, { error: 'Unsupported action' })
})

server.listen(PORT, () => {
  console.log(`Mock Xtream server running on http://localhost:${PORT}`)
  console.log('Use credentials username=demo password=demo')
})
