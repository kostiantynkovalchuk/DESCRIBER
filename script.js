// Configuration
const API_ENDPOINT = "/api/describe";
const feedbackDisplayTime = 3000;

// State
let imageUrl;
let imageType;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;

// Element Selectors
const imageInputArea = document.getElementById("image-input-area");
const fileInput = document.getElementById("file-input");
const descriptionLengthContainer = document.getElementById("description-length-container");
const descriptionLengthInput = document.getElementById("description-length-input");
const descriptionLengthText = document.getElementById("description-length-text");
const describeButton = document.getElementById("describe-button");
const descriptionContent = document.getElementById("description-content");
const descriptionOutputArea = document.getElementById("description-output-area");
const speakButton = document.getElementById("speak-button");
const stopSpeakingButton = document.getElementById("stop-speaking-button");
const copyButton = document.getElementById("copy-button");
const clearButton = document.getElementById("clear-button");
const loadingSection = document.getElementById("loading-section");
const errorSection = document.getElementById("error-section");
const errorMessage = document.getElementById("error-message");
const dismissErrorButton = document.getElementById("dismiss-error-button");
const srAnnouncer = document.getElementById("sr-announcer");

// Event Listeners
describeButton.addEventListener("click", describe);
speakButton.addEventListener("click", speakDescription);
stopSpeakingButton.addEventListener("click", stopSpeaking);
copyButton.addEventListener("click", copy);
clearButton.addEventListener("click", clear);
dismissErrorButton.addEventListener("click", dismissError);

imageInputArea.addEventListener("dragover", dragOverImageInputArea);
imageInputArea.addEventListener("dragleave", dragLeaveImageInputArea);
imageInputArea.addEventListener("drop", dropImage);
fileInput.addEventListener("change", displayUploadedImage);
imageInputArea.addEventListener("click", clickFileInput);

document.addEventListener("DOMContentLoaded", focusOnImageInputArea);
descriptionLengthInput.addEventListener("input", updateDescriptionLengthText);

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.altKey && e.key === "d" && !describeButton.disabled) {
    e.preventDefault();
    describe();
  }
  if (e.altKey && e.key === "s" && !speakButton.disabled) {
    e.preventDefault();
    speakDescription();
  }
  if (e.altKey && e.key === "c" && !copyButton.disabled) {
    e.preventDefault();
    copy();
  }
  if (e.altKey && e.key === "x" && !clearButton.disabled) {
    e.preventDefault();
    clear();
  }
});

// === Functions ===

function announceToScreenReader(message) {
  if (srAnnouncer) {
    srAnnouncer.textContent = message;
    setTimeout(() => {
      srAnnouncer.textContent = "";
    }, 1000);
  }
}

function focusOnImageInputArea() {
  imageInputArea.focus();
  announceToScreenReader("The Describer app loaded. Upload an image to begin.");
}

function updateDescriptionLengthText() {
  const value = descriptionLengthInput.value;
  descriptionLengthText.textContent = `Description Length: ${value} Words`;
}

function clickFileInput() {
  fileInput.click();
}

function dragOverImageInputArea(e) {
  e.preventDefault();
  imageInputArea.classList.add("drag-over");
}

function dragLeaveImageInputArea(e) {
  e.preventDefault();
  imageInputArea.classList.remove("drag-over");
}

function dropImage(e) {
  e.preventDefault();
  imageInputArea.classList.remove("drag-over");
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.type.startsWith("image/")) {
      processImageFile(file);
    } else {
      showError("Please drop a valid image file.");
    }
  }
}

function displayUploadedImage() {
  const file = fileInput.files[0];
  if (file) {
    processImageFile(file);
  }
}

function processImageFile(file) {
  // Validate file size (max 20MB for mobile compatibility)
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    showError("Image too large. Please use an image smaller than 20MB.");
    return;
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    showError("Unsupported image format. Please use JPG, PNG, GIF, or WebP.");
    return;
  }

  imageType = file.type;
  
  // Create FileReader to convert to base64
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      imageUrl = e.target.result;
      
      // Validate base64 data
      if (!imageUrl || !imageUrl.includes(',')) {
        throw new Error("Invalid image data");
      }
      
      // Display the image
      imageInputArea.innerHTML = `
        <img src="${imageUrl}" alt="Uploaded image" class="uploaded-img" />
      `;
      
      // Enable controls
      descriptionLengthContainer.classList.remove("disabled");
      descriptionLengthInput.disabled = false;
      describeButton.disabled = false;
      
      announceToScreenReader("Image uploaded successfully. Ready to describe.");
      describeButton.focus();
    } catch (error) {
      console.error("Image processing error:", error);
      showError("Failed to process the image file.");
    }
  };
  
  reader.onerror = function() {
    showError("Failed to read the image file.");
  };
  
  reader.readAsDataURL(file);
}

async function describe() {
  if (!imageUrl) {
    showError("Please upload an image first.");
    return;
  }

  // Show loading state
  showLoading();
  announceToScreenReader("Generating description...");

  try {
    // Get the base64 data without the data URL prefix
    const base64Data = imageUrl.split(",")[1];
    
    // Validate base64 data exists
    if (!base64Data) {
      throw new Error("Invalid image data format");
    }
    
    const descriptionLength = descriptionLengthInput.value;

    // Create request with timeout for mobile networks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("/api/describe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Data,
        imageType: imageType || 'image/jpeg',
        maxWords: parseInt(descriptionLength) || 25
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", response.status, errorText);
      
      if (response.status === 400) {
        throw new Error("Bad request - please try a different image or check image format");
      } else if (response.status === 413) {
        throw new Error("Image too large - please use a smaller image");
      } else if (response.status === 429) {
        throw new Error("Too many requests - please wait and try again");
      } else {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }

    const result = await response.json();
    
    if (result.description) {
      showDescription(result.description);
      announceToScreenReader("Description generated successfully.");
    } else if (result.error) {
      throw new Error(result.error);
    } else {
      throw new Error("No description received from API");
    }

  } catch (error) {
    console.error("Description error:", error);
    
    if (error.name === 'AbortError') {
      showError("Request timed out. Please check your connection and try again.");
    } else {
      showError(`Failed to describe image: ${error.message}`);
    }
    announceToScreenReader("Failed to generate description.");
  }
}

