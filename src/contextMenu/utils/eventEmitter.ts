type EventMap = { [key: string]: unknown }
type EventKey<T extends EventMap> = string & keyof T
type EventReceiver<T> = (params: T) => void
export type EmitterUnsubscribe = () => void

export interface Emitter<T extends EventMap> {
  on<K extends EventKey<T>>(
    eventName: K,
    fn: EventReceiver<T[K]>,
  ): EmitterUnsubscribe
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void
}

// `listeners` are unbounded -- don't use this in practice!
export function eventEmitter<T extends EventMap>(): Emitter<T> {
  const listeners: {
    [K in keyof T]?: ((p: T[K]) => void)[]
  } = {}

  return {
    on(key, fn) {
      listeners[key] = (listeners[key] || []).concat(fn)
      return () => this.off(key, fn)
    },
    off(key, fn) {
      listeners[key] = (listeners[key] || []).filter((f) => f !== fn)
    },
    emit(key, data) {
      const fns = listeners[key] || []
      for (let i = fns.length - 1; i >= 0; i--) {
        fns[i]!(data)
      }
    },
  }
}
