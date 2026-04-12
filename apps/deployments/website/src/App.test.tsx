import { describe, it, expect } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import App from './App'

describe('app', () => {
  it('renders without crashing', () => {
    const { baseElement } = render(<App />)
    expect(baseElement).toBeDefined()
  })
})
