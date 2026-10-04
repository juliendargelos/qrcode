export const SIZE = 7

export const POSITIONS = [
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 0 }
] as const

export function isCornerCell(x: number, y: number, data: boolean[][]) {
  return (
    (x < SIZE && y < SIZE) ||
    (x < SIZE && y >= data.length - SIZE) ||
    (x >= data.length - SIZE && y < SIZE)
  )
}

export function maximumRadius(cellSize: number) {
  return cellSize * SIZE / 2
}

export function path(
  cellSize: number,
  radius: number = 0,
  groovy: boolean = false
) {
  const cs = cellSize
  const os = cs * SIZE
  const is = os - cs * 2

  if (radius <= 0) {
    return (
      'M0,0' +
      `h${os} ` +
      `v${os} ` +
      `h${-os} ` +
      'z' +

      `M${cs},${cs} ` +
      `v${is} ` +
      `h${is} ` +
      `v${-is} ` +
      'z'
    )
  }

  const or = Math.max(0, Math.min(maximumRadius(cellSize), radius))
  const ir = groovy
    ? Math.min(cellSize * (SIZE - 2) / 2, or)
    : Math.max(0, or - cs)

  return (
    `M${or},0 ` +
    `L${os - or},0 ` +
    `A${or},${or} 0 0 1 ${os},${or} ` +
    `L${os},${os - or} ` +
    `A${or},${or} 0 0 1 ${os - or},${os} ` +
    `L${or},${os} ` +
    `A${or},${or} 0 0 1 0,${os - or} ` +
    `L0,${or} ` +
    `A${or},${or} 0 0 1 ${or},0 ` +
    'Z ' +

    `M${cs + ir},${cs} ` +
    `A${ir},${ir} 0 0 0 ${cs},${cs + ir} ` +
    `L${cs},${cs + is - ir} ` +
    `A${ir},${ir} 0 0 0 ${cs + ir},${cs + is} ` +
    `L${cs + is - ir},${cs + is} ` +
    `A${ir},${ir} 0 0 0 ${cs + is},${cs + is - ir} ` +
    `L${cs + is},${cs + ir} ` +
    `A${ir},${ir} 0 0 0 ${cs + is - ir},${cs} ` +
    'Z'
  )
}
