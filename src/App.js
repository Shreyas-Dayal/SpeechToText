import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  Fragment,
} from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import {
  Mic,
  MicOff,
  CopyAll,
  Check,
  LightMode,
  DarkMode,
  Clear,
  Download,
} from "@mui/icons-material";

/* ------------------------------------------------------------------
   THEMES
   - Increased base font sizes for a more prominent text display.
------------------------------------------------------------------- */
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
    },
    error: {
      main: "#ef4444",
    },
    background: {
      default: "#f3f4f6",
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 16, // Base font size
    h4: {
      fontSize: "2rem", // Larger heading
      fontWeight: 700,
    },
    body1: {
      fontSize: "1.125rem",
    },
    button: {
      textTransform: "none",
      fontSize: "1.125rem", // Larger button text
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3b82f6",
    },
    error: {
      main: "#f87171",
    },
    background: {
      default: "#1e293b",
      paper: "#2d3748",
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 16,
    h4: {
      fontSize: "2rem",
      fontWeight: 700,
    },
    body1: {
      fontSize: "1.125rem",
    },
    button: {
      textTransform: "none",
      fontSize: "1.125rem",
    },
  },
});

/* ------------------------------------------------------------------
   HEADER COMPONENT
   - Displays the title and a theme toggle button.
------------------------------------------------------------------- */
const AppHeader = memo(function AppHeader({ darkMode, onToggleDarkMode }) {
  return (
    <CardHeader
      title={
        <Typography variant="h4" fontWeight="bold">
          Speech to Text Converter
        </Typography>
      }
      action={
        <IconButton onClick={onToggleDarkMode} title="Toggle Theme">
          {darkMode ? <LightMode /> : <DarkMode />}
        </IconButton>
      }
    />
  );
});

/* ------------------------------------------------------------------
   LANGUAGE SELECTOR COMPONENT
   - Allows the user to pick a language for speech recognition.
------------------------------------------------------------------- */
const LanguageSelector = memo(function LanguageSelector({
  language,
  onChangeLanguage,
}) {
  return (
    <FormControl fullWidth>
      <InputLabel id="language-select-label">Language</InputLabel>
      <Select
        labelId="language-select-label"
        value={language}
        label="Language"
        onChange={(e) => onChangeLanguage(e.target.value)}
        sx={{ borderRadius: 2 }}
      >
        <MenuItem value="en-US">English (US)</MenuItem>
        <MenuItem value="en-GB">English (UK)</MenuItem>
        <MenuItem value="es-ES">Spanish (ES)</MenuItem>
        <MenuItem value="fr-FR">French (FR)</MenuItem>
        <MenuItem value="de-DE">German (DE)</MenuItem>
        {/* Add more languages as needed */}
      </Select>
    </FormControl>
  );
});

/* ------------------------------------------------------------------
   CONTROL BUTTONS COMPONENT
   - Start/Stop mic, Copy, Clear, Export
------------------------------------------------------------------- */
const ControlButtons = memo(function ControlButtons({
  isListening,
  text,
  interimText,
  copied,
  onStart,
  onStop,
  onCopy,
  onClear,
  onExport,
}) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <Button
        variant="contained"
        color="primary"
        onClick={onStart}
        disabled={isListening}
        sx={{
          fontWeight: "bold",
          borderRadius: 2,
        }}
        fullWidth
      >
        <Mic sx={{ mr: 1 }} /> Start
      </Button>

      <Button
        variant="contained"
        color="error"
        onClick={onStop}
        disabled={!isListening}
        sx={{
          fontWeight: "bold",
          borderRadius: 2,
        }}
        fullWidth
      >
        <MicOff sx={{ mr: 1 }} /> Stop
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        onClick={onCopy}
        disabled={!text && !interimText}
        sx={{
          borderRadius: 2,
          fontWeight: "bold",
        }}
        fullWidth
      >
        {copied ? (
          <Fragment>
            <Check sx={{ mr: 1 }} /> Copied!
          </Fragment>
        ) : (
          <Fragment>
            <CopyAll sx={{ mr: 1 }} /> Copy
          </Fragment>
        )}
      </Button>

      <Button
        variant="outlined"
        color="inherit"
        onClick={onClear}
        disabled={!text && !interimText}
        sx={{
          borderRadius: 2,
          fontWeight: "bold",
        }}
        fullWidth
      >
        <Clear sx={{ mr: 1 }} /> Clear
      </Button>

      <Button
        variant="outlined"
        color="success"
        onClick={onExport}
        disabled={!text && !interimText}
        sx={{
          borderRadius: 2,
          fontWeight: "bold",
        }}
        fullWidth
      >
        <Download sx={{ mr: 1 }} /> Export
      </Button>
    </Stack>
  );
});

