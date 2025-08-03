// DOM elements
const processingSection = document.getElementById('processing-section');
const resultSection = document.getElementById('result-section');
const processingText = document.getElementById('processing-text');
const transcriptionResult = document.getElementById('transcription-result');
const downloadBtn = document.getElementById('download-btn');
const editBtn = document.getElementById('edit-btn');
const backBtn = document.getElementById('back-btn');

// Get request_id from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const requestId = urlParams.get('request_id');

if (!requestId) {
  processingText.textContent = '❌ Error: No request ID provided';
  processingText.style.color = '#ff6b6b';
} else {
  // Start polling for transcription results
  startPolling(requestId);
}

// Format elapsed time in a user-friendly way
function formatElapsedTime(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}

// Poll for transcription status
function startPolling(requestId) {
  const pollInterval = 5000; // Poll every 5 seconds
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes max (120 * 5 seconds)
  const startTime = Date.now();
    
  const poll = () => {
    if (attempts >= maxAttempts) {
      processingText.textContent = '❌ Transcription timeout. Please try again.';
      processingText.style.color = '#ff6b6b';
      return;
    }
        
    fetch(`/status/${requestId}`)
      .then(response => response.json())
      .then(data => {
        attempts++;
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            
        if (data.status === 'completed' && data.transcription) {
          // Show transcription result
          transcriptionResult.value = data.transcription;
          const duration = data.metadata?.duration ? ` (${Math.round(data.metadata.duration)}s audio)` : '';
          processingText.textContent = `✅ Transcription completed successfully!${duration}`;
          processingText.style.color = '#51cf66';
                
          // Switch to result section
          setTimeout(() => {
            processingSection.style.display = 'none';
            resultSection.style.display = 'block';
          }, 1000);
        } else if (data.status === 'failed') {
          const errorMsg = data.error ? `: ${data.error}` : '';
          processingText.textContent = `❌ Transcription failed${errorMsg}`;
          processingText.style.color = '#ff6b6b';
        } else if (data.status === 'processing') {
          const timeDisplay = formatElapsedTime(elapsedSeconds);
          processingText.textContent = `⏳ Processing with Deepgram... (${timeDisplay} elapsed)`;
        } else {
          processingText.textContent = '❌ Transcription failed. Please try again.';
          processingText.style.color = '#ff6b6b';
        }
      })
      .catch(error => {
        console.error('Polling error:', error);
        processingText.textContent = '❌ Error checking transcription status';
        processingText.style.color = '#ff6b6b';
      });
  };
    
  // Start polling immediately
  poll();
    
  // Continue polling at intervals
  const pollTimer = setInterval(poll, pollInterval);
    
  // Stop polling when max attempts reached
  setTimeout(() => {
    clearInterval(pollTimer);
  }, maxAttempts * pollInterval);
}

// Download transcription as text file
downloadBtn.addEventListener('click', () => {
  const text = transcriptionResult.value;
  if (!text.trim()) {
    processingText.textContent = 'No transcription to download';
    processingText.style.color = '#ff6b6b';
    return;
  }
    
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transcription.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Toggle edit mode for transcription
editBtn.addEventListener('click', () => {
  if (transcriptionResult.readOnly) {
    transcriptionResult.readOnly = false;
    transcriptionResult.focus();
    editBtn.textContent = 'Save Text';
  } else {
    transcriptionResult.readOnly = true;
    editBtn.textContent = 'Edit Text';
  }
});

// Back to upload page
backBtn.addEventListener('click', () => {
  window.location.href = '/';
});
