import * as corners from './corners'

export function minimumRadius(cellSize: number, cornerRadius: number) {
  return Math.max(0, Math.min(corners.maximumRadius(cellSize), cornerRadius) - cellSize * 2)
}

export function maximumRadius(cellSize: number) {
  return cellSize * (corners.SIZE - 4) / 2
}
