import { useState, useCallback } from 'react'
import { generate, getGenerator, type Record, type TextLen } from '@/core'

export function useGenerator() {
  const [entityKey, setEntityKey] = useState('parent')
  const [count, setCount] = useState(3)
  const [seed, setSeed] = useState('')
  const [len, setLen] = useState<TextLen>('normal')
  const [messages, setMessages] = useState(5)
  const [rows, setRows] = useState<Record[]>([])

  const run = useCallback(() => {
    setRows(generate(entityKey, {
      count, len, seed: seed || undefined,
      messagesPerTicket: messages,
    }))
  }, [entityKey, count, len, seed, messages])

  const generator = getGenerator(entityKey)!
  return { entityKey, setEntityKey, count, setCount, seed, setSeed, len, setLen,
    messages, setMessages, rows, run, generator }
}
