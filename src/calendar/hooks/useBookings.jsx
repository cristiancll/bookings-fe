import {useEffect, useState} from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc)
const useBookings = (lastUpdated) => {
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState()
    useEffect(() => {
        const fetchFunction = async () => {
            try {
                const res = await fetch("/bookings")
                const resData = await res.json()
                setData(resData)
            } catch (e) {
                setError(e)
            } finally {
                setIsLoading(false)
            }
        }
        fetchFunction().then()
    }, [lastUpdated])
    data.forEach((b) => {
        b.title = b.name
        if (b.blocked) {
            b.color = "#d00000"
        }
        if (b.canceled) {
            b.color = "#c5c5c5"
        }
        b.start = dayjs.utc(b.start).toDate()
        b.end = dayjs.utc(b.end).toDate()

    })
    return {data, isLoading, error}
}

export default useBookings;
