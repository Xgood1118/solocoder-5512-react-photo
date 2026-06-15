function toGrayscale(data: Uint8ClampedArray, width: number, height: number): number[][] {
  const gray: number[][] = []
  for (let y = 0; y < height; y++) {
    const row: number[] = []
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      row.push(0.299 * r + 0.587 * g + 0.114 * b)
    }
    gray.push(row)
  }
  return gray
}

function dct2(input: number[][]): number[][] {
  const n = input.length
  const output: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  const coeff = (i: number) => (i === 0 ? 1 / Math.sqrt(2) : 1)

  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      let sum = 0
      for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
          sum +=
            input[x][y] *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * n)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * n))
        }
      }
      output[u][v] = (coeff(u) * coeff(v) * sum) / 4
    }
  }
  return output
}

export async function computePHash(imageSource: HTMLImageElement | HTMLCanvasElement): Promise<string> {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(imageSource, 0, 0, size, size)
  const imgData = ctx.getImageData(0, 0, size, size)

  const gray = toGrayscale(imgData.data, size, size)
  const dct = dct2(gray)

  const lowFreq: number[] = []
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      lowFreq.push(dct[u][v])
    }
  }

  const withoutDC = lowFreq.slice(1)
  const mean = withoutDC.reduce((a, b) => a + b, 0) / withoutDC.length

  let bits = 0
  for (let i = 0; i < 64; i++) {
    if (lowFreq[i] > mean) {
      bits |= 1 << (63 - i)
    }
  }

  const hex = bits.toString(16).padStart(16, '0')
  return hex
}

export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return 64
  let dist = 0
  for (let i = 0; i < hash1.length; i++) {
    const a = parseInt(hash1[i], 16)
    const b = parseInt(hash2[i], 16)
    let xor = a ^ b
    while (xor) {
      dist += xor & 1
      xor >>= 1
    }
  }
  return dist
}