function showLoading() {
  hideAllSections();
  loadingSection.style.display = "flex";
  
  // Disable describe button during loading
  describeButton.disabled = true;
}

function showDescription(description) {
  hideAllSections();
  descriptionContent.style.display = "flex";
  
  descriptionOutputArea.value = description;
  descriptionOutputArea.disabled = false;
  
  // Enable all output controls
  speakButton.disabled = false;
  copyButton.disabled = false;
  clearButton.disabled = false;
  
  // Re-enable describe button
  describeButton.disabled = false;
  
  // Focus on the description for screen readers
  descriptionOutputArea.focus();
}

function showError(message) {
  hideAllSections();
  errorSection.style.display = "flex";
  errorMessage.textContent = message;
  
  // Re-enable describe button
  describeButton.disabled = false;
  
  announceToScreenReader(`Error: ${message}`);
}

function hideAllSections() {
  descriptionContent.style.display = "none";
  loadingSection.style.display = "none";
  errorSection.style.display = "none";
}

function dismissError() {
  hideAllSections();
  descriptionOutputArea.focus();
}

function speakDescription() {
  const text = descriptionOutputArea.value;
  if (!text) {
    announceToScreenReader("No description to speak.");
    return;
  }

  // Stop any current speech
  speechSynthesis.cancel();
  
  // Create new utterance
  currentUtterance = new SpeechSynthesisUtterance(text);
  
  // Configure speech
  currentUtterance.rate = 0.9;
  currentUtterance.pitch = 1.0;
  currentUtterance.volume = 1.0;
  
  // Event handlers
  currentUtterance.onstart = function() {
    speakButton.disabled = true;
    stopSpeakingButton.disabled = false;
    announceToScreenReader("Speaking description.");
  };
  
  currentUtterance.onend = function() {
    speakButton.disabled = false;
    stopSpeakingButton.disabled = true;
    announceToScreenReader("Finished speaking.");
  };
  
  currentUtterance.onerror = function() {
    speakButton.disabled = false;
    stopSpeakingButton.disabled = true;
    announceToScreenReader("Speech error occurred.");
  };
  
  // Start speaking
  speechSynthesis.speak(currentUtterance);
}

function stopSpeaking() {
  speechSynthesis.cancel();
  speakButton.disabled = false;
  stopSpeakingButton.disabled = true;
  announceToScreenReader("Speech stopped.");
}

function copy() {
  const text = descriptionOutputArea.value;
  if (!text) {
    announceToScreenReader("No description to copy.");
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    // Visual feedback
    const originalText = copyButton.textContent;
    copyButton.textContent = "Copied!";
    copyButton.classList.add("copied");
    
    announceToScreenReader("Description copied to clipboard.");
    
    setTimeout(() => {
      copyButton.textContent = originalText;
      copyButton.classList.remove("copied");
    }, feedbackDisplayTime);
    
  }).catch(() => {
    // Fallback for older browsers
    try {
      descriptionOutputArea.select();
      document.execCommand("copy");
      
      copyButton.textContent = "Copied!";
      copyButton.classList.add("copied");
      announceToScreenReader("Description copied to clipboard.");
      
      setTimeout(() => {
        copyButton.textContent = "Copy";
        copyButton.classList.remove("copied");
      }, feedbackDisplayTime);
      
    } catch (error) {
      showError("Failed to copy to clipboard.");
    }
  });
}

function clear() {
  // Reset image state completely
  imageUrl = null;
  imageType = null;
  
  // Reset UI
  imageInputArea.innerHTML = `
    <div style="font-size: 4rem; margin-bottom: 10px">📤</div>
    <p>Drop image here or click to upload</p>
    <small>Supports JPG, PNG, GIF, WebP</small>
  `;
  
  // Reset form completely
  fileInput.value = "";
  fileInput.files = null; // Clear file input on mobile
  descriptionOutputArea.value = "";
  descriptionLengthInput.value = "25";
  updateDescriptionLengthText();
  
  // Disable controls
  descriptionLengthContainer.classList.add("disabled");
  descriptionLengthInput.disabled = true;
  describeButton.disabled = true;
  speakButton.disabled = true;
  copyButton.disabled = true;
  clearButton.disabled = true;
  descriptionOutputArea.disabled = true;
  
  // Stop any speech
  speechSynthesis.cancel();
  if (stopSpeakingButton) {
    stopSpeakingButton.disabled = true;
  }
  
  // Hide all sections
  hideAllSections();
  
  // Force garbage collection of image data (helps with mobile memory)
  if (window.gc) {
    window.gc();
  }
  
  // Focus back on upload area
  imageInputArea.focus();
  announceToScreenReader("Cleared. Ready for new image.");
}

// Initialize app
document.addEventListener("DOMContentLoaded", function() {
  // Set initial state
  hideAllSections();
  descriptionLengthInput.value = "25";
  updateDescriptionLengthText();
  
  // Announce app is ready
  setTimeout(() => {
    announceToScreenReader("The Describer is ready. Upload an image to begin describing it for accessibility.");
  }, 500);
});