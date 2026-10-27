import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, getSettings, updateSettings, type Settings } from '@/shared/settings'

export interface UseSettingsResult {
  settings: Settings
  isLoading: boolean
  updateSettings: (patch: Partial<Settings>) => Promise<void>
}

/**
 * 读取并订阅 chrome.storage.sync 中的设置。
 * popup / options / content 三处共用，保持 UI 与后台设置一致。
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    void getSettings().then((next) => {
      if (!isActive) {
        return
      }
      setSettings(next)
      setIsLoading(false)
    })

    const handleChanged = (
      _changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'sync') {
        return
      }
      void getSettings().then((next) => {
        if (isActive) {
          setSettings(next)
        }
      })
    }

    chrome.storage.onChanged.addListener(handleChanged)

    return () => {
      isActive = false
      chrome.storage.onChanged.removeListener(handleChanged)
    }
  }, [])

  const update = useCallback(async (patch: Partial<Settings>) => {
    await updateSettings(patch)
  }, [])

  return { settings, isLoading, updateSettings: update }
}
