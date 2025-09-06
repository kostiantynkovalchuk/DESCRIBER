// Function to fetch an image and convert it to Base64 image data
// Source: Scrimba's Claude Vision Template, created by Tom Chant, from Scrimba
export async function fetchImageAndReturnBase64ImageData(url) {
    try {
        // Fetch the image
        const response = await fetch(url)

        // Check if the fetch was successful
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`)
        }

        // Convert the response to a blob
        const blob = await response.blob()

        // Create a new FileReader instance
        const reader = new FileReader()

        // Return a promise that resolves with the Base64 string when the reader finishes
        return new Promise((resolve, reject) => {
            reader.onloadend = () => {
                // Get the result from the reader
                const dataUrl = reader.result

                // Extract the raw Base64 string by removing the prefix
                const base64String = dataUrl.split(',')[1]

                // Resolve the promise with the raw Base64 string
                resolve(base64String)
            }
            reader.onerror = reject

            // Read the blob as a data URL (Base64)
            reader.readAsDataURL(blob)
        })
    } catch (error) {
        throw new Error(error)
    }
}
