import { useState, useCallback } from 'react'

const STORAGE_KEY = 'ct_api_key'

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(
    () => sessionStorage.getItem(STORAGE_KEY)
  )

  const setApiKey = useCallback((key: string) => {
    sessionStorage.setItem(STORAGE_KEY, key)
    setApiKeyState(key)
  }, [])

  const clearApiKey = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setApiKeyState(null)
  }, [])

  const validate = useCallback((key: string): boolean => {
    return /^sk-[A-Za-z0-9]/.test(key)
  }, [])

  return { apiKey, setApiKey, clearApiKey, validate }
}
