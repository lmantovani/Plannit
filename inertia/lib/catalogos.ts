import { useEffect } from 'react'
import { router } from '@inertiajs/react'

// Chave do localStorage usada como sinal entre abas quando um catálogo de Configurações muda
export const SINAL_CATALOGO = 'plannit_catalogo_updated'
const NOME_CANAL = 'plannit_catalogos_channel'

/** Produtor: avisa as outras abas e a aba atual que um catálogo mudou (chame no onSuccess de toda mutação). */
export function notificarCatalogoAtualizado(chave: string) {
  if (typeof window === 'undefined') return

  const valor = `${chave}:${Date.now()}`
  try {
    localStorage.setItem(SINAL_CATALOGO, valor)
  } catch (err) {
    // ignora se localStorage estiver desabilitado ou em modo estrito
  }

  // Notifica componentes na mesma janela
  window.dispatchEvent(new CustomEvent(SINAL_CATALOGO, { detail: chave }))

  // Notifica outras abas instantaneamente via BroadcastChannel se disponível
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(NOME_CANAL)
      channel.postMessage({ chave, timestamp: Date.now() })
      channel.close()
    }
  } catch (err) {
    // fallback gracioso caso BroadcastChannel não esteja acessível
  }
}

/** Recarrega agora só as props de catálogo informadas (botão "Sincronizar"). */
export function recarregarCatalogos(props: string[], onFinish?: () => void) {
  router.reload({ only: props, onFinish })
}

/**
 * Consumidor: recarrega as props de catálogo quando outra aba avisa (storage / BroadcastChannel),
 * na mesma janela (CustomEvent) ou quando o usuário volta para esta aba (focus).
 */
export function useSincronizarCatalogos(props: string[]) {
  const chave = props.join(',')

  useEffect(() => {
    const only = chave.split(',')
    let isReloading = false

    const recarregar = () => {
      if (isReloading) return
      isReloading = true
      router.reload({
        only,
        onFinish: () => {
          isReloading = false
        },
      })
    }

    const aoMudarStorage = (e: StorageEvent) => {
      if (e.key === SINAL_CATALOGO) recarregar()
    }

    const aoMudarLocal = () => recarregar()

    window.addEventListener('focus', recarregar)
    window.addEventListener('storage', aoMudarStorage)
    window.addEventListener(SINAL_CATALOGO, aoMudarLocal)

    let channel: BroadcastChannel | null = null
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(NOME_CANAL)
        channel.onmessage = () => recarregar()
      }
    } catch (err) {
      // ignora se não suportado
    }

    return () => {
      window.removeEventListener('focus', recarregar)
      window.removeEventListener('storage', aoMudarStorage)
      window.removeEventListener(SINAL_CATALOGO, aoMudarLocal)
      if (channel) {
        channel.close()
      }
    }
  }, [chave])
}
