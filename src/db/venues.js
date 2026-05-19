import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '../firebase'

const venuesCol = collection(db, 'venues')

async function checkAdmin() {
    const user = getAuth().currentUser
    if (!user) throw new Error('Not authenticated')

    const snap = await getDoc(doc(db, 'users', user.uid))
    if (!snap.exists() || !snap.data().isAdmin) throw new Error('Admin access required')

    return user
}

/**
 * addVenue(venueData)
 * Creates a new venue document in the venues collection.
 * Only admins can call this function.
 *
 * venueData - {
 *   name: string,
 *   address: string,
 *   image: string,
 *   accessTags: string[],
 *   accessCategories: [{ title, rating, items: [{ label, available }] }]
 * }
 */
export async function addVenue(venueData) {
    await checkAdmin()
    const { name, address } = venueData
    if (!name || !address) throw new Error('name and address are required')

    const docRef = await addDoc(venuesCol, {
        name, address,
        image: venueData.image ?? '',
        accessTags: venueData.accessTags ?? [],
        accessCategories: venueData.accessCategories ?? [],
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
    })

    return { id: docRef.id, ...venueData }
}

/**
 * getVenue(venueId)
 * Retrieves a single venue by its Firestore document ID.
 *
 * venueId - Firestore document ID of the venue
 */
export async function getVenue(venueId) {
    if (!venueId) throw new Error('venueId is required')
    const snap = await getDoc(doc(db, 'venues', venueId))
    if (!snap.exists()) throw new Error(`Venue ${venueId} not found`)
    return { ...snap.data(), id: snap.id }
}

/**
 * getVenues(filters)
 * Retrieves a list of venues matching the given filters.
 *
 * filters - {
 *   q: string,      // name search query (case-insensitive)
 *   tags: string[]  // venue must include ALL of these access tags
 * }
 */
export async function getVenues(filters = {}) {
    const { q, tags } = filters

    let q_ref = query(venuesCol)
    if (tags && tags.length === 1) {
        q_ref = query(venuesCol, where('accessTags', 'array-contains', tags[0]))
    }

    let venues = (await getDocs(q_ref)).docs.map((d) => ({ ...d.data(), id: d.id }))

    if (q) {
        const lq = q.toLowerCase()
        venues = venues.filter((v) =>
            v.name.toLowerCase().includes(lq) ||
            v.searchTags?.some((tag) => tag.toLowerCase().includes(lq))
        )
    }
    if (tags?.length > 1) {
        venues = venues.filter((v) => tags.every((tag) => (v.accessTags ?? []).map((t) => t.toLowerCase()).includes(tag.toLowerCase())))
    }

    return venues
}

/**
 * updateVenue(venueId, venueData)
 * Updates a venue document with the given fields.
 * Only admins can call this function.
 *
 * venueId   - Firestore document ID of the venue
 * venueData - any subset of venue fields to update
 */
export async function updateVenue(venueId, venueData) {
    if (!venueId) throw new Error('venueId is required')
    await checkAdmin()
    await updateDoc(doc(db, 'venues', venueId), { ...venueData, updatedAt: serverTimestamp() })
    return { id: venueId, ...venueData }
}

/**
 * deleteVenue(venueId)
 * Deletes a venue document from the venues collection.
 * Only admins can call this function.
 *
 * venueId - Firestore document ID of the venue to delete
 */
export async function deleteVenue(venueId) {
    if (!venueId) throw new Error('venueId is required')
    await checkAdmin()
    await deleteDoc(doc(db, 'venues', venueId))
    return { id: venueId, deleted: true }
}