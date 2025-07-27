class HuffmanNode {
  char: string | null;
  frequency: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;

  constructor(char: string | null, frequency: number) {
    this.char = char;
    this.frequency = frequency;
    this.left = null;
    this.right = null;
  }
}

export class HuffmanCompressor {
  private buildHuffmanTree(
    frequencies: Map<string, number>
  ): HuffmanNode | null {
    const heap: HuffmanNode[] = [];

    for (const [char, freq] of frequencies) {
      heap.push(new HuffmanNode(char, freq));
    }

    heap.sort((a, b) => a.frequency - b.frequency);

    while (heap.length > 1) {
      const left = heap.shift()!;
      const right = heap.shift()!;

      const merged = new HuffmanNode(null, left.frequency + right.frequency);
      merged.left = left;
      merged.right = right;

      let inserted = false;
      for (let i = 0; i < heap.length; i++) {
        if (merged.frequency <= heap[i].frequency) {
          heap.splice(i, 0, merged);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        heap.push(merged);
      }
    }

    return heap.length > 0 ? heap[0] : null;
  }

  private generateCodes(root: HuffmanNode | null): Map<string, string> {
    const codes = new Map<string, string>();

    if (!root) return codes;

    if (!root.left && !root.right && root.char !== null) {
      codes.set(root.char, "0");
      return codes;
    }

    const traverse = (node: HuffmanNode, code: string) => {
      if (node.char !== null) {
        codes.set(node.char, code);
        return;
      }

      if (node.left) traverse(node.left, code + "0");
      if (node.right) traverse(node.right, code + "1");
    };

    traverse(root, "");
    return codes;
  }

  private serializeTree(node: HuffmanNode | null): any {
    if (!node) return null;

    return {
      char: node.char,
      frequency: node.frequency,
      left: this.serializeTree(node.left),
      right: this.serializeTree(node.right),
    };
  }

  private deserializeTree(data: any): HuffmanNode | null {
    if (!data) return null;

    const node = new HuffmanNode(data.char, data.frequency);
    node.left = this.deserializeTree(data.left);
    node.right = this.deserializeTree(data.right);

    return node;
  }

  private bitsToBase64(bits: string): string {
    const paddedBits = bits + "0".repeat((8 - (bits.length % 8)) % 8);

    let result = "";
    for (let i = 0; i < paddedBits.length; i += 8) {
      const byte = paddedBits.substr(i, 8);
      const charCode = Number.parseInt(byte, 2);
      result += String.fromCharCode(charCode);
    }

    return btoa(result);
  }

  private base64ToBits(base64: string, originalLength: number): string {
    const decoded = atob(base64);
    let bits = "";

    for (let i = 0; i < decoded.length; i++) {
      const byte = decoded.charCodeAt(i).toString(2).padStart(8, "0");
      bits += byte;
    }

    return bits.substring(0, originalLength);
  }

  compress(text: string): {
    compressed: string;
    tree: any;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } {
    if (!text) {
      throw new Error("Texto vazio não pode ser comprimido");
    }

    const frequencies = new Map<string, number>();
    for (const char of text) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }

    const root = this.buildHuffmanTree(frequencies);
    if (!root) {
      throw new Error("Erro ao construir a árvore de Huffman");
    }

    const codes = this.generateCodes(root);

    let compressedBits = "";
    for (const char of text) {
      compressedBits += codes.get(char) || "";
    }

    const originalSize = text.length * 8;
    const compressedSize = compressedBits.length;
    const compressionRatio =
      ((originalSize - compressedSize) / originalSize) * 100;

    const compressedBase64 = this.bitsToBase64(compressedBits);
    const serializedTree = this.serializeTree(root);

    const result = {
      compressed: compressedBase64,
      tree: serializedTree,
      originalSize,
      compressedSize,
      compressionRatio,
      bitsLength: compressedBits.length,
    };

    return {
      compressed: btoa(JSON.stringify(result)),
      tree: serializedTree,
      originalSize,
      compressedSize,
      compressionRatio,
    };
  }

  decompress(compressedData: string, tree: any): string {
    try {
      const data = JSON.parse(atob(compressedData));
      const root = this.deserializeTree(tree);

      if (!root) {
        throw new Error("Árvore de Huffman inválida");
      }

      const bits = this.base64ToBits(data.compressed, data.bitsLength);

      if (!root.left && !root.right && root.char !== null) {
        return root.char.repeat(bits.length);
      }

      let result = "";
      let currentNode = root;

      for (const bit of bits) {
        if (bit === "0") {
          currentNode = currentNode.left!;
        } else {
          currentNode = currentNode.right!;
        }

        if (currentNode.char !== null) {
          result += currentNode.char;
          currentNode = root;
        }
      }

      return result;
    } catch (error) {
      throw new Error("Erro na descompressão: dados corrompidos ou inválidos");
    }
  }
}
