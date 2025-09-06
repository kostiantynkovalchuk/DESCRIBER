// ***********
// CHALLENGE:
// ***********
// Add all the code necessary to talk to Claude, asking it to describe the image. Figure out what the system prompt and the user prompt will be. When you get back the description in the response, display it in the UI.

// Imports
import Anthropic from '@anthropic-ai/sdk'
import { fetchImageAndReturnBase64ImageData } from '/utils/fetchImageAndReturnBase64ImageData'

// Anthropic Instance
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: 'https://apis.scrimba.com/api.anthropic.com/'
})

// Constants and Variables
const feedbackDisplayTime = 3000
let imageUrl
let imageType

// Element Selectors
const imageInputArea = document.getElementById('image-input-area')
const fileInput = document.getElementById('file-input')
const descriptionLengthContainer = document.getElementById('description-length-container')
const descriptionLengthInput = document.getElementById('description-length-input')
const descriptionLengthText = document.getElementById('description-length-text')
const describeButton = document.getElementById('describe-button')
const descriptionContent = document.getElementById('description-content')
const descriptionOutputArea = document.getElementById('description-output-area')
const copyButton = document.getElementById('copy-button')
const clearButton = document.getElementById('clear-button')
const loadingSection = document.getElementById('loading-section')
const errorSection = document.getElementById('error-section')
const errorMessage = document.getElementById('error-message')
const dismissErrorButton = document.getElementById('dismiss-error-button')

// Button Event Listeners
describeButton.addEventListener('click', describe)
copyButton.addEventListener('click', copy)
clearButton.addEventListener('click', clear)
dismissErrorButton.addEventListener('click', dismissError)

// Image Event Listeners
imageInputArea.addEventListener('dragover', dragOverImageInputArea)
imageInputArea.addEventListener('dragleave', dragLeaveImageInputArea)
imageInputArea.addEventListener('drop', dropImage)
fileInput.addEventListener('change', displayUploadedImage)
imageInputArea.addEventListener('click', clickFileInput)

// Other Event Listeners
document.addEventListener('DOMContentLoaded', focusOnImageInputArea)
const imageInputListener = listenForInnerHTMLChange(imageInputArea, enableControls)
window.addEventListener('beforeunload', cleanUp)
descriptionLengthInput.addEventListener('input', updateDescriptionLengthText)

// Button Event Handlers
async function describe() {
    // ***********
    // CHALLENGE:
    // ***********
    // Handle errors.

    // ***********
    // CHALLENGE:
    // ***********
    // Debug the error and fix it.

    try {

        startLoading()
        const base64ImageData = await fetchImageAndReturnBase64ImageData(imageUrl)
        const descriptionLength = descriptionLengthInput.value
        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 300,
            system: 'You are an image describer. When asked to describe an image, provide an accurate description.',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: imageType,
                                data: base64ImageData
                            }
                        },
                        {
                            type: 'text',
                            // ***********
                            // CHALLENGE:
                            // ***********
                            // Practice prompt engineering. Modify the user prompt to adjust the length of the description. Where do you get the description length from?
                            text: `Describe the image. Limit the description to ${descriptionLength} words.`
                        }
                    ]
                }
            ]
        })
        endLoading()
        descriptionOutputArea.value = response.content[0].text
        enableDescriptionOutputArea()
        enableCopyButton()
        focusOnCopyButton()
    } catch (error) {
        handleError(error)
    }
}

async function copy() {
    try {
        await navigator.clipboard.writeText(descriptionOutputArea.value)
        showCopyFeedback('😄 Copied', 'success')
    } catch (err) {
        showCopyFeedback('😔 Failed', 'failure')
    }
}

function clear() {
    clearImageInputArea()
    clearFileInput()
    clearDescriptionOutputArea()
    enableImageInputArea()
    focusOnImageInputArea()
    disableAllControls()
}

function dismissError() {
    hideErrorSection()
    displayDescriptionContent()
    clear()
}

// Image Event Handlers
function dragOverImageInputArea(e) {
    e.preventDefault()
    imageInputArea.classList.add('drag-over')
}

function dragLeaveImageInputArea() {
    imageInputArea.classList.remove('drag-over')
}

function dropImage(e) {
    e.preventDefault()
    imageInputArea.classList.remove('drag-over')
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => displayImage(e.target.result, file.type)
        reader.readAsDataURL(file)
    }
}

