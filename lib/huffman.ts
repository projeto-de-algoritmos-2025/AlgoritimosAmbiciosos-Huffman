// Classe para representar um nó da árvore de Huffman
class HuffmanNode {
  char: string | null
  frequency: number
  left: HuffmanNode | null
  right: HuffmanNode | null

  constructor(char: string | null, frequency: number) {
    this.char = char
    this.frequency = frequency
    this.left = null
    this.right = null
  }
}

// Classe principal do compressor Huffman
export class HuffmanCompressor {
  // Constrói a árvore de Huffman a partir das frequências dos caracteres
  private buildHuffmanTree(frequencies: Map<string, number>): HuffmanNode | null {
    // Cria uma fila de prioridade (min-heap) usando array
    const heap: HuffmanNode[] = []

    // Adiciona todos os caracteres como nós folha
    for (const [char, freq] of frequencies) {
      heap.push(new HuffmanNode(char, freq))
    }

    // Ordena o heap por frequência
    heap.sort((a, b) => a.frequency - b.frequency)

    // Constrói a árvore
    while (heap.length > 1) {
      // Remove os dois nós com menor frequência
      const left = heap.shift()!
      const right = heap.shift()!

      // Cria um novo nó interno
      const merged = new HuffmanNode(null, left.frequency + right.frequency)
      merged.left = left
      merged.right = right

      // Insere o novo nó de volta no heap mantendo a ordem
      let inserted = false
      for (let i = 0; i < heap.length; i++) {
        if (merged.frequency <= heap[i].frequency) {
          heap.splice(i, 0, merged)
          inserted = true
          break
        }
      }
      if (!inserted) {
        heap.push(merged)
      }
    }

    return heap.length > 0 ? heap[0] : null
  }

  // Gera os códigos de Huffman para cada caractere
  private generateCodes(root: HuffmanNode | null): Map<string, string> {
    const codes = new Map<string, string>()

    if (!root) return codes

    // Caso especial: apenas um caractere único
    if (!root.left && !root.right && root.char !== null) {
      codes.set(root.char, "0")
      return codes
    }

    const traverse = (node: HuffmanNode, code: string) => {
      if (node.char !== null) {
        // Nó folha - armazena o código
        codes.set(node.char, code)
        return
      }

      // Nó interno - continua a travessia
      if (node.left) traverse(node.left, code + "0")
      if (node.right) traverse(node.right, code + "1")
    }

    traverse(root, "")
    return codes
  }

  // Serializa a árvore para poder reconstruí-la na descompressão
  private serializeTree(node: HuffmanNode | null): any {
    if (!node) return null

    return {
      char: node.char,
      frequency: node.frequency,
      left: this.serializeTree(node.left),
      right: this.serializeTree(node.right),
    }
  }

  // Reconstrói a árvore a partir dos dados serializados
  private deserializeTree(data: any): HuffmanNode | null {
    if (!data) return null

    const node = new HuffmanNode(data.char, data.frequency)
    node.left = this.deserializeTree(data.left)
    node.right = this.deserializeTree(data.right)

    return node
  }

  // Converte string de bits para Base64 para facilitar o armazenamento
  private bitsToBase64(bits: string): string {
    // Adiciona padding para completar múltiplos de 8
    const paddedBits = bits + "0".repeat((8 - (bits.length % 8)) % 8)

    let result = ""
    for (let i = 0; i < paddedBits.length; i += 8) {
      const byte = paddedBits.substr(i, 8)
      const charCode = Number.parseInt(byte, 2)
      result += String.fromCharCode(charCode)
    }

    return btoa(result)
  }

  // Converte Base64 de volta para string de bits
  private base64ToBits(base64: string, originalLength: number): string {
    const decoded = atob(base64)
    let bits = ""

    for (let i = 0; i < decoded.length; i++) {
      const byte = decoded.charCodeAt(i).toString(2).padStart(8, "0")
      bits += byte
    }

    // Remove o padding e retorna apenas os bits originais
    return bits.substring(0, originalLength)
  }

  // Função principal de compressão
  compress(text: string): {
    compressed: string
    tree: any
    originalSize: number
    compressedSize: number
    compressionRatio: number
  } {
    if (!text) {
      throw new Error("Texto vazio não pode ser comprimido")
    }

    // Calcula as frequências dos caracteres
    const frequencies = new Map<string, number>()
    for (const char of text) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1)
    }

    // Constrói a árvore de Huffman
    const root = this.buildHuffmanTree(frequencies)
    if (!root) {
      throw new Error("Erro ao construir a árvore de Huffman")
    }

    // Gera os códigos
    const codes = this.generateCodes(root)

    // Comprime o texto
    let compressedBits = ""
    for (const char of text) {
      compressedBits += codes.get(char) || ""
    }

    // Calcula estatísticas
    const originalSize = text.length * 8 // 8 bits por caractere ASCII
    const compressedSize = compressedBits.length
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

    // Converte para Base64 e serializa a árvore
    const compressedBase64 = this.bitsToBase64(compressedBits)
    const serializedTree = this.serializeTree(root)

    // Adiciona metadados para a descompressão
    const result = {
      compressed: compressedBase64,
      tree: serializedTree,
      originalSize,
      compressedSize,
      compressionRatio,
      bitsLength: compressedBits.length, // Necessário para remover padding
    }

    return {
      compressed: btoa(JSON.stringify(result)),
      tree: serializedTree,
      originalSize,
      compressedSize,
      compressionRatio,
    }
  }

  // Função principal de descompressão
  decompress(compressedData: string, tree: any): string {
    try {
      // Decodifica os dados
      const data = JSON.parse(atob(compressedData))
      const root = this.deserializeTree(tree)

      if (!root) {
        throw new Error("Árvore de Huffman inválida")
      }

      // Converte Base64 de volta para bits
      const bits = this.base64ToBits(data.compressed, data.bitsLength)

      // Caso especial: apenas um caractere único
      if (!root.left && !root.right && root.char !== null) {
        return root.char.repeat(bits.length)
      }

      // Descomprime usando a árvore
      let result = ""
      let currentNode = root

      for (const bit of bits) {
        if (bit === "0") {
          currentNode = currentNode.left!
        } else {
          currentNode = currentNode.right!
        }

        // Se chegou a uma folha, adiciona o caractere e volta à raiz
        if (currentNode.char !== null) {
          result += currentNode.char
          currentNode = root
        }
      }

      return result
    } catch (error) {
      throw new Error("Erro na descompressão: dados corrompidos ou inválidos")
    }
  }
}
