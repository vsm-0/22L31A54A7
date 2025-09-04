import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import InsightsIcon from "@mui/icons-material/Insights";
import BugReportIcon from "@mui/icons-material/BugReport";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { keyframes } from "@emotion/react";

const LoggingContext = createContext();

const LoggingProvider = ({ children }) => {
  const [logs, setLogs] = useState(() =>
    JSON.parse(localStorage.getItem("logs") || "[]")
  );

  const log = (level, message, data = {}) => {
    const entry = { timestamp: new Date().toISOString(), level, message, data };
    const updated = [...logs, entry];
    setLogs(updated);
    localStorage.setItem("logs", JSON.stringify(updated));
  };

  return (
    <LoggingContext.Provider value={{ logs, log }}>
      {children}
    </LoggingContext.Provider>
  );
};

const useLogger = () => useContext(LoggingContext);

const generateCode = () => Math.random().toString(36).substring(2, 8);

const floatAnim = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
  100% { transform: translateY(0px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ShortenerPage = () => {
  const [rows, setRows] = useState([{ url: "", validity: "", code: "" }]);
  const [results, setResults] = useState([]);
  const { log } = useLogger();

  const handleChange = (i, field, value) => {
    const copy = [...rows];
    copy[i][field] = value;
    setRows(copy);
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateCode = (code) => /^[a-zA-Z0-9_-]{3,24}$/.test(code);

  const handleSubmit = () => {
    const links = JSON.parse(localStorage.getItem("links") || "[]");
    const newResults = [];

    for (const r of rows) {
      if (!validateUrl(r.url)) {
        log("error", "Invalid URL", { url: r.url });
        continue;
      }
      let code = r.code || generateCode();
      while (links.some((l) => l.code === code)) {
        if (r.code) {
          log("error", "Shortcode collision", { code });
          code = null;
          break;
        }
        code = generateCode();
      }
      if (!code) continue;
      if (r.code && !validateCode(r.code)) {
        log("error", "Invalid shortcode format", { code: r.code });
        continue;
      }
      const validity = parseInt(r.validity) || 30;
      const createdAt = Date.now();
      const expiresAt = createdAt + validity * 60000;
      const entry = { url: r.url, code, createdAt, expiresAt, clicks: [] };
      links.push(entry);
      newResults.push(entry);
      log("info", "Short URL created", entry);
    }
    localStorage.setItem("links", JSON.stringify(links));
    setResults(newResults);
  };

  return (
    <Container
      sx={{ textAlign: "center", mt: 4, animation: `${fadeIn} 0.8s ease` }}
    >
      <Box sx={{ mb: 2, animation: `${floatAnim} 3s ease-in-out infinite` }}>
        <LinkIcon sx={{ fontSize: 70, color: "primary.main" }} />
      </Box>
      <Typography variant="h3" gutterBottom fontWeight="bold">
        URL Shortener
      </Typography>
      {rows.map((row, i) => (
        <Grid
          container
          spacing={2}
          key={i}
          sx={{ mb: 2, justifyContent: "center" }}
        >
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Long URL"
              value={row.url}
              onChange={(e) => handleChange(i, "url", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Validity (min)"
              value={row.validity}
              onChange={(e) => handleChange(i, "validity", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Custom Code"
              value={row.code}
              onChange={(e) => handleChange(i, "code", e.target.value)}
            />
          </Grid>
        </Grid>
      ))}
      {rows.length < 5 && (
        <Button
          onClick={() =>
            setRows([...rows, { url: "", validity: "", code: "" }])
          }
          variant="outlined"
          sx={{ mr: 2 }}
        >
          Add Row
        </Button>
      )}
      <Button variant="contained" onClick={handleSubmit}>
        Shorten
      </Button>
      <Grid
        container
        spacing={2}
        sx={{ mt: 3, justifyContent: "center", animation: `${fadeIn} 1s ease` }}
      >
        {results.map((r, i) => (
          <Grid item xs={12} md={5} key={i}>
            <Card
              sx={{
                transition: "0.3s",
                "&:hover": { transform: "scale(1.05)" },
              }}
            >
              <CardContent>
                <Typography>Original: {r.url}</Typography>
                <Typography>
                  Short:{" "}
                  <a href={`/${r.code}`} style={{ textDecoration: "none" }}>
                    {window.location.origin}/{r.code}
                  </a>
                </Typography>
                <Typography>
                  Expires: {new Date(r.expiresAt).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

const StatsPage = () => {
  const [links, setLinks] = useState([]);
  useEffect(() => {
    setLinks(JSON.parse(localStorage.getItem("links") || "[]"));
  }, []);

  const chartData = links.map((l, i) => ({
    name: l.code,
    clicks: l.clicks.length,
  }));

  return (
    <Container sx={{ textAlign: "center", mt: 4, animation: `${fadeIn} 0.8s` }}>
      <Box sx={{ mb: 2, animation: `${floatAnim} 3s ease-in-out infinite` }}>
        <InsightsIcon sx={{ fontSize: 70, color: "secondary.main" }} />
      </Box>
      <Typography variant="h3" gutterBottom fontWeight="bold">
        Statistics
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <LineChart
          width={500}
          height={300}
          data={chartData}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <Line type="monotone" dataKey="clicks" stroke="#1976d2" />
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
        </LineChart>
      </Box>
      {links.map((l, i) => (
        <Card
          key={i}
          sx={{
            mb: 2,
            animation: `${fadeIn} 1s ease`,
            transition: "0.3s",
            "&:hover": { transform: "scale(1.03)" },
          }}
        >
          <CardContent>
            <Typography>
              Short:{" "}
              <a href={`/${l.code}`} style={{ textDecoration: "none" }}>
                {window.location.origin}/{l.code}
              </a>
            </Typography>
            <Typography>
              Created: {new Date(l.createdAt).toLocaleString()}
            </Typography>
            <Typography>
              Expires: {new Date(l.expiresAt).toLocaleString()}
            </Typography>
            <Typography>Total Clicks: {l.clicks.length}</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Geo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {l.clicks.map((c, j) => (
                  <TableRow key={j}>
                    <TableCell>
                      {new Date(c.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{c.source}</TableCell>
                    <TableCell>{c.geo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </Container>
  );
};

const LogsPage = () => {
  const { logs } = useLogger();
  return (
    <Container sx={{ textAlign: "center", mt: 4, animation: `${fadeIn} 0.8s` }}>
      <Box sx={{ mb: 2, animation: `${floatAnim} 3s ease-in-out infinite` }}>
        <BugReportIcon sx={{ fontSize: 70, color: "error.main" }} />
      </Box>
      <Typography variant="h3" gutterBottom fontWeight="bold">
        Logs
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Level</TableCell>
            <TableCell>Message</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log, i) => (
            <TableRow key={i}>
              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
              <TableCell>{log.level}</TableCell>
              <TableCell>{log.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
};

const RedirectHandler = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { log } = useLogger();

  useEffect(() => {
    const links = JSON.parse(localStorage.getItem("links") || "[]");
    const link = links.find((l) => l.code === code);
    if (!link) {
      log("error", "Shortcode not found", { code });
      navigate("/");
      return;
    }
    if (Date.now() > link.expiresAt) {
      log("error", "Link expired", { code });
      navigate("/");
      return;
    }
    const click = {
      timestamp: Date.now(),
      source: document.referrer || "direct",
      geo:
        Intl.DateTimeFormat().resolvedOptions().timeZone +
        " | " +
        navigator.language,
    };
    link.clicks.push(click);
    localStorage.setItem("links", JSON.stringify(links));
    log("info", "Redirected", { code, url: link.url });
    window.location.href = link.url;
  }, [code, navigate, log]);

  return <Typography align="center">Redirecting...</Typography>;
};

const App = () => {
  const [tab, setTab] = useState(0);
  return (
    <LoggingProvider>
      <Router>
        <AppBar position="static">
          <Toolbar sx={{ justifyContent: "center" }}>
            <Tabs
              value={tab}
              onChange={(e, v) => setTab(v)}
              textColor="inherit"
              indicatorColor="secondary"
            >
              <Tab label="Shortener" component={Link} to="/" />
              <Tab label="Statistics" component={Link} to="/stats" />
              <Tab label="Logs" component={Link} to="/logs" />
            </Tabs>
          </Toolbar>
        </AppBar>
        <Routes>
          <Route path="/" element={<ShortenerPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path=":code" element={<RedirectHandler />} />
        </Routes>
      </Router>
    </LoggingProvider>
  );
};

export default App;
