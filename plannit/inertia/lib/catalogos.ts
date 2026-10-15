import { useEffect } from 'react'
import { router } from '@inertiajs/react'

// Chave do localStorage usada como sinal entre abas quando um catálogo de Configurações muda
export const SINAL_CATALOGO = 'plannit_catalogo_updated'

/** Produtor: avisa as outras abas que um catálogo mudou (chame no onSuccess de toda mutação). */
export function notificarCatalogoAtualizado(chave: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SINAL_CATALOGO, `${chave}:${Date.now()}`)
}

/** Recarrega agora só as props de catálogo informadas (botão "Sincronizar"). */
export function recarregarCatalogos(props: string[], onFinish?: () => void) {
  router.reload({ only: props, onFinish })
}

/**
 * Consumidor: recarrega as props de catálogo quando outra aba avisa (storage)
 * ou quando o usuário volta para esta aba (focus).
 */
export function useSincronizarCatalogos(props: string[]) {
  const chave = props.join(',')
  useEffect(() => {
    const only = chave.split(',')
    const recarregar = () => router.reload({ only })
    const aoMudarStorage = (e: StorageEvent) => {
      if (e.key === SINAL_CATALOGO) recarregar()
    }
    window.addEventListener('focus', recarregar)
    window.addEventListener('storage', aoMudarStorage)
    return () => {
      window.removeEventListener('focus', recarregar)
      window.removeEventListener('storage', aoMudarStorage)
    }
  }, [chave])
}
