Build a Node.js web application for a hackathon MVP that transcribes local audio files using Deepgram and displays the text on a sleek, minimal dark-themed frontend.

**Project Structure:**
- `server.js`: Node.js Express backend.
- `package.json`: Node.js project configuration.
- `public/`: Directory for frontend assets.
  - `public/index.html`: Main HTML page.
  - `public/style.css`: CSS for styling.
  - `public/script.js`: Frontend JavaScript logic.

**Backend (`server.js`) Requirements:**
1.  Initialize an Express server.
2.  Serve static files from the `public` directory.
3.  Create a POST API endpoint `/upload` to handle audio file uploads.
4.  Use `multer` to process single audio files, storing them temporarily in memory or on disk (prefer memory for simplicity if file sizes are small).
5.  Integrate the Deepgram Node.js SDK. The Deepgram API key should be read from `process.env.DEEPGRAM_API_KEY`. **(Important: Use environment variables for security and Vercel deployment.)**
6.  Upon receiving an audio file, send its buffer to Deepgram for transcription.
    *   **Reference Documentation:** [Deepgram Pre-recorded Audio API](https://developers.deepgram.com/docs/pre-recorded-audio)
7.  **Crucially, return the transcribed text directly in the JSON response** (e.g., `{ "transcription": "Your transcribed text here." }`). Do NOT save the text file on the server.
8.  Implement basic error handling for file uploads and Deepgram API calls, returning appropriate HTTP status codes and messages.
9.  Ensure `package.json` includes a `start` script: `"start": "node server.js"` for Vercel compatibility.

**Frontend (`public/index.html`, `public/style.css`, `public/script.js`) Requirements:**
1.  **`index.html`:**
    *   A clean, minimal HTML page.
    *   Include a prominent drag-and-drop area.
    *   Provide a standard file input button as an alternative.
    *   Include a `textarea` or `div` to display the transcription results.
    *   Link to `style.css` and `script.js`.
2.  **`style.css`:**
    *   Apply a sleek, minimal dark theme.
    *   Use modern CSS for a clean aesthetic.
    *   Provide visual feedback for the drag-and-drop area (e.g., a border change on `dragover`).
3.  **`script.js`:**
    *   Implement JavaScript to handle drag-and-drop functionality (prevent default, handle `dragover`, `dragleave`, `drop` events).
    *   Implement JavaScript to handle file selection via the input button.
    *   Send the selected audio file to the `/upload` endpoint using `FormData` and `fetch` API.
    *   Display clear loading states and messages (e.g., "Transcribing...").
    *   Upon successful response from the backend, display the `transcription` text in the designated `textarea`/`div`.
    *   (Optional stretch goal if simple to implement): Add a button to allow the user to download the displayed text as a `.txt` file client-side.
    *   (Optional stretch goal if simple to implement): Make the transcription display `textarea` editable.

**Constraints & Priorities:**
*   Focus on a functional MVP for quick demo.
*   No user authentication or database.
*   No advanced Deepgram features (e.g., diarization, smart formatting) for this iteration.
*   Prioritize clean UI/UX for hackathon judging.
