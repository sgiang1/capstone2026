// for testing purposes
import Header from "./components/Header"
import Footer from "./components/Footer"
import VenueCard from "./components/VenueCard"
import { Search } from "lucide-react"
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from "react"
import { getVenues } from './db'
import { getFilters, saveFilters } from "./utils/filterStorage"
import "./home.css"
import filterSectionsText from './data/filter-sections/access-filters.txt?raw'

const navItems = [
    { label: "Explore", href: "/explore" },
    { label: "About", href: "#" },
    { label: "Request", href: "#" },
]

const filterSections = filterSectionsText
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
        const [, first] = s.split('\n').map((l) => l.trim()).filter(Boolean)
        return first
    })

const filters = filterSections.flat().slice(0, 4)

export default function HomePage() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
    const [selectedFilters, setSelectedFilters] = useState(getFilters)

    const toggleFilter = (filter) => {
        setSelectedFilters((prev) => {
            const updated = prev.includes(filter)
                ? prev.filter((f) => f !== filter)
                : [...prev, filter]
            saveFilters(updated)
            return updated
        })
    }

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (query.trim()) params.set("q", query.trim())
        navigate(`/explore?${params.toString()}`)
    }

    const [venues, setVenues] = useState([])

    useEffect(() => {
        getVenues().then(setVenues)
    }, [])

    return (
        <div className="home-page">
            <Header navItems={navItems} />

            <div className="notice">
                <strong>Notice:</strong> This project is transitioning to open source. The source code will be publicly available effective <strong>May 27, 2026</strong>.
            </div>

            <section className="hero">
                <h1 className="hero__heading">
                    Find and share accessibility experiences
                </h1>

                <div className="hero__search-row">
                    <div className="search-bar">
                        <input
                            type="search"
                            placeholder="Search venues and categories..."
                            className="search-bar__input"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <Search size={18} className="search-bar__icon" onClick={handleSearch} style={{ cursor: "pointer" }} />
                    </div>

                    <button
                        className="view-all-filters-btn"
                        type="button"
                        onClick={() => {
                            setSearchParams(query.trim() ? { q: query.trim() } : {}, { replace: true })
                            navigate('/explore/filter')
                        }}
                    >
                        View All Filters
                    </button>
                </div>

                <div className="quick-filters">
                    {filters.map((f) => (
                        <button
                            key={f}
                            type="button"
                            className={`quick-filter-chip ${selectedFilters.includes(f) ? "quick-filter-chip--active" : ""}`}
                            onClick={() => toggleFilter(f)}
                        >
                            {f} {selectedFilters.includes(f) ? "✓" : "+"}
                        </button>
                    ))}
                </div>
            </section>

            <section className="popular-venues">
                <div className="popular-venues__inner">
                    <h2 className="popular-venues__title">Popular Venues</h2>

                    <div className="venue-grid">
                        {venues.map((venue) => (
                            <VenueCard
                                key={venue.id}
                                venue={venue}
                                onClick={() => navigate(`/venues/${venue.id}`)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}