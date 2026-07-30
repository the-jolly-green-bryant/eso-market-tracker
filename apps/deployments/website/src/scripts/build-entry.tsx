// src/entry-server.tsx
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Helmet } from 'react-helmet'
import App from '../App'

export const render = (url: string, data: unknown) => {
  const html = renderToString(<App initialUrl={url} initialData={data} />)
  const helmet = Helmet.renderStatic()

  return {
    html,
    head: [
      helmet.title.toString(),
      helmet.meta.toString(),
      helmet.link.toString(),
      helmet.script.toString(),
    ]
      .filter(Boolean)
      .join('\n'),
  }
}
