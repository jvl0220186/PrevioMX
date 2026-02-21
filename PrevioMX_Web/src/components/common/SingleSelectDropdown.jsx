import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import '../../styles/oc-components.css'

const SingleSelectDropdown = ({
    options = [],
    label = 'Seleccionar',
    searchPlaceholder = 'Buscar',
    onSelect,
    initialSelection = '',
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [menuStyle, setMenuStyle] = useState({})
    const [selectedItem, setSelectedItem] = useState(initialSelection)
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const buttonRef = useRef(null)
    const dropdownRef = useRef(null)
    const listRef = useRef(null)

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

    useEffect(() => {
        setSelectedItem(initialSelection)
    }, [initialSelection])

    // Reset highlighted index when opening or when filter/results change
    useEffect(() => {
        if (isOpen) setHighlightedIndex(0)
    }, [isOpen])

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    )

    useEffect(() => {
        setHighlightedIndex(prev => {
            const max = Math.max(0, filteredOptions.length - 1)
            return prev > max ? max : prev
        })
    }, [filteredOptions.length, searchTerm])

    const handleSelect = (option) => {
        setSelectedItem(option)
        if (onSelect) {
            onSelect(option)
        }
        setIsOpen(false)
        setSearchTerm('')
    }

    // Scroll highlighted item into view
    useEffect(() => {
        if (!isOpen || filteredOptions.length === 0 || !listRef.current) return
        const el = listRef.current.children[highlightedIndex]
        if (el?.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, [highlightedIndex, isOpen, filteredOptions.length])

    const handleKeyDown = (e) => {
        if (filteredOptions.length === 0) {
            if (e.key === 'Escape') {
                e.preventDefault()
                setIsOpen(false)
                setSearchTerm('')
            }
            return
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
            return
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
            return
        }
        if (e.key === 'Enter') {
            e.preventDefault()
            if (filteredOptions.length === 1) {
                handleSelect(filteredOptions[0])
            } else {
                handleSelect(filteredOptions[highlightedIndex])
            }
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

    return (
        <div ref={dropdownRef} className="dropdown position-relative w-100">
            <button
                ref={buttonRef}
                className={`btn btn-white border d-flex align-items-center justify-content-between w-100 ${isOpen ? 'custom-dropdown-active' : ''} ${disabled ? 'bg-light' : 'bg-white'}`}
                type="button"
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
                    {selectedItem || label}
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
                            onKeyDown={handleKeyDown}
                            autoFocus
                            style={{ borderRadius: '8px' }}
                            aria-label={searchPlaceholder}
                        />
                    </div>
                    <div ref={listRef} className="custom-dropdown-list custom-scrollbar overflow-y-auto flex-grow-1" style={{ minHeight: 0, overscrollBehavior: 'contain' }} role="listbox">
                        {filteredOptions.map((option, index) => (
                            <div
                                key={index}
                                role="option"
                                aria-selected={index === highlightedIndex}
                                className={`custom-dropdown-item d-flex align-items-center gap-2 px-3 py-2 cursor-pointer hover-bg-light ${selectedItem === option ? 'selected' : ''} ${index === highlightedIndex ? 'bg-light' : ''}`}
                                onClick={() => handleSelect(option)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                style={{ cursor: 'pointer', backgroundColor: index === highlightedIndex ? '#f0f7ff' : undefined }}
                            >
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

export default SingleSelectDropdown
