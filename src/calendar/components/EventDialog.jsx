import React, {useContext, useEffect, useState} from "react";
import {Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, TextField} from "@mui/material";
import {DateTimeField} from "@mui/x-date-pickers";
import Button from "@mui/material/Button";
import LoadingButton from '@mui/lab/LoadingButton';
import CalendarContext from "../contexts/CalendarContext.jsx";
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';


async function deleteBooking(id) {
    try {
        await fetch(`/bookings/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (e) {
        return {error: e}
    }
}

async function cancelBooking(id) {
    try {
        await fetch(`/bookings/${id}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (e) {
        return {error: e}
    }
}
async function createBooking(body) {
    const endpoint = body.id ? `/bookings/${body.id}` : '/bookings'
    try {
        await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (e) {
        return {error: e}
    }
}

const defaultDialogText = {
    title: "",
    description: "",
    saveBtn: "",
    removeBtn: "",
}

const defaultLoading = {
    change: false,
    delete: false,
}

const defaultValidationMessages = {
    name: "",
    start: "",
    end: ""
}
const editDialogText = {
    title: "Update",
    description: "Update the event details below.",
    saveBtn: "Update",
    removeBtn: "",
}
const createDialogText = {
    title: "Create",
    description: "Create a new event below.",
    saveBtn: "Create",
}
const viewDialogText = {
    title: "View",
    description: "View the cancelled event details below.",
}

const EventDialog = () => {
    const context = useContext(CalendarContext)
    const [open, setOpen] = context.createEventDialog;
    const [selectedEvent, setSelectedEvent] = context.selectedEvent;
    const setLastUpdated = context.lastUpdated[1];

    const [loading, setLoading] = useState(defaultLoading)
    const [dialogText, setDialogText] = useState(defaultDialogText)
    const [validationMessages, setValidationMessages] = useState(defaultValidationMessages);

    useEffect(() => {
        if (selectedEvent.id) {
            if (selectedEvent.canceled) {
                setDialogText(viewDialogText)
            } else {
                setDialogText({
                    ...editDialogText,
                    removeBtn: selectedEvent.blocked ? "Delete" : "Cancel"
                })
            }
        } else {
            setDialogText(createDialogText)
        }
    }, [selectedEvent])


    const handleChange = {
        text: (event) => {
            const {name, value} = event.target;
            setSelectedEvent(prev => ({
                ...prev,
                [name]: value
            }));
        },
        checkbox: (event) => {
            const {name, checked} = event.target;
            setSelectedEvent(prev => ({
                ...prev,
                [name]: checked
            }))
        },
        start: (date) => {
            setSelectedEvent(prev => ({
                ...prev,
                start: date
            }));
        },
        end: (date) => {
            setSelectedEvent(prev => ({
                ...prev,
                end: date
            }));
        },
        errorMessage: (name, message) => {
            setValidationMessages(prev => ({
                ...prev,
                [name]: message
            }))
        }
    }

    const clearErrorMessages = () => {
        handleChange.errorMessage("name", "")
        handleChange.errorMessage("start", "")
        handleChange.errorMessage("end", "")
    }
    const validateInputs = () => {
        clearErrorMessages()
        const {name, start, end, blocked} = selectedEvent
        let hasError = false
        if ((!name || name === "") && !blocked) {
            handleChange.errorMessage("name", "Name is required")
            hasError = true
        }
        if (start === null || !start.isValid()) {
            handleChange.errorMessage("start", "Start date is required")
            hasError = true
        }
        if (end === null || !end.isValid()) {
            handleChange.errorMessage("end", "End date is required")
            hasError = true
        }
        if (start.isSame(end)) {
            handleChange.errorMessage("start", "Start date must be different than end date")
            handleChange.errorMessage("end", "End date must be different than start date")
            hasError = true
        }
        if (start.isAfter(end)) {
            handleChange.errorMessage("start", "Start date must be before end date")
            handleChange.errorMessage("end", "End date must be after start date")
            hasError = true
        }
        if (context.checkOverlapping(selectedEvent)) {
            handleChange.errorMessage("start", "Event overlaps with another event")
            handleChange.errorMessage("end", "Event overlaps with another event")
            hasError = true
        }
        return hasError
    }

    const closeDialog = () => {
        setOpen(false)
        setValidationMessages(defaultValidationMessages)
        setLoading(defaultLoading)
        setDialogText(defaultDialogText)
    }

    const handleClose = () => {
        if (loading.change || loading.delete) {
            return
        }
        closeDialog()
    }

    const handleDelete = async () => {
        setLoading({delete: true})
        let response;
        let action;
        if (selectedEvent.blocked) {
            response = await deleteBooking(selectedEvent.id)
            action = "deleting";
        } else {
            response = await cancelBooking(selectedEvent.id)
            action = "canceling"
        }
        if (response?.error) {
            alert(`An error occurred while ${action} the event`)
            console.error(response.error)
        }
        setLastUpdated(new Date())
        closeDialog()
    }

    const handleSubmit = async () => {
        const hasError = validateInputs()
        if (hasError) {
            return
        }
        setLoading({change: true})
        selectedEvent.start = selectedEvent.start.second(0).millisecond(0)
        selectedEvent.end = selectedEvent.end.second(0).millisecond(0)
        const response = await createBooking(selectedEvent)
        if (response?.error) {
            alert("An error occurred while creating the event")
            console.error(response.error)
        }
        setLastUpdated(new Date())
        closeDialog()
    }

    const showBlockedCheckbox = !selectedEvent.id
    const showNameInput = !selectedEvent.blocked
    const showRemoveButton = selectedEvent.id && !selectedEvent.canceled
    const showSaveButton = !selectedEvent.canceled
    const isDisabled = loading.change || loading.delete || selectedEvent.canceled
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{dialogText.title}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {dialogText.description}
                </DialogContentText>
                {
                    showNameInput &&
                    <TextField
                        disabled={isDisabled}
                        autoFocus
                        required={!selectedEvent.blocked}
                        margin="dense"
                        id="name"
                        name="name"
                        label="Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={selectedEvent.name}
                        onChange={handleChange.text}
                        error={validationMessages.name !== ""}
                        helperText={validationMessages.name}
                    />
                }
                <DateTimeField
                    disabled={isDisabled}
                    required
                    margin="dense"
                    id="start"
                    name="start"
                    label="Start Date"
                    fullWidth
                    variant="standard"
                    value={selectedEvent.start}
                    onChange={handleChange.start}
                    error={validationMessages.start !== ""}
                    helperText={validationMessages.start}
                />
                <DateTimeField
                    disabled={isDisabled}
                    required
                    margin="dense"
                    id="end"
                    name="end"
                    label="End Date"
                    fullWidth
                    variant="standard"
                    value={selectedEvent.end}
                    onChange={handleChange.end}
                    error={validationMessages.end !== ""}
                    helperText={validationMessages.end}
                />
                {
                    showBlockedCheckbox &&
                    <FormControlLabel
                        control={
                            <Checkbox
                                margin="dense"
                                id="blocked"
                                name="blocked"
                                variant="standard"
                                value={selectedEvent.blocked}
                                onChange={handleChange.checkbox}
                            />
                        }
                        label="Block Bookings"
                        variant="standard"
                    />
                }
            </DialogContent>
            <DialogActions>
                {showRemoveButton &&
                    <LoadingButton
                        loading={loading.delete}
                        disabled={loading.change}
                        startIcon={<DeleteIcon/>}
                        color="error"
                        onClick={() => handleDelete()}
                        style={{marginRight: "auto"}}
                    >
                        {dialogText.removeBtn}
                    </LoadingButton>
                }
                <Button
                    disabled={loading.change || loading.delete}
                    onClick={handleClose}
                >
                    Close
                </Button>
                {showSaveButton &&
                    <LoadingButton
                        loading={loading.change}
                        disabled={loading.delete}
                        startIcon={<SaveIcon/>}
                        type="submit" onClick={() => handleSubmit()}>
                        {dialogText.saveBtn}
                    </LoadingButton>
                }
            </DialogActions>
        </Dialog>
    );
}

export default EventDialog;
