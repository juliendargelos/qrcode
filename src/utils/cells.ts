import { isCornerCell } from './corners'

interface Edge {
  x1: number
  y1: number
  x2: number
  y2: number
  dir: number
}

export function maximumRadius(cellSize: number, spacing: number) {
  return (cellSize - spacing) / 2
}

export function maximumSpacing(cellSize: number) {
  return cellSize
}

export function normalizeHoleSize(holeSize: number, data: boolean[][]) {
  return holeSize <= 0 ? 0 : data.length % 2
    ? Math.floor(holeSize / 2) * 2 + 1
    : Math.floor(holeSize / 2) * 2
}

export function path(
  data: boolean[][],
  cellSize: number,
  radius: number = 0,
  groovy: boolean = false,
  merge: boolean = true,
  spacing: number = 0,
  holeSize: number = 0
) {
  return spacing > 0 || (radius > 0 && !merge)
    ? unmergedPath(data, cellSize, radius, spacing, holeSize)
    : mergedPath(data, cellSize, radius, groovy, holeSize)
}

function mergedPath(
  data: boolean[][],
  cellSize: number,
  radius: number = 0,
  groovy: boolean = false,
  holeSize: number = 0
) {
  const matrixSize = data.length
  const outgoing = new Map<string, number[]>()
  const contours: [number, number][][] = []
  const visited: boolean[] = []
  const edges: Edge[] = []

  for (let y = 0; y < matrixSize; y++) {
    for (let x = 0; x < matrixSize; x++) {
      if (!isFilled(x, y, data, holeSize)) {
        continue
      }

      isFilled(x, y - 1, data, holeSize) || edges.push({
        x1: x,
        y1: y,
        x2: x + 1,
        y2: y,
        dir: 0,
      })

      isFilled(x + 1, y, data, holeSize) || edges.push({
        x1: x + 1,
        y1: y,
        x2: x + 1,
        y2: y + 1,
        dir: 1,
      })

      isFilled(x, y + 1, data, holeSize) || edges.push({
        x1: x + 1,
        y1: y + 1,
        x2: x,
        y2: y + 1,
        dir: 2,
      })

      isFilled(x - 1, y, data, holeSize) || edges.push({
        x1: x,
        y1: y + 1,
        x2: x,
        y2: y,
        dir: 3,
      })
    }
  }

  for (let index = 0; index < edges.length; index++) {
    const edge = edges[index]
    const k = key(edge.x1, edge.y1)

    let list = outgoing.get(k)

    if (!list) {
      list = []
      outgoing.set(k, list)
    }

    list.push(index)
  }

  for (let startIndex = 0; startIndex < edges.length; startIndex++) {
    if (visited[startIndex]) {
      continue
    }

    const startEdge = edges[startIndex]
    const contour: [number, number][] = [[startEdge.x1, startEdge.y1]]

    let index = startIndex

    while (index !== -1 && !visited[index]) {
      const edge = edges[index]

      visited[index] = true

      contour.push([edge.x2, edge.y2])

      if (edge.x2 === startEdge.x1 && edge.y2 === startEdge.y1) {
        break
      }

      index = chooseNextEdge(edge, edges, outgoing, visited)
    }

    contours.push(contour)
  }

  return contours
    .map(contour => drawContour(contour, cellSize, radius, groovy))
    .filter(Boolean)
    .join('')
}

function unmergedPath(
  data: boolean[][],
  cellSize: number,
  radius: number,
  spacing: number,
  holeSize: number
) {
  const maximumCellRadius = maximumRadius(cellSize, spacing)
  const size = cellSize - spacing
  const offset = spacing / 2

  if (size <= 0) {
    return ''
  }

  const paths: string[] = []

  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data[y].length; x++) {
      if (!isFilled(x, y, data, holeSize)) {
        continue
      }

      const left = x * cellSize + offset
      const top = y * cellSize + offset

      if (radius <= 0) {
        paths.push(
          `M${left} ${top}h${size}v${size}h${-size}z`
        )
        continue
      }

      if (radius >= maximumCellRadius) {
        const r = maximumCellRadius
        const cx = x * cellSize + cellSize / 2
        const cy = y * cellSize + cellSize / 2

        paths.push(
          `M${cx - r} ${cy}` +
          `a${r} ${r} 0 1 0 ${r * 2} 0` +
          `a${r} ${r} 0 1 0 ${-r * 2} 0z`
        )
        continue
      }

      const r = radius
      const straight = size - r * 2

      paths.push(
        `M${left + r} ${top}` +
        `h${straight}` +
        `a${r} ${r} 0 0 1 ${r} ${r}` +
        `v${straight}` +
        `a${r} ${r} 0 0 1 ${-r} ${r}` +
        `h${-straight}` +
        `a${r} ${r} 0 0 1 ${-r} ${-r}` +
        `v${-straight}` +
        `a${r} ${r} 0 0 1 ${r} ${-r}z`
      )
    }
  }

  return paths.join('')
}

