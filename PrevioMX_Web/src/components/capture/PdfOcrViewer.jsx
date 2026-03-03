import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import Tesseract from 'tesseract.js'
import { API_CONFIG } from '../../config/api.config'

// Worker para PDF.js: en dev Vite sirve desde node_modules; en prod usamos base + nombre fijo (IIS)
if (import.meta.env.DEV) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
} else {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/*$/, '/')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${base}pdf.worker.min.mjs`
}

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const ZOOM_STEP = 0.25

const PdfOcrViewer = ({
    pdfUrl,
    title = 'PDF',
    rotation = 0,
    onTextExtracted,
    toolbarExtra = null,
    /** Si es true, activa modo selección desde fuera (ej. para rellenar número de parte desde el formulario) */
    forceSelectionMode = false,
    /** Llamado cuando el usuario cancela la selección (para que el padre limpie ocrTarget) */
    onSelectionCancelled = null
}) => {
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const overlayRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pdfDoc, setPdfDoc] = useState(null)
    const [pageNum, setPageNum] = useState(1)
    const [numPages, setNumPages] = useState(0)
    const [scale, setScale] = useState(1.5)
    const [selectionMode, setSelectionMode] = useState(false)
    const [selection, setSelection] = useState(null) // { x, y, w, h } en coordenadas de canvas
    const [drawing, setDrawing] = useState(false)
    const [startPoint, setStartPoint] = useState(null)
    const [ocrLoading, setOcrLoading] = useState(false)

    // Sincronizar modo selección cuando el padre lo pide (ej. "Seleccionar del PDF" en número de parte)
    useEffect(() => {
        if (forceSelectionMode) {
            setSelectionMode(true)
            setSelection(null)
            setStartPoint(null)
        } else {
            setSelectionMode(false)
            setSelection(null)
            setStartPoint(null)
        }
    }, [forceSelectionMode])

    const renderPage = useCallback(async () => {
        if (!pdfDoc || !canvasRef.current) return
        setLoading(true)
        setError(null)
        try {
            const page = await pdfDoc.getPage(pageNum)
            const viewport = page.getViewport({ scale, rotation })
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            canvas.width = viewport.width
            canvas.height = viewport.height
            await page.render({
                canvasContext: ctx,
                viewport
            }).promise
            setSelection(null)
        } catch (err) {
            console.error('Error rendering PDF page:', err)
            setError(err.message || 'Error al cargar la página')
        } finally {
            setLoading(false)
        }
    }, [pdfDoc, pageNum, scale, rotation])

    // Si la URL del PDF es de otro origen (cross-origin), el navegador bloquea el fetch por CORS. Usar proxy del API.
    const getEffectivePdfUrl = useCallback((url) => {
        if (!url || typeof url !== 'string') return { url: url, useProxy: false }
        try {
            const pdfOrigin = new URL(url).origin
            const appOrigin = typeof window !== 'undefined' ? window.location.origin : ''
            if (appOrigin && pdfOrigin !== appOrigin) {
                const base = (API_CONFIG.BASE_URL || '').replace(/\/*$/, '')
                const proxyUrl = `${base}/api/Visualization/pdf-proxy?url=${encodeURIComponent(url)}`
                return { url: proxyUrl, useProxy: true }
            }
        } catch (e) {
            // URL inválida, usar tal cual
        }
        return { url: url, useProxy: false }
    }, [])

    useEffect(() => {
        if (!pdfUrl) {
            setPdfDoc(null)
            setNumPages(0)
            setLoading(false)
            return
        }
        let cancelled = false
        setLoading(true)
        setError(null)
        const loadPdf = async () => {
            try {
                const { url: effectiveUrl, useProxy } = getEffectivePdfUrl(pdfUrl)
                const options = { url: effectiveUrl }
                if (useProxy && typeof window !== 'undefined') {
                    const token = window.localStorage.getItem('token')
                    if (token) options.httpHeaders = { Authorization: `Bearer ${token}` }
                }
                const doc = await pdfjsLib.getDocument(options).promise
                if (cancelled) return
                setPdfDoc(doc)
                setNumPages(doc.numPages)
            } catch (err) {
                if (!cancelled) {
                    console.error('Error loading PDF:', err)
                    setError(err.message || 'Error al cargar el PDF')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        loadPdf()
        return () => { cancelled = true }
    }, [pdfUrl, getEffectivePdfUrl])

    useEffect(() => {
        if (pdfDoc) renderPage()
    }, [pdfDoc, renderPage])

    const getCanvasCoords = useCallback((e) => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        }
    }, [])

    const handleMouseDown = (e) => {
        if (!selectionMode) return
        const coords = getCanvasCoords(e)
        if (coords) {
            setStartPoint(coords)
            setDrawing(true)
            setSelection(null)
        }
    }

    const handleMouseMove = (e) => {
        if (!drawing || !startPoint) return
        const coords = getCanvasCoords(e)
        if (coords) {
            const x = Math.min(startPoint.x, coords.x)
            const y = Math.min(startPoint.y, coords.y)
            const w = Math.abs(coords.x - startPoint.x)
            const h = Math.abs(coords.y - startPoint.y)
            setSelection({ x, y, w, h })
        }
    }

    const handleMouseUp = () => {
        setDrawing(false)
    }

    const drawSelectionOverlay = useCallback(() => {
        const overlay = overlayRef.current
        const canvas = canvasRef.current
        if (!overlay || !canvas) return
        const rect = canvas.getBoundingClientRect()
        overlay.width = rect.width
        overlay.height = rect.height
        const ctx = overlay.getContext('2d')
        ctx.clearRect(0, 0, overlay.width, overlay.height)
        if (!selection) return
        const scaleX = rect.width / canvas.width
        const scaleY = rect.height / canvas.height
        ctx.strokeStyle = 'rgba(13, 110, 253, 0.9)'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.strokeRect(
            selection.x * scaleX,
            selection.y * scaleY,
            selection.w * scaleX,
            selection.h * scaleY
        )
        ctx.fillStyle = 'rgba(13, 110, 253, 0.1)'
        ctx.fillRect(
            selection.x * scaleX,
            selection.y * scaleY,
            selection.w * scaleX,
            selection.h * scaleY
        )
    }, [selection])

    useEffect(() => {
        drawSelectionOverlay()
    }, [selection, drawSelectionOverlay])

    const runOcr = useCallback(async () => {
        if (!selection || !canvasRef.current) return
        const canvas = canvasRef.current
        const { x, y, w, h } = selection
        if (w < 5 || h < 5) return
        setOcrLoading(true)
        try {
            const cropCanvas = document.createElement('canvas')
            cropCanvas.width = w
            cropCanvas.height = h
            const ctx = cropCanvas.getContext('2d')
            ctx.drawImage(canvas, x, y, w, h, 0, 0, w, h)
            const { data: { text } } = await Tesseract.recognize(cropCanvas, 'spa', {
                logger: () => {}
            })
            const trimmed = (text || '').trim()
            if (onTextExtracted) onTextExtracted(trimmed)
        } catch (err) {
            console.error('OCR error:', err)
            if (onTextExtracted) onTextExtracted('')
        } finally {
            setOcrLoading(false)
        }
    }, [selection, onTextExtracted])

    // Con forceSelectionMode (desde input número de parte): al soltar el mouse con región válida, ejecutar OCR y rellenar el input
    useEffect(() => {
        if (!drawing && selection && selection.w >= 5 && selection.h >= 5 && forceSelectionMode && !ocrLoading && onTextExtracted) {
            runOcr()
        }
    }, [drawing, selection, forceSelectionMode, ocrLoading, onTextExtracted, runOcr])

    const cancelSelection = () => {
        setSelection(null)
        setSelectionMode(false)
        setStartPoint(null)
        if (onSelectionCancelled) onSelectionCancelled()
    }

    if (!pdfUrl) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4">
                <i className="bi bi-file-earmark-pdf" style={{ fontSize: '48px' }}></i>
                <p className="mt-2 mb-0">No hay documento</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-danger p-4">
                <i className="bi bi-exclamation-triangle" style={{ fontSize: '48px' }}></i>
                <p className="mt-2 mb-0">{error}</p>
            </div>
        )
    }

    return (
        <div className="d-flex flex-column h-100" ref={containerRef}>
            <div
                className="d-flex align-items-center justify-content-between flex-wrap gap-2 px-2 py-2 border-bottom bg-light"
                style={{ minHeight: '45px' }}
            >
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>{title}</span>
                    {numPages > 0 && (
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                            Página {pageNum} / {numPages}
                        </span>
                    )}
                </div>
                <div className="d-flex align-items-center gap-1 flex-wrap">
                    {numPages > 1 && (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={pageNum <= 1 || loading}
                                onClick={() => setPageNum(p => Math.max(1, p - 1))}
                                title="Página anterior"
                                style={{ borderRadius: '8px' }}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={pageNum >= numPages || loading}
                                onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
                                title="Página siguiente"
                                style={{ borderRadius: '8px' }}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>
                            <div className="vr"></div>
                        </>
                    )}
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        disabled={loading || scale <= ZOOM_MIN}
                        onClick={() => setScale(s => Math.max(ZOOM_MIN, s - ZOOM_STEP))}
                        title="Alejar (zoom out)"
                        style={{ borderRadius: '8px' }}
                    >
                        <i className="bi bi-dash-lg"></i>
                    </button>
                    <span className="text-muted" style={{ fontSize: '0.8rem', minWidth: '3rem', textAlign: 'center' }}>
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        disabled={loading || scale >= ZOOM_MAX}
                        onClick={() => setScale(s => Math.min(ZOOM_MAX, s + ZOOM_STEP))}
                        title="Acercar (zoom in)"
                        style={{ borderRadius: '8px' }}
                    >
                        <i className="bi bi-plus-lg"></i>
                    </button>
                    {toolbarExtra}
                </div>
            </div>
            <div
                className="flex-grow-1 position-relative overflow-auto d-flex align-items-start justify-content-center p-2"
                style={{ minHeight: 0, background: '#525659' }}
            >
                {loading && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                        <span className="spinner-border text-light"></span>
                    </div>
                )}
                <div className="position-relative" style={{ display: 'inline-block' }}>
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        style={{
                            cursor: selectionMode ? 'crosshair' : 'default',
                            maxWidth: '100%',
                            height: 'auto',
                            display: 'block'
                        }}
                    />
                    <canvas
                        ref={overlayRef}
                        className="position-absolute top-0 start-0"
                        style={{
                            pointerEvents: 'none',
                            left: 0,
                            top: 0
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

export default PdfOcrViewer
