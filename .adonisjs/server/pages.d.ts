import '@adonisjs/inertia/types'

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    [key: string]: any
  }
}
