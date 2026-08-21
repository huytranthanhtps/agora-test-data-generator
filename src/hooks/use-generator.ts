import { useState, useCallback, useEffect } from 'react'
import { generate, getGenerator, type Record, type TextLen } from '@/core'

export function useGenerator() {
  const [entityKey, setEntityKey] = useState('parent')
  const [count, setCount] = useState(3)
  const [seed, setSeed] = useState('')
  const [len, setLen] = useState<TextLen>('long')
  const [messages, setMessages] = useState(5)
  const [parentFirstName, setParentFirstName] = useState('')
  const [parentLastName, setParentLastName] = useState('')
  const [rows, setRows] = useState<Record[]>([])

  const run = useCallback(() => {
    setRows(
      generate(entityKey, {
        count,
        len,
        seed: seed || undefined,
        messagesPerTicket: messages,
        parentFirstName,
        parentLastName,
      }),
    )
  }, [entityKey, count, len, seed, messages, parentFirstName, parentLastName])

  // Auto-generate on first load and whenever the entity changes, so a batch is
  // always on screen without an initial click. Option tweaks (count/seed/len)
  // still wait for an explicit Generate.
  useEffect(() => {
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityKey])

  const generator = getGenerator(entityKey)!
  return {
    entityKey,
    selectEntity: setEntityKey,
    count,
    setCount,
    seed,
    setSeed,
    len,
    setLen,
    messages,
    setMessages,
    parentFirstName,
    setParentFirstName,
    parentLastName,
    setParentLastName,
    rows,
    run,
    generator,
  }
}
