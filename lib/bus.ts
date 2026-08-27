import { EventEmitter } from "node:events"

const g = globalThis as typeof globalThis & { __boardBus?: EventEmitter }

export const bus = g.__boardBus ?? new EventEmitter()
bus.setMaxListeners(500)
g.__boardBus = bus
