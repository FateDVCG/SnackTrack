import React, { useState } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import MenuManager from "./components/MenuManager";

// Create a context for currency
export const CurrencyContext = React.createContext({
  currency: "₱",
  setCurrency: () => {},
});

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    orderStatus: {
      new: "#ff4444", // Red for new orders
      accepted: "#ff8c00", // Orange for accepted
      finished: "#2196f3", // Blue for finished
      completed: "#4caf50", // Green for completed
      voided: "#757575", // Grey for voided
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.125)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(25, 118, 210, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.125)",
          borderRadius: 0,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "html, body": {
          margin: 0,
          padding: 0,
          height: "100%",
          width: "100%",
          backgroundColor: "#f0f2f5",
        },
        "#root": {
          height: "100%",
          width: "100%",
        },
      },
    },
  },
});

function App() {
  const [currency, setCurrency] = useState("₱");
  const [anchorEl, setAnchorEl] = useState(null);

  const handleCurrencyClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCurrencyClose = (newCurrency) => {
    if (newCurrency) {
      setCurrency(newCurrency);
    }
    setAnchorEl(null);
  };

  return (
    <Router>
      <CurrencyContext.Provider value={{ currency, setCurrency }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              width: "100%",
            }}
          >
            <AppBar position="static">
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  SnackTrack
                </Typography>
                <IconButton
                  color="inherit"
                  onClick={handleCurrencyClick}
                  sx={{ mr: 2 }}
                >
                  <AttachMoneyIcon />
                  <Typography variant="body1" sx={{ ml: 0.5 }}>
                    {currency}
                  </Typography>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => handleCurrencyClose()}
                >
                  <MenuItem onClick={() => handleCurrencyClose("₱")}>
                    PHP (₱)
                  </MenuItem>
                  <MenuItem onClick={() => handleCurrencyClose("$")}>
                    USD ($)
                  </MenuItem>
                </Menu>
                <Button color="inherit" component={Link} to="/">
                  Orders
                </Button>
                <Button color="inherit" component={Link} to="/menu">
                  Menu
                </Button>
                <Button color="inherit" component={Link} to="/analytics">
                  Analytics
                </Button>
              </Toolbar>
            </AppBar>

            <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/menu" element={<MenuManager />} />
                <Route path="/analytics" element={<Analytics />} />
              </Routes>
            </Box>
          </Box>
        </ThemeProvider>
      </CurrencyContext.Provider>
    </Router>
  );
}

export default App;
