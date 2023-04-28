import Calendar from "./calendar/components/Calendar.jsx";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import {Box, Container} from "@mui/material";
function App() {
  return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Container>
              <Box sx={{margin: "10px"}}>
                  <Calendar/>
              </Box>
          </Container>
    </LocalizationProvider>
  );
}

export default App;