function key(x: number, y: number) {
  return `${x},${y}`
}

function isFilled(x: number, y: number, data: boolean[][], holeSize: number) {
  holeSize = normalizeHoleSize(holeSize, data)

  const beforeHole = data.length / 2 - holeSize / 2
  const afterHole = data.length / 2 + holeSize / 2

  return (
    x >= 0 &&
    y >= 0 &&
    x < data.length &&
    y < data.length &&
    !(
      x >= beforeHole && x < afterHole &&
      y >= beforeHole && y < afterHole
    ) &&
    data[y][x] &&
    !isCornerCell(x, y, data)
  )
}

function chooseNextEdge(
  edge: Edge,
  edges: Edge[],
  outgoing: Map<string, number[]>,
  visited: boolean[]
) {
  const candidates = outgoing.get(key(edge.x2, edge.y2))

  if (!candidates) {
    return -1
  }

  const priorities = [
    (edge.dir + 1) % 4,
    edge.dir,
    (edge.dir + 3) % 4,
    (edge.dir + 2) % 4
  ]

  for (const dir of priorities) {
    for (const index of candidates) {
      if (!visited[index] && edges[index].dir === dir) {
        return index
      }
    }
  }

  return -1
}

function simplifyContour(contour: [number, number][]) {
  const points = contour.slice(0, -1)

  if (points.length <= 2) {
    return points
  }

  let changed = true

  while (changed && points.length > 2) {
    changed = false

    for (let i = 0; i < points.length; i++) {
      const prev = points[(i - 1 + points.length) % points.length]
      const curr = points[i]
      const next = points[(i + 1) % points.length]

      const sameX = prev[0] === curr[0] && curr[0] === next[0]
      const sameY = prev[1] === curr[1] && curr[1] === next[1]

      if (sameX || sameY) {
        points.splice(i, 1)
        changed = true
        break
      }
    }
  }

  return points
}

function drawSharpContour(
  points: [number, number][],
  cellSize: number
) {
  if (points.length === 0) {
    return ''
  }

  let d = `M${points[0][0] * cellSize} ${points[0][1] * cellSize}`

  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i]
    const [px, py] = points[i - 1]

    if (y === py) {
      d += `H${x * cellSize}`
    } else if (x === px) {
      d += `V${y * cellSize}`
    } else {
      d += `L${x * cellSize} ${y * cellSize}`
    }
  }

  return `${d}z`
}

function drawRoundedContour(
  points: [number, number][],
  cellSize: number,
  radius: number,
  groovy: boolean
) {
  if (points.length === 0) {
    return ''
  }

  const corners = points.map((curr, i) => {
    const prev = points[(i - 1 + points.length) % points.length]
    const next = points[(i + 1) % points.length]

    const x = curr[0] * cellSize
    const y = curr[1] * cellSize

    const prevX = prev[0] * cellSize
    const prevY = prev[1] * cellSize
    const nextX = next[0] * cellSize
    const nextY = next[1] * cellSize

    const prevLength = Math.abs(x - prevX) + Math.abs(y - prevY)
    const nextLength = Math.abs(nextX - x) + Math.abs(nextY - y)

    const incomingX = curr[0] - prev[0]
    const incomingY = curr[1] - prev[1]
    const outgoingX = next[0] - curr[0]
    const outgoingY = next[1] - curr[1]

    const cross = incomingX * outgoingY - incomingY * outgoingX
    const inner = cross < 0

    const cornerRadius = inner && !groovy
      ? Math.max(0, radius - cellSize / 2)
      : radius

    const r = Math.min(
      cornerRadius,
      prevLength / 2,
      nextLength / 2
    )

    const beforeX = x + Math.sign(prevX - x) * r
    const beforeY = y + Math.sign(prevY - y) * r

    const afterX = x + Math.sign(nextX - x) * r
    const afterY = y + Math.sign(nextY - y) * r

    return {
      x,
      y,
      r,
      beforeX,
      beforeY,
      afterX,
      afterY
    }
  })

  const first = corners[0]

  let d = `M${first.afterX} ${first.afterY}`

  for (let i = 1; i < corners.length; i++) {
    const corner = corners[i]

    d += `L${corner.beforeX} ${corner.beforeY}`

    if (corner.r > 0) {
      d += `Q${corner.x} ${corner.y} ${corner.afterX} ${corner.afterY}`
    }
  }

  d += `L${first.beforeX} ${first.beforeY}`

  if (first.r > 0) {
    d += `Q${first.x} ${first.y} ${first.afterX} ${first.afterY}`
  }

  return `${d}z`
}

function drawContour(
  contour: [number, number][],
  cellSize: number,
  radius: number,
  groovy: boolean
) {
  const points = simplifyContour(contour)

  if (radius <= 0) {
    return drawSharpContour(points, cellSize)
  }

  return drawRoundedContour(points, cellSize, radius, groovy)
}