function displayUploadedImage(e) {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => displayImage(e.target.result, file.type)
        reader.readAsDataURL(file)
    }
}

function clickFileInput() {
    fileInput.click()
}

// Other Event Handlers
function focusOnImageInputArea() {
    imageInputArea.focus()
}

function listenForInnerHTMLChange(button, callback) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                callback()
            }
        })
    })
    const config = {
        childList: true,
        characterData: true,
        subtree: true
    }
    observer.observe(button, config)
    return observer
}

function cleanUp() {
    imageInputListener.disconnect()
}

function updateDescriptionLengthText() {
    descriptionLengthText.textContent = `Description Length: ${descriptionLengthInput.value} Words`
}

// Helper Functions
function displayImage(url, type) {
    imageUrl = url
    imageType = type
    imageInputArea.innerHTML = `<img src="${url}" class="flex-column uploaded-img" alt="Uploaded image">`
}

function disableAllControls() {
    disableDescriptionLengthContainer()
    disableDescriptionLengthInput()
    disableDescribeButton()
    disableDescriptionOutputArea()
    disbaleClearButton()
    disableCopyButton()
}

function enableControls() {
    if (!imageInputArea.innerHTML.includes('<p>')) {
        enableDescriptionLengthContainer()
        enableDescriptionLengthInput()
        enableDescribeButton()
        enableClearButton()
    } else {
        disableAllControls()
    }
}

function startLoading() {
    hideDescriptionContent()
    displayLoadingSection()
}

function endLoading() {
    hideLoadingSection()
    displayDescriptionContent()
}

function handleError(error) {
    endLoading()
    disableImageInputArea()
    disableAllControls()
    hideDescriptionContent()
    setErrorMessageText(`There was an error processing the image: ${error.message}`)
    displayErrorSection()
}

function showCopyFeedback(message, status) {
    const feedbackClass = status === 'success' ? 'copied' : 'failed'
    addClassToCopyButton(feedbackClass)
    setCopyButtonText(message)
    setTimeout(() => {
        removeClassFromCopyButton(feedbackClass)
        setCopyButtonText('Copy')
    }, feedbackDisplayTime)
}

function enableImageInputArea() {
    imageInputArea.disabled = false
}

function enableDescriptionLengthContainer() {
    descriptionLengthContainer.classList.remove('disabled')
}

function enableDescriptionLengthInput() {
    descriptionLengthInput.disabled = false
}

function enableDescribeButton() {
    describeButton.disabled = false
}

function enableCopyButton() {
    copyButton.disabled = false
}

function enableClearButton() {
    clearButton.disabled = false
}

function enableDescriptionOutputArea() {
    descriptionOutputArea.disabled = false
}

function disableCopyButton() {
    copyButton.disabled = true
}

function disbaleClearButton() {
    clearButton.disabled = true
}

function disableDescriptionOutputArea() {
    descriptionOutputArea.disabled = true
}

function disableDescribeButton() {
    describeButton.disabled = true
}

function disableDescriptionLengthInput() {
    descriptionLengthInput.disabled = true
}

function disableDescriptionLengthContainer() {
    descriptionLengthContainer.classList.add('disabled')
}

function disableImageInputArea() {
    imageInputArea.disabled = true
}

function clearFileInput() {
    fileInput.value = ''
}

function clearImageInputArea() {
    imageInputArea.innerHTML = `<img class="upload-icon" src="images/upload.svg" alt="Upload image">
                    <p>Drop image here or click to upload</p>`
}

function clearDescriptionOutputArea() {
    descriptionOutputArea.value = ''
}

function focusOnCopyButton() {
    copyButton.focus()
}

function displayDescriptionContent() {
    descriptionContent.style.display = 'flex'
}

function displayLoadingSection() {
    loadingSection.style.display = 'flex'
}

function displayErrorSection() {
    errorSection.style.display = 'flex'
}

function hideLoadingSection() {
    loadingSection.style.display = 'none'
}

function hideErrorSection() {
    errorSection.style.display = 'none'
}

function hideDescriptionContent() {
    descriptionContent.style.display = 'none'
}

function setErrorMessageText(text) {
    errorMessage.textContent = text
}

function setCopyButtonText(text) {
    copyButton.textContent = text
}

function removeClassFromCopyButton(className) {
    copyButton.classList.remove(className)
}

function addClassToCopyButton(className) {
    copyButton.classList.add(className)
}