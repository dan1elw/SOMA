import { describe, it, expect } from 'vitest'
import { detectQueryType } from './detectQueryType'

describe('detectQueryType', () => {
  it('recognizes pure digits as norad-id', () => {
    expect(detectQueryType('25544')).toBe('norad-id')
  })

  it('recognizes text as name', () => {
    expect(detectQueryType('hubble')).toBe('name')
  })

  it('recognizes mixed alphanumeric as name', () => {
    expect(detectQueryType('iss-1')).toBe('name')
  })

  it('trims whitespace before checking', () => {
    expect(detectQueryType('  25544  ')).toBe('norad-id')
  })

  it('empty string is name', () => {
    expect(detectQueryType('')).toBe('name')
  })

  it('single digit is norad-id', () => {
    expect(detectQueryType('1')).toBe('norad-id')
  })
})
