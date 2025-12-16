import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import SpecialBtn from '../components/common/SpecialBtn'
import './CaptureView.css'
import AddPartidasForm from '../components/capture/AddPartidasForm'
import LoadingSpinner from '../components/common/LoadingSpinner'
import previoService from '../services/previo.service'

const CaptureView = () => {
    const { reference } = useParams()
    const navigate = useNavigate()
    const [showAddPartidas, setShowAddPartidas] = useState(false)

    const [documentInfo, setDocumentInfo] = useState({
        client: '',
        provider: '',
        date: ''
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [catalogs, setCatalogs] = useState({
        units: [],
        countries: []
    })

    useEffect(() => {
        const fetchCaptureData = async () => {
            try {
                setLoading(true)
                const detallePromise = previoService.getDetalleEntrada(reference)

                const unitsPromise = previoService.getCatalogo(1)
                const countriesPromise = previoService.getCatalogo(2)

                const [detalle, unitsRes, countriesRes] = await Promise.all([
                    detallePromise,
                    unitsPromise,
                    countriesPromise
                ])

                let dateStr = detalle.fechaEntrada
                try {
                    if (dateStr) {
                        const dateObj = new Date(dateStr)
                        dateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                    }
                } catch (e) {
                    console.error("Date parse error", e)
                }

                setDocumentInfo({
                    client: detalle.cliente || '',
                    provider: detalle.proveedor || '',
                    date: dateStr || ''
                })

                const units = Array.isArray(unitsRes) ? unitsRes : (unitsRes.items || [])
                const countries = Array.isArray(countriesRes) ? countriesRes : (countriesRes.items || [])

                const detalleItems = Array.isArray(detalle) ? detalle : (detalle.items || [])
                const uniqueBultos = [...new Set(detalleItems.map(item => item.idBulto).filter(id => id))]

                setCatalogs({
                    units: units,
                    countries: countries,
                    bultos: uniqueBultos
                })

            } catch (err) {
                console.error("Error loading capture data", err)
                setError("Error al cargar la información del previo.")
            } finally {
                setLoading(false)
            }
        }

        if (reference) {
            fetchCaptureData()
        }
    }, [reference])


    const handleBack = () => {
        navigate('/dashboard')
    }

    const handleFinalize = () => {
        console.log('Finalizar Captura')
        navigate('/dashboard')
    }

    const handleAddPartida = () => {
        setShowAddPartidas(true)
    }

    const handleCancelAdd = () => {
        setShowAddPartidas(false)
    }

    const handleSavePartida = (data) => {
        console.log('Saving partida:', data)
        setShowAddPartidas(false)
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <LoadingSpinner />
            </div>
        )
    }

    if (error) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
                <div className="alert alert-danger">{error}</div>
                <button className="btn btn-outline-primary mt-3" onClick={handleBack}>Volver al Dashboard</button>
            </div>
        )
    }

    return (
        <div className="capture-view">
            <Header
                title={reference}
                subtitle="Captura de Packing List"
                showBack={true}
                onBack={handleBack}
                actions={
                    <SpecialBtn onClick={handleFinalize} iconLeft={<i className="bi bi-check2"></i>} label="Finalizar Captura" />
                }
            />

            <div className="capture-container">
                <div className="pdf-section">
                    <iframe
                        src="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                        className="pdf-iframe"
                        title="PDF Viewer"
                    />
                </div>

                <div className="sidebar-section custom-scrollbar">
                    {showAddPartidas ? (
                        <AddPartidasForm
                            onCancel={handleCancelAdd}
                            onSave={handleSavePartida}
                            catalogUnidades={catalogs.units}
                            catalogPaises={catalogs.countries}
                            bultosAvailable={catalogs.bultos}
                        />
                    ) : (
                        <>
                            <div className="card oc-light-card document-info-card">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <i className="bi bi-file-text"></i>
                                    <h5 className="m-0 fw-bold" style={{ fontSize: '16px' }}>Información del Documento</h5>
                                </div>

                                <div className="info-row">
                                    <span className="info-label">Cliente:</span>
                                    <span className="info-value">{documentInfo.client}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Proveedor:</span>
                                    <span className="info-value">{documentInfo.provider}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Fecha del Documento:</span>
                                    <span className="info-value">{documentInfo.date}</span>
                                </div>
                            </div>

                            <div className="stats-row">
                                <div className="card oc-light-card stat-box">
                                    <span className="stat-number">0</span>
                                    <span className="stat-label">CAPTURADOS</span>
                                </div>
                                <div className="card oc-light-card stat-box">
                                    <span className="stat-number">0</span>
                                    <span className="stat-label">PENDIENTES</span>
                                </div>
                            </div>

                            <div className="products-header">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="bi bi-list"></i>
                                    <h5 className="products-title">Lineas de Productos ( 0 )</h5>
                                </div>
                                <SpecialBtn
                                    onClick={handleAddPartida}
                                    label="+ Agregar Partida"
                                />
                            </div>

                            <div className="card oc-light-card manual-capture-container">
                                <div className="manual-capture-icon">
                                    <i className="bi bi-pencil-square" style={{ color: '#E9E8E2', fontSize: '64px' }}></i>
                                </div>
                                <h3 className="manual-capture-title">Captura Manual Requerida</h3>
                                <p className="manual-capture-text">
                                    Este documento no fue procesado con IA. Debe capturar las partidas manualmente desde el documento PDF.
                                </p>
                                <SpecialBtn
                                    onClick={handleAddPartida}
                                    label="+ Agregar Primera Partida"
                                />
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    )
}

export default CaptureView
