/** This component is the review form. It consists of two pages, the quick review
 * and the advanced review that the user can toggle between
*/
import { useEffect, useRef, useState } from 'react'
import Footer from './Footer'
import Header from './Header'
import { advancedReviewSections } from '../data/reviewFormData'
import './ReviewForm.css'
import { useParams } from 'react-router-dom'
import { addReview, getProfile } from '../db'
import { auth } from '../firebase'
import { Calendar } from 'lucide-react'

const navItems = [
    { label: 'Explore', href: '#' },
    { label: 'About', href: '#' },
    { label: 'Request', href: '#' },
]

const ratingLabels = ['Bad', 'Poor', 'Average', 'Good', 'Great']
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const calDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function CalendarDatePicker({ day, month, year, onDateSelect }) {
    const today = new Date()
    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)

    const daysInMonth = (y, m) => new Date(y, m, 0).getDate()
    const firstDayOffset = (y, m) => {
        const d = new Date(y, m - 1, 1).getDay()
        return d === 0 ? 6 : d - 1
    }

    const offset = firstDayOffset(viewYear, viewMonth)
    const totalDays = daysInMonth(viewYear, viewMonth)
    const prevDays = daysInMonth(viewYear, viewMonth === 1 ? 12 : viewMonth - 1)

    const cells = []
    for (let i = 0; i < offset; i++) cells.push({ d: prevDays - offset + 1 + i, curr: false })
    for (let d = 1; d <= totalDays; d++) cells.push({ d, curr: true })
    const tail = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7)
    for (let i = 1; i <= tail; i++) cells.push({ d: i, curr: false })

    const selD = parseInt(day), selM = parseInt(month), selY = parseInt(year)
    const todayD = today.getDate(), todayM = today.getMonth() + 1, todayY = today.getFullYear()

    const isSelected = (d) => d === selD && viewMonth === selM && viewYear === selY
    const isToday = (d) => d === todayD && viewMonth === todayM && viewYear === todayY

    const select = (d) => onDateSelect(String(d), String(viewMonth), String(viewYear))

    const goYesterday = () => {
        const t = new Date(); t.setDate(t.getDate() - 1)
        setViewYear(t.getFullYear()); setViewMonth(t.getMonth() + 1)
        onDateSelect(String(t.getDate()), String(t.getMonth() + 1), String(t.getFullYear()))
    }
    const goToday = () => {
        setViewYear(todayY); setViewMonth(todayM)
        onDateSelect(String(todayD), String(todayM), String(todayY))
    }
    const prevM = () => viewMonth === 1 ? (setViewMonth(12), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)
    const nextM = () => viewMonth === 12 ? (setViewMonth(1), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)

    return (
        <div className="cal-picker">
            <div className="cal-picker__header">
                <button type="button" className="cal-picker__nav" onClick={prevM}>‹</button>
                <span className="cal-picker__month-label">{monthNames[viewMonth - 1]}</span>
                <button type="button" className="cal-picker__nav" onClick={nextM}>›</button>
            </div>
            <div className="cal-picker__grid">
                {calDayNames.map((n) => <span key={n} className="cal-picker__day-name">{n}</span>)}
                {cells.map((cell, i) => (
                    <button
                        key={i}
                        type="button"
                        className={[
                            'cal-picker__day',
                            !cell.curr ? 'cal-picker__day--other' : '',
                            cell.curr && isSelected(cell.d) ? 'cal-picker__day--selected' : '',
                            cell.curr && isToday(cell.d) && !isSelected(cell.d) ? 'cal-picker__day--today' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => cell.curr && select(cell.d)}
                    >
                        {cell.d}
                    </button>
                ))}
            </div>
            <div className="cal-picker__shortcuts">
                <button type="button" className="cal-picker__shortcut" onClick={goYesterday}>Yesterday</button>
                <button type="button" className="cal-picker__shortcut" onClick={goToday}>Today</button>
            </div>
        </div>
    )
}

