const express = require('express');
const multer = require('multer');
const { createClient } = require('@deepgram/sdk');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure body parser with increased limits for webhook payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
}).single('audio');

// Initialize Deepgram client
const deepgram = process.env.DEEPGRAM_API_KEY ? createClient(process.env.DEEPGRAM_API_KEY) : null;

if (!deepgram) {
  console.warn('Warning: DEEPGRAM_API_KEY environment variable not set. Transcription will not work.');
}

// Store pending transcriptions
const pendingTranscriptions = new Map();

// Clean up old transcriptions every hour
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [requestId, data] of pendingTranscriptions.entries()) {
    if (data.completedAt && data.completedAt < oneHourAgo) {
      pendingTranscriptions.delete(requestId);
      console.log(`Cleaned up old transcription: ${requestId}`);
    }
  }
}, 60 * 60 * 1000); // Run every hour

// POST endpoint for audio file upload and transcription
app.post('/upload', (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ error: 'File upload error', details: err.message });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      console.log(`Received file: ${req.file.originalname}`);
      console.log(`File size: ${req.file.size} bytes`);
      console.log(`MIME type: ${req.file.mimetype}`);

      // Check if Deepgram is configured
      if (!deepgram) {
        return res.status(500).json({ 
          error: 'Deepgram API key not configured', 
          details: 'Please set the DEEPGRAM_API_KEY environment variable' 
        });
      }

      // Use callback approach for all files to avoid timeouts
      console.log('Using callback approach for async processing');
      
      // Write buffer to temporary file and read it back
      const tempPath = path.join(__dirname, 'temp_audio');
      fs.writeFileSync(tempPath, req.file.buffer);
      const audioBuffer = fs.readFileSync(tempPath);
      
      // Clean up temp file
      fs.unlinkSync(tempPath);

      // Generate callback URL
      const callbackUrl = `${process.env.PUBLIC_URL || `http://localhost:${port}`}/webhook`;
      
      // Send file buffer to Deepgram API directly with callback parameter
      const response = await fetch('https://api.deepgram.com/v1/listen?callback=' + encodeURIComponent(callbackUrl) + '&model=nova-3&smart_format=true&detect_language=true&diarize=true&utterances=true', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': req.file.mimetype
        },
        body: audioBuffer
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Deepgram API error:', errorText);
        return res.status(500).json({ error: 'Transcription failed', details: errorText });
      }

      const result = await response.json();

      // Store the request for polling
      const requestId = result.request_id;
      pendingTranscriptions.set(requestId, {
        status: 'processing',
        filename: req.file.originalname,
        timestamp: Date.now()
      });

      console.log(`Started async transcription with request_id: ${requestId}`);
      
      // Return request ID for polling
      res.json({ 
        request_id: requestId, 
        status: 'processing',
        message: 'File processing started. Use the request_id to check status.' 
      });

    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });
});

// Webhook endpoint for Deepgram callbacks
app.post('/webhook', express.json(), (req, res) => {
  try {
    // TEMPORARY: Log complete payload to understand structure
    console.log('=== FULL WEBHOOK PAYLOAD ===');
    console.log('Headers:', req.headers);
    console.log('Body keys:', Object.keys(req.body));
    console.log('Body sample:', JSON.stringify(req.body).substring(0, 500) + '...');
    console.log('==============================');
    
    // Verify the request came from Deepgram (check dg-token header)
    const dgToken = req.headers['dg-token'];
    if (!dgToken) {
      console.warn('Webhook received without dg-token header');
    }
    
    const requestId = req.body.metadata?.request_id;
    if (!requestId) {
      console.error('No request_id in webhook payload - checking body structure');
      // Don't return error - always return 200 to stop retries
    }

    // Check if this is an error response
    if (req.body.error) {
      console.error(`Deepgram callback error for ${requestId}:`, req.body.error);
      if (pendingTranscriptions.has(requestId)) {
        pendingTranscriptions.set(requestId, {
          ...pendingTranscriptions.get(requestId),
          status: 'failed',
          error: req.body.error,
          completedAt: Date.now()
        });
      }
      return res.status(200).json({ received: true });
    }

    // Update the transcription status with successful result
    if (requestId && pendingTranscriptions.has(requestId)) {
      const transcription = req.body?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.transcript || '';
      const metadata = {
        duration: req.body?.metadata?.duration,
        channels: req.body?.metadata?.channels,
        created: req.body?.metadata?.created
      };
      
      pendingTranscriptions.set(requestId, {
        ...pendingTranscriptions.get(requestId),
        status: 'completed',
        transcription: transcription,
        metadata: metadata,
        completedAt: Date.now()
      });
      
      console.log(`Transcription completed for request_id: ${requestId}`);
      console.log(`Transcription length: ${transcription.length} characters`);
      console.log(`Audio duration: ${metadata.duration}s`);
    } else if (requestId) {
      console.warn(`Received webhook for unknown request_id: ${requestId}`);
    } else {
      console.warn('Received webhook without valid request_id');
    }

    // ALWAYS return 200 status to prevent Deepgram retries
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // ALWAYS return 200 to prevent retries on parse errors
    res.status(200).json({ error: 'Webhook processing failed' });
  }
});

// Endpoint to check transcription status
app.get('/status/:requestId', (req, res) => {
  const requestId = req.params.requestId;
  
  if (!pendingTranscriptions.has(requestId)) {
    return res.status(404).json({ error: 'Request ID not found' });
  }

  const transcriptionData = pendingTranscriptions.get(requestId);
  res.json(transcriptionData);
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the transcript page
app.get('/transcript', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'transcript.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
