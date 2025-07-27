"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, FileText, Zap, BarChart3 } from "lucide-react"
import { HuffmanCompressor } from "@/lib/huffman"

export default function HuffmanCompressorApp() {
  const [inputText, setInputText] = useState("")
  const [compressedData, setCompressedData] = useState<{
    compressed: string
    tree: any
    originalSize: number
    compressedSize: number
    compressionRatio: number
  } | null>(null)
  const [decompressedText, setDecompressedText] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const compressor = new HuffmanCompressor()

  const handleCompress = () => {
    if (!inputText.trim()) return

    const result = compressor.compress(inputText)
    setCompressedData(result)
    setDecompressedText("")
  }

  const handleDecompress = () => {
    if (!compressedData) return

    const result = compressor.decompress(compressedData.compressed, compressedData.tree)
    setDecompressedText(result)
  }

  const downloadCompressedFile = () => {
    if (!compressedData) return

    const fileData = {
      tree: compressedData.tree,
      compressed: compressedData.compressed,
      originalSize: compressedData.originalSize,
      compressedSize: compressedData.compressedSize,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(fileData)], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "compressed_text.huff"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string

        if (file.name.endsWith(".huff")) {
          const data = JSON.parse(content)
          setCompressedData({
            compressed: data.compressed,
            tree: data.tree,
            originalSize: data.originalSize,
            compressedSize: data.compressedSize,
            compressionRatio: ((data.originalSize - data.compressedSize) / data.originalSize) * 100,
          })
        } else {
          setInputText(content)
        }
      } catch (error) {
        alert("Erro ao ler o arquivo. Verifique se é um arquivo válido.")
      }
    }
    reader.readAsText(file)
  }

  const compressionPercentage = compressedData ? Math.round(compressedData.compressionRatio) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Zap className="h-8 w-8 text-blue-600" />
            Compressor Huffman
          </h1>
          <p className="text-gray-600 text-lg">Comprima e descomprima textos usando o algoritmo de Huffman</p>
        </div>

        {compressedData && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas de Compressão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{compressedData.originalSize}</div>
                  <div className="text-sm text-gray-600">Bits Originais</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{compressedData.compressedSize}</div>
                  <div className="text-sm text-gray-600">Bits Comprimidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{compressionPercentage}%</div>
                  <div className="text-sm text-gray-600">Redução</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(compressedData.originalSize / compressedData.compressedSize).toFixed(2)}x
                  </div>
                  <div className="text-sm text-gray-600">Taxa de Compressão</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progresso da Compressão</span>
                  <span>{compressionPercentage}%</span>
                </div>
                <Progress value={compressionPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="compress" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compress">Comprimir</TabsTrigger>
            <TabsTrigger value="decompress">Descomprimir</TabsTrigger>
          </TabsList>

          <TabsContent value="compress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Compressão de Texto
                </CardTitle>
                <CardDescription>
                  Digite ou carregue um texto para comprimir usando o algoritmo de Huffman
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Carregar arquivo de texto</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".txt,.huff"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="input-text">Ou digite o texto aqui</Label>
                  <Textarea
                    id="input-text"
                    placeholder="Digite o texto que deseja comprimir..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-[200px] font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCompress} disabled={!inputText.trim()} className="flex-1">
                    <Zap className="h-4 w-4 mr-2" />
                    Comprimir Texto
                  </Button>

                  {compressedData && (
                    <Button onClick={downloadCompressedFile} variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Baixar Arquivo
                    </Button>
                  )}
                </div>

                {compressedData && (
                  <div className="space-y-2">
                    <Label>Dados Comprimidos (Base64)</Label>
                    <Textarea
                      value={compressedData.compressed}
                      readOnly
                      className="min-h-[100px] font-mono text-xs bg-gray-50"
                    />
                    <div className="flex gap-2">
                      <Badge variant="secondary">Original: {Math.ceil(inputText.length * 8)} bits</Badge>
                      <Badge variant="secondary">Comprimido: {compressedData.compressedSize} bits</Badge>
                      <Badge variant="default">Economia: {compressionPercentage}%</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decompress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Descompressão de Texto
                </CardTitle>
                <CardDescription>
                  Carregue um arquivo .huff ou use os dados comprimidos para descomprimir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="decompress-file">Carregar arquivo comprimido (.huff)</Label>
                  <Input
                    id="decompress-file"
                    type="file"
                    accept=".huff"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                </div>

                <Button onClick={handleDecompress} disabled={!compressedData} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Descomprimir Texto
                </Button>

                {decompressedText && (
                  <div className="space-y-2">
                    <Label>Texto Descomprimido</Label>
                    <Textarea
                      value={decompressedText}
                      readOnly
                      className="min-h-[200px] font-mono bg-green-50 border-green-200"
                    />
                    <Badge variant="default" className="bg-green-600">
                      Descompressão realizada com sucesso!
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-gray-500 text-sm">
          <p>Algoritmo de Huffman - Compressão sem perda de dados</p>
        </div>
      </div>
    </div>
  )
}
