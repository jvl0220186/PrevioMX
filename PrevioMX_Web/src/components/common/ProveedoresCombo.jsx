import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import previoService from '../../services/previo.service'
import '../../styles/oc-components.css'

const DEBOUNCE_MS = 350
const DEFAULT_PAGE_SIZE = 20

const ProveedoresCombo = ({
    label = 'Seleccionar proveedor',
    searchPlaceholder = 'Buscar proveedor...',
    onSelect,
    initialSelection = null,
    initialFilter = '',
    disabled = false,
    pageSize = DEFAULT_PAGE_SIZE
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(0)
    const [more, setMore] = useState(false)
    const [selectedItem, setSelectedItem] = useState(initialSelection)
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const [menuStyle, setMenuStyle] = useState({})
    const buttonRef = useRef(null)
    const dropdownRef = useRef(null)
    const listRef = useRef(null)

    const fetchProveedores = useCallback(async (filtro, pageNumber, append = false) => {
        try {
            setLoading(true)
            const result = await previoService.getCatalogoProveedores({
                filtro: filtro || '',
                pageNumber,
                pageSize
            })
            const newItems = result?.items || []
            setMore(!!result?.more)
            setPage(pageNumber)
            setItems(prev => append ? [...prev, ...newItems] : newItems)
        } catch (err) {
            console.error('Error cargando catálogo de proveedores:', err)
            if (!append) setItems([])
            setMore(false)
        } finally {
            setLoading(false)
        }
    }, [pageSize])

    useEffect(() => {
        if (!isOpen) return
        const filtro = (searchTerm === '' && initialFilter) ? initialFilter : searchTerm
        const delay = searchTerm === '' ? 0 : DEBOUNCE_MS
        const id = setTimeout(() => fetchProveedores(filtro, 0, false), delay)
        return () => clearTimeout(id)
    }, [isOpen, searchTerm, initialFilter, fetchProveedores])

    useEffect(() => {
        setSelectedItem(initialSelection)
    }, [initialSelection])

    useEffect(() => {
        const max = Math.max(0, items.length - 1)
        setHighlightedIndex(prev => (prev > max ? max : prev))
    }, [items.length])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !event.target.closest('.proveedores-combo-portal')
            ) {
                setIsOpen(false)
            }
        }
        const handleScroll = (event) => {
            if (event.target.closest?.('.proveedores-combo-portal')) return
            if (isOpen) setIsOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('resize', handleScroll)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('scroll', handleScroll, true)
            window.removeEventListener('resize', handleScroll)
        }
    }, [isOpen])

    const handleLoadMore = () => {
        if (loading || !more) return
        const filtro = (searchTerm === '' && initialFilter) ? initialFilter : searchTerm
        fetchProveedores(filtro, page + 1, true)
    }

    const handleScrollList = (e) => {
        const el = e.target
        if (!el || !more || loading) return
        const { scrollTop, scrollHeight, clientHeight } = el
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            handleLoadMore()
        }
    }

    const handleSelect = (item) => {
        setSelectedItem(item)
        if (onSelect) onSelect(item)
        setIsOpen(false)
        setSearchTerm('')
    }

    useEffect(() => {
        if (!isOpen || items.length === 0 || !listRef.current) return
        const el = listRef.current.children[highlightedIndex]
        if (el?.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, [highlightedIndex, isOpen, items.length])

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0))
            return
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1))
            return
        }
        if (e.key === 'Enter' && items[highlightedIndex]) {
            e.preventDefault()
            handleSelect(items[highlightedIndex])
            return
        }
        if (e.key === 'Escape') {
            e.preventDefault()
            setIsOpen(false)
            setSearchTerm('')
        }
    }

    const toggleDropdown = () => {
        if (disabled) return
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            const viewportHeight = window.innerHeight
            const spaceBelow = viewportHeight - rect.bottom
            const spaceAbove = rect.top
            const minHeight = 200
            let top, maxHeight
            if (spaceBelow >= minHeight || spaceBelow > spaceAbove) {
                top = rect.bottom + window.scrollY + 4
                maxHeight = Math.min(320, spaceBelow - 20)
            } else {
                maxHeight = Math.min(320, spaceAbove - 20)
                top = rect.top + window.scrollY - maxHeight - 4
            }
            setMenuStyle({
                position: 'absolute',
                top: `${top}px`,
                left: `${rect.left + window.scrollX}px`,
                width: `${Math.max(rect.width, 280)}px`,
                maxHeight: `${maxHeight}px`,
                zIndex: 10500
            })
        }
        setIsOpen(!isOpen)
    }

    const displayLabel = selectedItem
        ? (typeof selectedItem === 'object' && selectedItem !== null
            ? (selectedItem.cText || selectedItem.cValue || '')
            : selectedItem)
        : label

    const isSelected = (item) => {
        if (!item) return false
        const itemValue = item.cValue ?? item
        const selValue = selectedItem?.cValue ?? selectedItem
        return String(itemValue) === String(selValue)
    }

    return (
        <div ref={dropdownRef} className="dropdown position-relative w-100">
            <button
                ref={buttonRef}
                type="button"
                className={`btn btn-white border d-flex align-items-center justify-content-between w-100 ${isOpen ? 'custom-dropdown-active' : ''} ${disabled ? 'bg-light' : 'bg-white'}`}
                onClick={(e) => {
                    e.stopPropagation()
                    toggleDropdown()
                }}
                aria-expanded={isOpen}
                disabled={disabled}
                style={{
                    borderRadius: '12px',
                    height: '45px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.7 : 1
                }}
            >
                <span className="text-truncate" style={{ maxWidth: 'calc(100% - 20px)' }}>
                    {displayLabel}
                </span>
                <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </button>

            {isOpen && createPortal(
                <div
                    className="proveedores-combo-portal custom-dropdown-menu absolute bg-white mt-1 shadow-sm rounded-3 overflow-hidden d-flex flex-column"
                    style={menuStyle}
                >
                    <div className="custom-dropdown-search p-2 border-bottom">
                        <input
                            type="text"
                            className="form-control form-control-sm border-0 bg-light"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            style={{ borderRadius: '8px' }}
                            aria-label={searchPlaceholder}
                        />
                    </div>
                    <div
                        ref={listRef}
                        className="custom-dropdown-list custom-scrollbar overflow-y-auto flex-grow-1"
                        style={{ minHeight: 0, overscrollBehavior: 'contain' }}
                        role="listbox"
                        onScroll={handleScrollList}
                    >
                        {loading && items.length === 0 ? (
                            <div className="p-3 text-muted text-center">
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Cargando...
                            </div>
                        ) : (
                            items.map((item, index) => (
                                <div
                                    key={item.cValue ?? index}
                                    role="option"
                                    aria-selected={index === highlightedIndex}
                                    className={`custom-dropdown-item d-flex align-items-center gap-2 px-3 py-2 cursor-pointer ${isSelected(item) ? 'selected' : ''} ${index === highlightedIndex ? 'bg-light' : ''}`}
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    style={{
                                        cursor: 'pointer',
                                        backgroundColor: index === highlightedIndex ? '#f0f7ff' : undefined
                                    }}
                                >
                                    <span className="text-truncate">
                                        {item.cText != null && item.cText !== '' ? item.cText : item.cValue}
                                    </span>
                                </div>
                            ))
                        )}
                        {items.length === 0 && !loading && (
                            <div className="p-3 text-muted text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                No se encontraron resultados
                            </div>
                        )}
                        {loading && items.length > 0 && (
                            <div className="p-2 text-center border-top">
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                <span className="text-muted small">Cargando más...</span>
                            </div>
                        )}
                        {!loading && more && items.length > 0 && (
                            <div
                                className="p-2 text-center border-top text-primary"
                                style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                                onClick={handleLoadMore}
                                onKeyDown={(e) => e.key === 'Enter' && handleLoadMore()}
                                role="button"
                                tabIndex={0}
                            >
                                Cargar más
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

export default ProveedoresCombo
