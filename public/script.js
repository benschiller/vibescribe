// DOM elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const transcriptionResult = document.getElementById('transcription-result');
const uploadStatus = document.getElementById('upload-status');
const statusText = document.getElementById('status-text');
const downloadBtn = document.getElementById('download-btn');
const editBtn = document.getElementById('edit-btn');

// Event listeners for drag and drop
dropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropArea.classList.add('drag-over');
});

dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('drag-over');
});

dropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  dropArea.classList.remove('drag-over');
    
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileUpload(files[0]);
  }
});

// Event listeners for browse button
browseBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileUpload(e.target.files[0]);
  }
});

// Handle file upload
function handleFileUpload(file) {
  // Validate file type
  if (!file.type.startsWith('audio/')) {
    showStatus('Please select an audio file', 'error');
    return;
  }

  // Show initial upload message
  showStatus('Uploading file... 0%', 'processing');
    
  // Create FormData and send to backend with progress tracking
  const formData = new FormData();
  formData.append('audio', file);

  // Use XMLHttpRequest for upload progress
  const xhr = new XMLHttpRequest();
    
  // Track upload progress
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percentComplete = Math.round((e.loaded / e.total) * 100);
      showStatus(`Uploading file... ${percentComplete}%`, 'processing');
    }
  });
    
  // Handle upload completion (before load)
  xhr.upload.addEventListener('load', () => {
    // Show preparing message after upload completes
    showStatus('Preparing audio file...', 'preparing');
  });
    
  // Handle completion
  xhr.addEventListener('load', () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText);
                
        if (data.error) {
          showStatus(`Error: ${data.error}`, 'error');
        } else if (data.request_id) {
          // File uploaded successfully, now processing
          showStatus('✅ File uploaded successfully. Processing with Deepgram...', 'processing');
          startPolling(data.request_id);
        } else {
          // Fallback for immediate result
          transcriptionResult.value = data.transcription;
          showStatus('✅ Transcription completed successfully!', 'success');
          // Show action buttons
          downloadBtn.style.display = 'block';
          editBtn.style.display = 'block';
        }
      } catch (error) {
        console.error('Parse error:', error);
        showStatus('Error: Invalid response from server', 'error');
      }
    } else {
      showStatus(`Error: HTTP ${xhr.status}`, 'error');
    }
  });
    
  // Handle errors
  xhr.addEventListener('error', () => {
    showStatus('Error: Upload failed', 'error');
  });
    
  // Handle timeout
  xhr.addEventListener('timeout', () => {
    showStatus('Error: Upload timed out', 'error');
  });
    
  // Configure and send request
  xhr.open('POST', '/upload');
  xhr.send(formData);
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
  const maxAttempts = 240; // 20 minutes max (240 * 5 seconds)
  const startTime = Date.now();
    
  const poll = () => {
    if (attempts >= maxAttempts) {
      showStatus('❌ Transcription timeout. Please try again.', 'error');
      return;
    }
        
    fetch(`/status/${requestId}`)
      .then(response => response.json())
      .then(data => {
        attempts++;
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            
        if (data.status === 'completed' && data.transcription) {
          // Redirect to transcript page with request_id
          window.location.href = `/transcript?request_id=${requestId}`;
        } else if (data.status === 'failed') {
          const errorMsg = data.error ? `: ${data.error}` : '';
          showStatus(`❌ Transcription failed${errorMsg}`, 'error');
        } else if (data.status === 'processing') {
          const timeDisplay = formatElapsedTime(elapsedSeconds);
          showStatus(`⏳ Processing with Deepgram... (${timeDisplay} elapsed)`, 'processing');
          setTimeout(poll, pollInterval);
        } else {
          showStatus('❌ Transcription failed. Please try again.', 'error');
        }
      })
      .catch(error => {
        console.error('Polling error:', error);
        showStatus('❌ Error checking transcription status', 'error');
      });
  };
    
  setTimeout(poll, pollInterval);
}

// Show status message
function showStatus(message, type) {
  statusText.textContent = message;
    
  // Hide drop area and show status
  dropArea.style.display = 'none';
  uploadStatus.style.display = 'block';
    
  // Remove previous status classes
  uploadStatus.className = 'upload-status';
    
  // Add status type class
  if (type === 'error') {
    uploadStatus.classList.add('error');
  } else if (type === 'success') {
    uploadStatus.classList.add('success');
  } else if (type === 'preparing') {
    uploadStatus.classList.add('preparing');
  }
    
  // If it's an error or success, show drop area again after 3 seconds
  if (type === 'error' || type === 'success') {
    setTimeout(() => {
      uploadStatus.style.display = 'none';
      dropArea.style.display = 'block';
    }, 3000);
  }
}

// Download transcription as text file
downloadBtn.addEventListener('click', () => {
  const text = transcriptionResult.value;
  if (!text.trim()) {
    showStatus('No transcription to download', 'error');
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
