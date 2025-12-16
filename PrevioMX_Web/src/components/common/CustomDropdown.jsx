import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import '../../styles/oc-components.css'

const CustomDropdown = ({
    options = [],
    label = 'Seleccionar',
    searchPlaceholder = 'Buscar',
    onSelect,
    initialSelection
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [menuStyle, setMenuStyle] = useState({})
    const [selectedItems, setSelectedItems] = useState(initialSelection || options)
    const buttonRef = useRef(null)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !event.target.closest('.custom-dropdown-menu-portal')
            ) {
                setIsOpen(false)
            }
        }

        const handleScroll = (event) => {
            if (event.target.closest && event.target.closest('.custom-dropdown-menu-portal')) {
                return
            }
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

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const isAllSelected = options.length > 0 && selectedItems.length === options.length

    const handleSelect = (option) => {
        let newSelected = []

        if (option === 'ALL') {
            if (isAllSelected) {
                newSelected = []
            } else {
                newSelected = [...options]
            }
        } else {
            if (selectedItems.includes(option)) {
                newSelected = selectedItems.filter(item => item !== option)
            } else {
                newSelected = [...selectedItems, option]
            }
        }

        setSelectedItems(newSelected)

        if (onSelect) {
            onSelect(newSelected)
        }
    }

    const toggleDropdown = () => {
        if (!isOpen) {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect()
                const viewportHeight = window.innerHeight
                const spaceBelow = viewportHeight - rect.bottom
                const spaceAbove = rect.top
                const minHeight = 200

                let top, maxHeight

                if (spaceBelow >= minHeight || spaceBelow > spaceAbove) {
                    top = rect.bottom + window.scrollY + 4
                    maxHeight = spaceBelow - 20
                } else {
                    maxHeight = spaceAbove - 20
                    top = rect.top + window.scrollY - maxHeight - 4
                }

                setMenuStyle({
                    position: 'absolute',
                    top: `${top}px`,
                    left: `${rect.left + window.scrollX}px`,
                    width: `${rect.width}px`,
                    maxHeight: `${maxHeight}px`,
                    zIndex: 10500
                })
            }
        }
        setIsOpen(!isOpen)
    }

    const getButtonLabel = () => {
        if (selectedItems.length === 0) return label
        if (selectedItems.length > 3) return `+${selectedItems.length} opciones seleccionadas`
        return selectedItems.join(', ')
    }

    return (
        <div ref={dropdownRef} className="dropdown position-relative" style={{ width: '300px' }}>
            <button
                ref={buttonRef}
                className={`btn btn-white border d-flex align-items-center justify-content-between bg-white w-100 ${isOpen ? 'custom-dropdown-active' : ''}`}
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    toggleDropdown()
                }}
                aria-expanded={isOpen}
                style={{ borderRadius: '20px', height: '40px' }}
            >
                <span className="text-truncate" style={{ maxWidth: 'calc(100% - 20px)' }}>
                    {getButtonLabel()}
                </span>
                <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </button>

            {isOpen && createPortal(
                <div
                    className="custom-dropdown-menu-portal custom-dropdown-menu absolute bg-white mt-1 shadow-sm rounded-3 overflow-hidden d-flex flex-column"
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
                            autoFocus
                            style={{ borderRadius: '8px' }}
                        />
                    </div>
                    <div className="custom-dropdown-list custom-scrollbar overflow-y-auto flex-grow-1" style={{ minHeight: 0, overscrollBehavior: 'contain' }}>
                        <div
                            className="custom-dropdown-item d-flex align-items-center gap-2 px-3 py-2 cursor-pointer hover-bg-light"
                            onClick={() => handleSelect('ALL')}
                            style={{ cursor: 'pointer' }}
                        >
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={() => { }}
                                className="form-check-input mt-0 flex-shrink-0"
                                style={{ width: '18px', height: '18px' }}
                            />
                            <span className="fw-bold">Seleccionar todo</span>
                        </div>

                        {filteredOptions.map((option, index) => (
                            <div
                                key={index}
                                className="custom-dropdown-item d-flex align-items-center gap-2 px-3 py-2 cursor-pointer hover-bg-light"
                                onClick={() => handleSelect(option)}
                                style={{ cursor: 'pointer' }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(option)}
                                    onChange={() => { }}
                                    className="form-check-input mt-0 flex-shrink-0"
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span className="text-truncate">{option}</span>
                            </div>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div className="p-3 text-muted text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>No se encontraron resultados</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

export default CustomDropdown