const initialQuickReview = {
    day: '',
    month: '',
    year: '',
    rating: 0,
    summary: '',
    accessNeeds: [],
}

function createInitialAdvancedReview() {
    return advancedReviewSections.reduce((accumulator, section) => {
        accumulator[section.id] = {
            rating: 0,
            tags: [],
            summary: '',
        }

        return accumulator
    }, {})
}

function RatingRow({ labels = ratingLabels, value = 0, onChange, idPrefix = 'rating' }) {
    return (
        <div className="review-form__rating-row">
            {labels.map((label, index) => {
                const selectedValue = index + 1
                const isSelected = selectedValue <= value

                return (
                    <button
                        className={`review-form__rating-item review-form__rating-button${isSelected ? ' review-form__rating-button--active' : ''}`}
                        key={label}
                        id={`${idPrefix}-${selectedValue}`}
                        type="button"
                        aria-label={`${label} (${selectedValue} star${selectedValue > 1 ? 's' : ''})`}
                        aria-pressed={value === selectedValue}
                        onClick={() => onChange(selectedValue)}
                    >
                        <span className="review-form__star">★</span>
                        <span>{label}</span>
                    </button>
                )
            })}
        </div>
    )
}

function TagList({ items, selectedItems = [], onToggleItem, compact = false }) {
    return (
        <div className={`review-form__tag-list${compact ? ' review-form__tag-list--compact' : ''}`}>
            {items.map((item) => {
                const isSelected = selectedItems.includes(item)

                return (
                    <button
                        className={`review-form__tag ui-chip${isSelected ? ' review-form__tag--active' : ''}`}
                        key={item}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onToggleItem(item)}
                    >
                        <span>{item}</span>
                        <span aria-hidden="true">{isSelected ? '−' : '+'}</span>
                    </button>
                )
            })}
        </div>
    )
}

// Code for the accordion sections in the advanced review page
// Each section has a rating, a list of tags, and a summary text area.
function AccordionSection({ section, isOpen, onToggle, sectionValue, onSectionChange }) {
    const toggleSectionTag = (tagItem) => {
        const currentTags = sectionValue.tags
        const updatedTags = currentTags.includes(tagItem)
            ? currentTags.filter((existingTag) => existingTag !== tagItem)
            : [...currentTags, tagItem]

        onSectionChange(section.id, {
            ...sectionValue,
            tags: updatedTags,
        })
    }

    return (
        <section className="review-form__accordion-section">
            <button
                className="review-form__accordion-toggle"
                type="button"
                aria-expanded={isOpen}
                onClick={() => onToggle(section.id)}
            >
                <span className="review-form__label">{section.title}</span>
                <span className={`review-form__chevron${isOpen ? ' review-form__chevron--open' : ''}`} aria-hidden="true">
                    ⌄
                </span>
            </button>

            {isOpen ? (
                <div className="review-form__accordion-panel">
                    <p className="review-form__label">{section.ratingPrompt}</p>
                    <RatingRow
                        value={sectionValue.rating}
                        onChange={(nextRating) =>
                            onSectionChange(section.id, {
                                ...sectionValue,
                                rating: nextRating,
                            })
                        }
                        idPrefix={`advanced-rating-${section.id}`}
                    />

                    <div className="review-form__section-block">
                        <h4 className="review-form__label">This venue has...</h4>
                        <TagList
                            items={section.tags}
                            selectedItems={sectionValue.tags}
                            onToggleItem={toggleSectionTag}
                            compact
                        />
                    </div>

                    <div className="review-form__section-block review-form__section-block--summary">
                        <h4 className="review-form__label">Summarize your experience</h4>
                        <p className="review-form__hint">{section.summaryPrompt}</p>
                        <textarea
                            className="review-form__textarea review-form__textarea--large"
                            placeholder="Write about your experience here..."
                            value={sectionValue.summary}
                            onChange={(event) =>
                                onSectionChange(section.id, {
                                    ...sectionValue,
                                    summary: event.target.value,
                                })
                            }
                        />
                    </div>
                </div>
            ) : null}
        </section>
    )
}

