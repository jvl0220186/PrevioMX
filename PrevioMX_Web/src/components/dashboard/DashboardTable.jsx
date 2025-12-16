import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import '../../styles/main.css'
import SpecialBtn from '../common/SpecialBtn'

const DashboardTable = ({ data }) => {
  const navigate = useNavigate()
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' })

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
    { key: 'client', label: 'Cliente' },
    { key: 'provider', label: 'Proveedor' },
    { key: 'date', label: 'Fecha de Llegada' },
    { key: 'bundles', label: 'Bultos' },
    { key: 'status', label: 'Estatus' },
    { key: 'ai', label: 'IA' },
    { key: 'action', label: 'Acción', sortable: false }
  ]

  return (
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
                <td>{renderCell(row.client)}</td>
                <td>{renderCell(row.provider)}</td>
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
                    onClick={() => navigate(`/capture/${row.reference}`)}
                    label="Iniciar Captura"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

DashboardTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    reference: PropTypes.string.isRequired,
    client: PropTypes.string.isRequired,
    provider: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    bundles: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    ai: PropTypes.bool
  })).isRequired
}

export default DashboardTable
