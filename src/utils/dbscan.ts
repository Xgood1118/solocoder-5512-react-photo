export interface DBScanPoint {
  id: string
  vector: number[]
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

function rangeQuery(points: DBScanPoint[], q: DBScanPoint, eps: number): DBScanPoint[] {
  const neighbors: DBScanPoint[] = []
  for (const p of points) {
    if (euclideanDistance(p.vector, q.vector) <= eps) {
      neighbors.push(p)
    }
  }
  return neighbors
}

export function dbscan(
  points: DBScanPoint[],
  eps: number,
  minPts: number,
): { clusters: string[][]; noise: string[] } {
  const visited = new Set<string>()
  const clustered = new Set<string>()
  const clusters: string[][] = []
  const noise: string[] = []

  for (const p of points) {
    if (visited.has(p.id)) continue
    visited.add(p.id)

    const neighbors = rangeQuery(points, p, eps)
    if (neighbors.length < minPts) {
      noise.push(p.id)
      continue
    }

    const cluster: string[] = []
    clusters.push(cluster)
    cluster.push(p.id)
    clustered.add(p.id)

    let seedList = neighbors.filter((n) => n.id !== p.id)
    let i = 0
    while (i < seedList.length) {
      const q = seedList[i]
      if (!visited.has(q.id)) {
        visited.add(q.id)
        const qNeighbors = rangeQuery(points, q, eps)
        if (qNeighbors.length >= minPts) {
          for (const n of qNeighbors) {
            if (!seedList.some((s) => s.id === n.id)) {
              seedList.push(n)
            }
          }
        }
      }
      if (!clustered.has(q.id)) {
        cluster.push(q.id)
        clustered.add(q.id)
        const noiseIdx = noise.indexOf(q.id)
        if (noiseIdx >= 0) noise.splice(noiseIdx, 1)
      }
      i++
    }
  }

  return { clusters, noise }
}