function formatReviewDate(day, month, year) {
    const monthNumber = Number(month)
    const monthName = monthNames[monthNumber - 1]

    if (!monthName) {
        return `${month}/${day}/${year}`
    }

    return `${monthName} ${Number(day)}, ${year}`
}

function validateQuickReview(quickReview) {
    const errors = {}

    if (!quickReview.day || !quickReview.month || !quickReview.year) {
        errors.date = 'Please enter a visit date.'
    }

    if (!quickReview.rating) {
        errors.rating = 'Please choose an overall rating.'
    }

    if (!quickReview.summary.trim()) {
        errors.summary = 'Please add a summary before submitting.'
    }

    return errors
}

function ReviewForm({ isOpen, onClose, onSubmitted }) {
    const { venueId } = useParams()
    const [currentStep, setCurrentStep] = useState(1)
    const [openSections, setOpenSections] = useState({})
    const [quickReview, setQuickReview] = useState(initialQuickReview)
    const [advancedReview, setAdvancedReview] = useState(createInitialAdvancedReview)
    const [formErrors, setFormErrors] = useState({})
    const [calOpen, setCalOpen] = useState(false)
    const [showCancel, setShowCancel] = useState(false)
    const [photoFiles, setPhotoFiles] = useState([])
    const calRef = useRef(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (!calOpen) return
        const handler = (e) => {
            if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [calOpen])

    // if the form is closed do nothing, else reset form back to default state
    // default state is page 1 with all advanced sections closed
    useEffect(() => {
        if (!isOpen) {
            return
        }

        setCurrentStep(1)
        setOpenSections({})
        setAdvancedReview(createInitialAdvancedReview())
        setFormErrors({})
        setShowCancel(false)
        setPhotoFiles([])

        const currentUser = auth.currentUser
        if (currentUser) {
            getProfile(currentUser.uid)
                .then((profileData) => {
                    setQuickReview({
                        ...initialQuickReview,
                        accessNeeds: profileData?.accessibilityPreferences ?? [],
                    })
                })
                .catch(() => setQuickReview(initialQuickReview))
        } else {
            setQuickReview(initialQuickReview)
        }
    }, [isOpen])

    if (!isOpen) {
        return null
    }

    // opens and closes the accordion sections
    const toggleSection = (sectionId) => {
        setOpenSections((current) => ({
            ...current,
            [sectionId]: !current[sectionId],
        }))
    }

    const updateAdvancedSection = (sectionId, updatedSectionData) => {
        setAdvancedReview((currentReview) => ({
            ...currentReview,
            [sectionId]: updatedSectionData,
        }))
    }

    const goToAdditionalDetails = () => {
        const validationErrors = validateQuickReview(quickReview)

        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors)
            return
        }

        setFormErrors({})
        setCurrentStep(2)
    }

    const handleSubmit = async () => {
        const validationErrors = validateQuickReview(quickReview)

        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors)
            setCurrentStep(1)
            return
        }

        const user = auth.currentUser
        if (!user) {
            setFormErrors({ submit: 'You must be signed in to submit a review.' })
            return
        }

        try {
            const advancedSections = advancedReviewSections
                .map((s) => ({ sectionId: s.id, ...advancedReview[s.id] }))
                .filter((s) => s.rating > 0 || s.tags.length > 0 || s.summary.trim().length > 0)

            const compressImage = (file) => new Promise((resolve) => {
                const img = new Image()
                const url = URL.createObjectURL(file)
                img.onload = () => {
                    const maxW = 600
                    const scale = Math.min(1, maxW / img.width)
                    const canvas = document.createElement('canvas')
                    canvas.width = img.width * scale
                    canvas.height = img.height * scale
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
                    URL.revokeObjectURL(url)
                    resolve(canvas.toDataURL('image/jpeg', 0.6))
                }
                img.src = url
            })

            const photoURLs = await Promise.all(photoFiles.map(compressImage))

            await addReview(user.uid, venueId, {
                dateOfVisit: { day: quickReview.day, month: quickReview.month, year: quickReview.year },
                overallRating: quickReview.rating,
                summary: quickReview.summary,
                accessNeeds: quickReview.accessNeeds,
                authorName: user.displayName ?? user.email ?? 'Anonymous',
                photos: photoURLs,
                advancedSections,
            })

            if (onSubmitted) await onSubmitted()
            onClose()
        } catch (err) {
            console.error(err)
            setFormErrors({ submit: 'Something went wrong. Please try again.' })
        }
    }

    if (showCancel) {
        return (
            <div className="review-form-overlay" role="dialog" aria-modal="true" aria-label="Cancel review">
                <div className="review-form-shell">
                    <Header navItems={navItems} />
                    <main className="review-form ui-container--wide">
                        <div className="review-form__cancel-page">
                            <h2 className="review-form__cancel-heading">Discard this review?</h2>
                            <p className="review-form__cancel-body">
                                Your progress will be lost. Are you sure you want to cancel?
                            </p>
                            <div className="review-form__cancel-actions">
                                <button
                                    className="review-form__button review-form__button--ghost ui-pill-button ui-pill-button--ghost"
                                    type="button"
                                    onClick={() => setShowCancel(false)}
                                >
                                    Keep Writing
                                </button>
                                <button
                                    className="review-form__button review-form__button--danger ui-pill-button"
                                    type="button"
                                    onClick={onClose}
                                >
                                    Discard Review
                                </button>
                            </div>
                        </div>
                    </main>
                    <Footer />
                </div>
            </div>
        )
    }

    return (
        <div className="review-form-overlay" role="dialog" aria-modal="true" aria-label="Write a review">
            <div className="review-form-shell">
                <Header navItems={navItems} />

                <main className="review-form ui-container--wide">
                    <div className="review-form__progress" aria-label="Review progress">
                        <div className="review-form__progress-step">
                            <div className="review-form__progress-bar review-form__progress-bar--active" />
                            <p>1 of 2 Quick Review (required)</p>
                        </div>

                        <div className="review-form__progress-step">
                            <div
                                className={`review-form__progress-bar${currentStep === 2 ? ' review-form__progress-bar--active' : ''}`}
                            />
                            <p>2 of 2 Additional Details (optional)</p>
                        </div>
                    </div>

                    <h1 className="ui-heading-page">Write A Review</h1>

                    {formErrors.submit && (
                        <p className="review-form__error" role="alert">{formErrors.submit}</p>
                    )}

                    {currentStep === 1 ? (
                        <section className="review-form__page review-form__page--intro">
                            <div className="review-form__column review-form__column--left">
                                <div className="review-form__field-group">
                                    <label className="review-form__label">Date of Visit*</label>
                                    <div className="review-form__date-wrap" ref={calRef}>
                                        <div className="review-form__date-row">
                                            <div className="review-form__date-grid">
                                                <input
                                                    className="review-form__input"
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="MM"
                                                    value={quickReview.month}
                                                    onChange={(e) => setQuickReview((c) => ({ ...c, month: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                                                    onFocus={() => setCalOpen(true)}
                                                />
                                                <input
                                                    className="review-form__input"
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="DD"
                                                    value={quickReview.day}
                                                    onChange={(e) => setQuickReview((c) => ({ ...c, day: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                                                    onFocus={() => setCalOpen(true)}
                                                />
                                                <input
                                                    className="review-form__input"
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="YYYY"
                                                    value={quickReview.year}
                                                    onChange={(e) => setQuickReview((c) => ({ ...c, year: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                                    onFocus={() => setCalOpen(true)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="review-form__cal-btn"
                                                onClick={() => setCalOpen((v) => !v)}
                                                aria-label="Toggle calendar"
                                            >
                                                <Calendar size={16} strokeWidth={1.8} />
                                            </button>
                                        </div>
                                        {calOpen && (
                                            <div className="cal-picker-popout">
                                                <CalendarDatePicker
                                                    day={quickReview.day}
                                                    month={quickReview.month}
                                                    year={quickReview.year}
                                                    onDateSelect={(d, m, y) => {
                                                        setQuickReview((curr) => ({ ...curr, day: d, month: m, year: y }))
                                                        setCalOpen(false)
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.date ? <p className="review-form__error">{formErrors.date}</p> : null}
                                </div>

                                <div className="review-form__field-group">
                                    <p className="review-form__label">Rate Your Overall Experience*</p>
                                    <RatingRow
                                        value={quickReview.rating}
                                        onChange={(nextRating) => setQuickReview((current) => ({ ...current, rating: nextRating }))}
                                        idPrefix="quick-rating"
                                    />
                                    {formErrors.rating ? <p className="review-form__error">{formErrors.rating}</p> : null}
                                </div>

                                <div className="review-form__field-group">
                                    <label className="review-form__label" htmlFor="review-summary">
                                        Summarize Your Experience*
                                    </label>
                                    <p className="review-form__hint">
                                        What would you like others to know about this venue? What access features would you like to highlight?
                                    </p>
                                    <textarea
                                        className="review-form__textarea"
                                        id="review-summary"
                                        placeholder="Write about your experience here..."
                                        value={quickReview.summary}
                                        onChange={(event) => setQuickReview((current) => ({ ...current, summary: event.target.value }))}
                                    />
                                    {formErrors.summary ? <p className="review-form__error">{formErrors.summary}</p> : null}
                                </div>
                            </div>

                            <div className="review-form__column review-form__column--right">
                                <div className="review-form__field-group">
                                    <p className="review-form__label">Upload Relevant Photos (optional)</p>
                                    <div className="review-form__photo-section">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const incoming = Array.from(e.target.files)
                                                setPhotoFiles((prev) => {
                                                    const existing = new Set(prev.map((f) => f.name + f.size))
                                                    return [...prev, ...incoming.filter((f) => !existing.has(f.name + f.size))]
                                                })
                                                e.target.value = ''
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="review-form__upload-box"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <span className="review-form__upload-icon">⇪</span>
                                            <span>Select Photos From Device</span>
                                        </button>
                                        {photoFiles.length > 0 && (
                                            <div className="review-form__photo-previews">
                                                {photoFiles.map((file, i) => (
                                                    <div key={i} className="review-form__photo-thumb">
                                                        <img src={URL.createObjectURL(file)} alt={file.name} />
                                                        <button
                                                            type="button"
                                                            className="review-form__photo-remove"
                                                            onClick={() => setPhotoFiles((prev) => prev.filter((_, idx) => idx !== i))}
                                                            aria-label="Remove photo"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="review-form__actions review-form__actions--split">
                                    <button className="review-form__button review-form__button--cancel ui-pill-button" type="button" onClick={() => setShowCancel(true)}>
                                        Cancel
                                    </button>
                                    <button className="review-form__button review-form__button--ghost review-form__button--next ui-pill-button ui-pill-button--ghost" type="button" onClick={goToAdditionalDetails}>
                                        Next Page
                                    </button>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <section className="review-form__page review-form__page--advanced">
                            <div className="review-form__accordion-list">
                                {advancedReviewSections.map((section) => (
                                    <AccordionSection
                                        key={section.id}
                                        section={section}
                                        isOpen={Boolean(openSections[section.id])}
                                        onToggle={toggleSection}
                                        sectionValue={advancedReview[section.id]}
                                        onSectionChange={updateAdvancedSection}
                                    />
                                ))}
                            </div>

                            <div className="review-form__actions review-form__actions--split">
                                <button className="review-form__button review-form__button--ghost ui-pill-button ui-pill-button--ghost" type="button" onClick={() => setCurrentStep(1)}>
                                    Previous Page
                                </button>
                                <button className="review-form__button review-form__button--primary ui-pill-button ui-pill-button--primary" type="button" onClick={handleSubmit}>
                                    Submit All
                                </button>
                            </div>
                        </section>
                    )}
                </main>

                <Footer />
            </div>
        </div>
    )
}

export default ReviewForm