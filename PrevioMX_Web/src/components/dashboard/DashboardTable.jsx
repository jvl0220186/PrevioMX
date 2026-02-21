import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import '../../styles/main.css'
import SpecialBtn from '../common/SpecialBtn'

const DashboardTable = ({ data }) => {
  const navigate = useNavigate()
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' })
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingRow, setPendingRow] = useState(null)

  const proceedToCapture = (row) => {
    // Guardar datos del row en localStorage para usarlos en CaptureView
    localStorage.setItem('captureData', JSON.stringify({
      reference: row.reference,
      idCliente: row.idCliente || '',
      client: row.client,
      idProveedor: row.idProveedor || '',
      provider: row.provider,
      date: row.date,
      bundles: row.bundles,
      status: row.status,
      documentos: Array.isArray(row.documentos) ? row.documentos : []
    }))
    navigate(`/capture/${row.reference}`)
  }

  const handleCapturar = (row) => {
    // Verificar si el estatus es "Sin Documentos"
    if (row.status && row.status.toLowerCase() === 'sin documentos') {
      setPendingRow(row)
      setShowConfirmModal(true)
    } else {
      proceedToCapture(row)
    }
  }

  const handleConfirmCapture = () => {
    if (pendingRow) {
      proceedToCapture(pendingRow)
    }
    setShowConfirmModal(false)
    setPendingRow(null)
  }

  const handleCancelCapture = () => {
    setShowConfirmModal(false)
    setPendingRow(null)
  }

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data]
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [data, sortConfig])

  const requestSort = (key) => {
    let direction = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key) => {
    const isActive = sortConfig.key === key
    const isAsc = isActive && sortConfig.direction === 'ascending'
    const isDesc = isActive && sortConfig.direction === 'descending'

    return (
      <div className="d-inline-flex ms-2 align-items-center">
        <i
          className={`bi bi-arrow-down ${isDesc ? 'text-dark' : 'text-muted'}`}
          style={{ fontSize: '12px', opacity: isDesc ? 1 : 0.3, marginRight: '-2px' }}
        ></i>
        <i
          className={`bi bi-arrow-up ${isAsc ? 'text-dark' : 'text-muted'}`}
          style={{ fontSize: '12px', opacity: isAsc ? 1 : 0.3 }}
        ></i>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    return <span className="oc-primary-btn-2" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', borderRadius: '20px', display: 'inline-block' }}>{status}</span>
  }

  const renderCell = (content) => {
    if (typeof content !== 'string') return content
    if (content.length > 50) {
      return (
        <span title={content} style={{ cursor: 'help' }}>
          {content.substring(0, 50)}...
        </span>
      )
    }
    return content
  }

  const headers = [
    { key: 'reference', label: 'Número de Referencia' },
    { key: 'bodega', label: 'Bodega' },
    { key: 'client', label: 'Cliente' },
    { key: 'provider', label: 'Proveedor' },
    { key: 'tipoEnvio', label: 'Tipo Envío' },
    { key: 'date', label: 'Fecha de Llegada' },
    { key: 'bundles', label: 'Bultos' },
    { key: 'status', label: 'Estatus' },
    { key: 'ai', label: 'IA' },
    { key: 'action', label: 'Acción', sortable: false }
  ]

  return (
    <>
      <div className="dashboard-card h-100">
        <div className="table-responsive custom-scrollbar dashboard-table-container flex-grow-1" style={{ overflowY: 'auto' }}>
          <table className="table table-hover table-borderless align-middle dashboard-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                {headers.map((header) => (
                  <th
                    key={header.key}
                    scope="col"
                    onClick={() => header.sortable !== false && requestSort(header.key)}
                    style={{ cursor: header.sortable !== false ? 'pointer' : 'default' }}
                  >
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <span>{header.label}</span>
                      {header.sortable !== false && getSortIcon(header.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td className="fw-bold">{renderCell(row.reference)}</td>
                  <td>{renderCell(row.bodega || '-')}</td>
                  <td>{renderCell(row.client)}</td>
                  <td>{renderCell(row.provider)}</td>
                  <td>{renderCell(row.tipoEnvio || '-')}</td>
                  <td>{renderCell(row.date)}</td>
                  <td>{renderCell(row.bundles.toString())}</td>
                  <td>{getStatusBadge(row.status)}</td>
                  <td>
                    {row.ai && (
                      <button className="btn btn-sm" style={{ background: '#E9E8E2', borderRadius: '8px', padding: '4px 8px' }}>
                        <i className="bi bi-robot text-primary"></i> IA
                      </button>
                    )}
                    {!row.ai && <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <SpecialBtn
                      className="text-nowrap"
                      onClick={() => handleCapturar(row)}
                      label="Iniciar Captura"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación para Sin Documentos */}
      {showConfirmModal && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={handleCancelCapture}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '1.5rem' }}></i>
                  Mercancía Sin Documentos
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCancelCapture}
                  style={{ cursor: 'pointer' }}
                ></button>
              </div>
              <div className="modal-body py-4">
                <p className="mb-0" style={{ fontSize: '1rem', color: '#555' }}>
                  La mercancía de la referencia <strong>{pendingRow?.reference}</strong> no cuenta con documentos adjuntos.
                </p>
                <p className="mt-2 mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                  ¿Desea continuar con la captura de todas formas?
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={handleCancelCapture}
                  style={{ borderRadius: '12px', padding: '8px 20px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <SpecialBtn
                  onClick={handleConfirmCapture}
                  label="Sí, Continuar"
                  iconLeft={<i className="bi bi-check-lg"></i>}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

DashboardTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    reference: PropTypes.string.isRequired,
    idCliente: PropTypes.string,
    client: PropTypes.string.isRequired,
    idProveedor: PropTypes.string,
    provider: PropTypes.string.isRequired,
    tipoEnvio: PropTypes.string,
    date: PropTypes.string.isRequired,
    bundles: PropTypes.number.isRequired,
    bodega: PropTypes.string,
    status: PropTypes.string.isRequired,
    documentos: PropTypes.arrayOf(PropTypes.shape({
      documento: PropTypes.string,
      rutaDocumento: PropTypes.string
    })),
    ai: PropTypes.bool
  })).isRequired
}

export default DashboardTable
