// src/entry-server.tsx
import React from 'react'
import { renderToString } from 'react-dom/server'
import App from '../App'

export const render = (url: string, data: unknown) =>
  renderToString(<App initialUrl={url} initialData={data} />)
