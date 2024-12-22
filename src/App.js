import React, { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);

  let recognition;

  if ("webkitSpeechRecognition" in window) {
    recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true; // Keep recognizing while the user is speaking
    recognition.interimResults = true; // Allow capturing interim results
    recognition.maxAlternatives = 1; // Process only the most probable result

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setText((prevText) => prevText + finalTranscript);
      setInterimText(interimTranscript); // Show interim text live
    };

    recognition.onspeechend = () => {
      console.log("Speech ended");
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
  } else {
    alert("Web Speech API is not supported in this browser. Please use Chrome.");
  }

  const startListening = () => {
    setIsListening(true);
    setText(""); // Clear previous results
    recognition?.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognition?.stop();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Live Speech to Text</h1>
      <textarea
        value={text + interimText} // Combine interim and final text
        rows="10"
        cols="50"
        readOnly
        placeholder="Your speech will appear here..."
      ></textarea>
      <div>
        <button onClick={startListening} disabled={isListening}>
          Start Listening
        </button>
        <button onClick={stopListening} disabled={!isListening}>
          Stop Listening
        </button>
      </div>
    </div>
  );
}

export default App;
