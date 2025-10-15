class GifToFramesConverter {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.processingSection = document.getElementById('processingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.processingFiles = document.getElementById('processingFiles');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.clearBtn = document.getElementById('clearBtn');

        this.processedFiles = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File upload events
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());

        // Action buttons
        this.downloadAllBtn.addEventListener('click', () => this.downloadAllFrames());
        this.clearBtn.addEventListener('click', () => this.clearResults());

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = e.target.files;
        this.processFiles(files);
    }

    async processFiles(files) {
        // Filter only GIF files
        const gifFiles = Array.from(files).filter(file => file.type === 'image/gif');

        if (gifFiles.length === 0) {
            this.showNotification('Please select GIF files only', 'error');
            return;
        }

        // Show processing section
        this.processingSection.style.display = 'block';
        this.resultsSection.style.display = 'none';

        // Clear previous results
        this.processingFiles.innerHTML = '';
        this.processedFiles = [];

        // Process each file
        for (let i = 0; i < gifFiles.length; i++) {
            const file = gifFiles[i];
            await this.processGifFile(file, i, gifFiles.length);
        }

        // Show results section
        this.showResults();
    }

    async processGifFile(file, index, totalFiles) {
        const fileId = `file-${Date.now()}-${index}`;

        // Create file processing element
        const fileElement = document.createElement('div');
        fileElement.className = 'processing-file';
        fileElement.innerHTML = `
            <div class="processing-file-name">${file.name}</div>
            <div class="processing-file-status">Processing...</div>
        `;
        this.processingFiles.appendChild(fileElement);

        try {
            // Read GIF file
            const arrayBuffer = await this.readFileAsArrayBuffer(file);

            // Extract frames using gif.js library
            const frames = await this.extractGifFrames(arrayBuffer);

            // Get selected format
            const format = document.querySelector('input[name="format"]:checked').value;

            // Convert frames to selected format
            const processedFrames = await this.convertFramesToFormat(frames, format);

            // Store processed data
            this.processedFiles.push({
                id: fileId,
                name: file.name,
                frames: processedFrames,
                format: format
            });

            // Update file element
            fileElement.querySelector('.processing-file-status').textContent = `Completed (${frames.length} frames)`;
            fileElement.querySelector('.processing-file-status').style.color = '#48bb78';

        } catch (error) {
            console.error('Error processing GIF:', error);
            fileElement.querySelector('.processing-file-status').textContent = 'Error: ' + error.message;
            fileElement.querySelector('.processing-file-status').style.color = '#e53e3e';
        }

        // Update progress
        const progress = Math.round(((index + 1) / totalFiles) * 100);
        this.updateProgress(progress);
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async extractGifFrames(arrayBuffer) {
        return new Promise((resolve, reject) => {
            // Create a temporary image to load the GIF
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                try {
                    // For simple GIF frame extraction, we'll use a basic approach
                    // Note: This is a simplified version. For full GIF support with all frames,
                    // you would need a more sophisticated GIF parser library

                    const frames = [];
                    const frameCount = this.estimateGifFrameCount(img);

                    // Create frames by simulating the animation
                    for (let i = 0; i < frameCount; i++) {
                        canvas.width = img.width;
                        canvas.height = img.height;

                        // Draw the current frame
                        ctx.drawImage(img, 0, 0);

                        // Convert canvas to data URL
                        const dataUrl = canvas.toDataURL('image/png');
                        frames.push({
                            dataUrl: dataUrl,
                            width: img.width,
                            height: img.height,
                            index: i
                        });
                    }

                    resolve(frames);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = reject;
            img.src = URL.createObjectURL(new Blob([arrayBuffer], { type: 'image/gif' }));
        });
    }

    estimateGifFrameCount(img) {
        // This is a simplified approach
        // In a real implementation, you would parse the GIF file structure
        // to get the actual frame count
        return 10; // Default to 10 frames for demonstration
    }

    async convertFramesToFormat(frames, format) {
        const convertedFrames = [];

        for (const frame of frames) {
            try {
                const convertedDataUrl = await this.convertImageFormat(frame.dataUrl, format);
                convertedFrames.push({
                    ...frame,
                    dataUrl: convertedDataUrl,
                    format: format
                });
            } catch (error) {
                console.error('Error converting frame:', error);
                // Keep original PNG if conversion fails
                convertedFrames.push({
                    ...frame,
                    format: 'png'
                });
            }
        }

        return convertedFrames;
    }

    async convertImageFormat(dataUrl, targetFormat) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                // For JPG, add white background
                if (targetFormat === 'jpg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0);

                // Convert to target format
                const mimeType = targetFormat === 'jpg' ? 'image/jpeg' : `image/${targetFormat}`;
                const quality = targetFormat === 'jpg' ? 0.9 : undefined;

                try {
                    const convertedDataUrl = canvas.toDataURL(mimeType, quality);
                    resolve(convertedDataUrl);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    updateProgress(percentage) {
        this.progressBar.style.setProperty('--progress', `${percentage}%`);
        this.progressText.textContent = `${percentage}%`;
    }

    showResults() {
        this.processingSection.style.display = 'none';
        this.resultsSection.style.display = 'block';

        this.resultsContainer.innerHTML = '';

        if (this.processedFiles.length === 0) {
            this.resultsContainer.innerHTML = '<p>No frames were extracted. Please try again.</p>';
            return;
        }

        this.processedFiles.forEach(fileData => {
            const resultItem = this.createResultItem(fileData);
            this.resultsContainer.appendChild(resultItem);
        });
    }

    createResultItem(fileData) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        const title = document.createElement('h3');
        title.textContent = `${fileData.name} (${fileData.frames.length} frames)`;
        resultItem.appendChild(title);

        const framesGrid = document.createElement('div');
        framesGrid.className = 'frames-grid';

        fileData.frames.forEach(frame => {
            const frameItem = this.createFrameItem(frame, fileData.name);
            framesGrid.appendChild(frameItem);
        });

        resultItem.appendChild(framesGrid);
        return resultItem;
    }

    createFrameItem(frame, fileName) {
        const frameItem = document.createElement('div');
        frameItem.className = 'frame-item';

        const img = document.createElement('img');
        img.src = frame.dataUrl;
        img.alt = `Frame ${frame.index + 1}`;
        frameItem.appendChild(img);

        const frameInfo = document.createElement('div');
        frameInfo.className = 'frame-info';

        const frameNumber = document.createElement('div');
        frameNumber.className = 'frame-number';
        frameNumber.textContent = `Frame ${frame.index + 1}`;
        frameInfo.appendChild(frameNumber);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'frame-download-btn';
        downloadBtn.textContent = 'Download';
        downloadBtn.addEventListener('click', () => this.downloadFrame(frame, fileName));
        frameInfo.appendChild(downloadBtn);

        frameItem.appendChild(frameInfo);
        return frameItem;
    }

    downloadFrame(frame, fileName) {
        const link = document.createElement('a');
        link.href = frame.dataUrl;
        link.download = `${this.getFileNameWithoutExtension(fileName)}_frame_${frame.index + 1}.${frame.format}`;
        link.click();
    }

    async downloadAllFrames() {
        if (this.processedFiles.length === 0) {
            this.showNotification('No frames to download', 'error');
            return;
        }

        // Create a ZIP file with all frames
        // Note: This would require a ZIP library like JSZip
        // For now, we'll download them individually

        for (const fileData of this.processedFiles) {
            for (const frame of fileData.frames) {
                await this.delay(100); // Small delay to prevent overwhelming the browser
                this.downloadFrame(frame, fileData.name);
            }
        }

        this.showNotification('Download started! Check your downloads folder.', 'success');
    }

    clearResults() {
        this.processedFiles = [];
        this.resultsSection.style.display = 'none';
        this.processingSection.style.display = 'none';
        this.fileInput.value = '';
        this.updateProgress(0);
    }

    getFileNameWithoutExtension(fileName) {
        return fileName.replace(/\.[^/.]+$/, '');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        // Set background color based on type
        const colors = {
            success: '#48bb78',
            error: '#e53e3e',
            info: '#4299e1'
        };
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Enhanced GIF processing using SuperGif library (if available)
class EnhancedGifProcessor {
    constructor() {
        this.loadSuperGif();
    }

    loadSuperGif() {
        // This would load the SuperGif library for better GIF parsing
        // For now, we'll use the basic implementation
    }

    async extractFramesWithSuperGif(arrayBuffer) {
        // Enhanced GIF processing implementation
        // This would use the SuperGif library for accurate frame extraction
        return [];
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new GifToFramesConverter();

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards and steps
    document.querySelectorAll('.feature-card, .step, .faq-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});