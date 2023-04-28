import React, {useState} from "react";
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import EventDialog from "./EventDialog.jsx";
import useBookings from "../hooks/useBookings.jsx";
import CalendarContext from "../contexts/CalendarContext.jsx";
import styled from "styled-components";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import PropTypes from "prop-types";

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)


const EventCard = styled.div`
  padding-top: 5px;
  padding-bottom: 5px;
  margin-left: 5px;
`;

function renderEventContent(info) {
    const event = info.event
    const isBlocked = event.extendedProps.blocked
    const isCanceled = event.extendedProps.canceled
    const title = isBlocked ? "BLOCKED" : event.title
    const start = dayjs(event.start).format("HH:mm")
    const end = dayjs(event.end).format("HH:mm")
    return (
        <EventCard>
            {isCanceled
                ? (<s>
                        <b>{title}</b>
                        <br/>
                        <i>{start} - {end}</i>
                    </s>
                )
                : (<>
                        <b>{title}</b>
                        <br/>
                        <i>{start} - {end}</i>
                    </>
                )
            }
        </EventCard>
    )
}

const defaultEvent = {
    id: null,
    name: "",
    start: null,
    end: null,
    blocked: false,
    canceled: false,
}

const Calendar = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(defaultEvent);
    const [lastUpdated, setLastUpdated] = useState(new Date())
    const bookings = useBookings(lastUpdated)
    if (bookings.isLoading) {
        return (<></>)
    }
    if (bookings.error) {
        alert(bookings.error)
        return (<></>)
    }

    const checkOverlapping = (event) => {
        const start = event.start
        const end = event.end
        return bookings.data.some((b) => {
            if (event.id === b.id) {
                return false
            }
            if (b.canceled) {
                return false
            }
            const s = b.start;
            const e = b.end;
            const startOverlap = start.isSameOrBefore(s) && end.isAfter(s);
            const endOverlap = start.isBefore(e) && end.isSameOrAfter(e);
            const innerOverlap = start.isSameOrAfter(s) && end.isSameOrBefore(e);
            const overOverlap = start.isBefore(s) && end.isAfter(e);
            return endOverlap || startOverlap || innerOverlap || overOverlap
        })
    }

    const context = {
        createEventDialog: [openDialog, setOpenDialog],
        selectedEvent: [selectedEvent, setSelectedEvent],
        lastUpdated: [lastUpdated, setLastUpdated],
        checkOverlapping: checkOverlapping,
    }


    const handleSelectDate = (selected) => {
        const start = dayjs(selected.start)
        const end = dayjs(start).add(1, 'hour')
        setSelectedEvent({
            ...defaultEvent,
            start,
            end
        })
        setOpenDialog(true)
    }

    const handleSelectEvent = (info) => {
        const event = info.event;
        setSelectedEvent({
            id: event.id,
            name: event.title,
            start: dayjs(event.start),
            end: dayjs(event.end),
            blocked: event.extendedProps.blocked,
            canceled: event.extendedProps.canceled,
        })
        setOpenDialog(true)
    }

    return (
        <CalendarContext.Provider value={context}>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                initialView='dayGridMonth'
                eventDisplay='block'
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                events={bookings.data}
                select={handleSelectDate}
                eventClick={handleSelectEvent}
                eventContent={renderEventContent}
            />
            <EventDialog/>
        </CalendarContext.Provider>
    )
}

export default Calendar;