/* ------------------------------------------------------------------
   TEXT AREA COMPONENT
   - Displays transcribed text with interim results.
------------------------------------------------------------------- */
const TranscribedTextArea = memo(function TranscribedTextArea({
  text,
  interimText,
  onChange,
}) {
  return (
    <TextField
      label="Transcribed Text"
      multiline
      minRows={12} // Increased minRows for a bigger text area
      value={text + interimText}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your speech will appear here..."
      fullWidth
      InputProps={{
        readOnly: true, // Make this read-only unless you want user edits
      }}
      sx={{
        borderRadius: 2,
        backgroundColor: "background.default",
        fontSize: "1.25rem", // Larger font in the text area
      }}
    />
  );
});

/* ------------------------------------------------------------------
   MICROPHONE VISUALIZER COMPONENT
   - Displays a bar that represents audio input volume in real time.
------------------------------------------------------------------- */
const MicrophoneVisualizer = memo(function MicrophoneVisualizer({
  isListening,
}) {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationIdRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize or teardown audio stream + analyzer when isListening changes
  useEffect(() => {
    if (isListening) {
      startVisualizer();
    } else {
      stopVisualizer();
    }

    // Cleanup on unmount
    return () => stopVisualizer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const startVisualizer = async () => {
    try {
      // Request audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create audio context & analyser if not already
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        // Lower fftSize => fewer data points for simpler visualization
        analyserRef.current.fftSize = 256;
      }

      // Connect stream to analyser
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Prepare data array for amplitude or frequency data
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      // Start the drawing loop
      draw();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopVisualizer = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    if (streamRef.current) {
      // Stop all audio tracks
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    // Optionally disconnect the source/analyser to free resources
  };

  // Draw the volume bar in the canvas
  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) {
      return;
    }
  
    // request next frame
    animationIdRef.current = requestAnimationFrame(draw);
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
  
    // Clear previous frame
    ctx.clearRect(0, 0, width, height);
  
    // Get time-domain data
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
  
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#1e3a8a"); // Indigo-900
    gradient.addColorStop(1, "#2563eb"); // Blue-600
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  
    // Draw waveform line
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#4ade80"; // Green-400
    ctx.shadowColor = "#4ade80";
    ctx.shadowBlur = 15;
  
    ctx.beginPath();
  
    const sliceWidth = width / dataArrayRef.current.length;
    let x = 0;
  
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const value = dataArrayRef.current[i] / 128.0; // Normalize around 128
      const y = (value * height) / 2; // Scale to canvas height
  
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
  
      x += sliceWidth;
    }
  
    ctx.lineTo(width, height / 2); // End at middle of canvas
    ctx.stroke();
  };
  

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      style={{
        display: "block",
        margin: "0 auto",
        backgroundColor: "#e2e8f0", // gray-200 for light background
        borderRadius: 4,
      }}
    />
  );
});

/* ------------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------------- */
export default function SpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en-US");

  const recognitionRef = useRef(null);

  /* --------------------------------------------------------------
     INITIALIZE RECOGNITION
  -------------------------------------------------------------- */
  const initializeRecognition = useCallback(() => {
    if (!recognitionRef.current) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError("Your browser does not support Speech Recognition.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError("");
      };

      recognition.onerror = (event) => {
        setError(
          `Error occurred: ${event.error}. 
           Please check your microphone permissions.`
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setText((prev) => prev + finalTranscript);
        setInterimText(interimTranscript);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  /* --------------------------------------------------------------
     START/STOP LISTENING
  -------------------------------------------------------------- */
  const startListening = useCallback(() => {
    initializeRecognition();
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  }, [initializeRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimText("");
  }, []);

  /* --------------------------------------------------------------
     COPY/CLEAR/EXPORT HANDLERS
  -------------------------------------------------------------- */
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  const handleClear = useCallback(() => {
    setText("");
    setInterimText("");
    setError("");
  }, []);

  // Export the transcript as a .txt file
  const handleExport = useCallback(() => {
    // Create a blob from the text
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = "transcript.txt";
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [text]);

  /* --------------------------------------------------------------
     CLEANUP ON UNMOUNT
  -------------------------------------------------------------- */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  /* --------------------------------------------------------------
     RENDER
  -------------------------------------------------------------- */
  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Container
        maxWidth="md"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: "800px",
            boxShadow: 6,
            borderRadius: 3,
            p: 3,
            backgroundColor: "background.paper",
          }}
        >
          {/* Header with Theme Toggle */}
          <AppHeader
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((prev) => !prev)}
          />

          <CardContent>
            <Stack spacing={4}>
              {/* Language Selector */}
              <LanguageSelector
                language={language}
                onChangeLanguage={setLanguage}
              />

              {/* Control Buttons: Start, Stop, Copy, Clear, Export */}
              <ControlButtons
                isListening={isListening}
                text={text}
                interimText={interimText}
                copied={copied}
                onStart={startListening}
                onStop={stopListening}
                onCopy={handleCopy}
                onClear={handleClear}
                onExport={handleExport}
              />

              {/* Microphone Visualizer - Only "active" when isListening */}
              {/* <MicrophoneVisualizer isListening={isListening} /> */}

              {/* Transcribed Text Area */}
              <TranscribedTextArea
                text={text}
                interimText={interimText}
                onChange={(val) => setText(val)}
              />

              {/* Error Message */}
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
}
