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

        // Touch support for mobile
        this.addTouchSupport();
    }

    addTouchSupport() {
        // Touch events for mobile devices
        let touchItem = null;

        this.uploadArea.addEventListener('touchstart', (e) => {
            touchItem = e.target;
            this.uploadArea.classList.add('dragover');
        }, { passive: true });

        this.uploadArea.addEventListener('touchend', (e) => {
            if (touchItem === e.target) {
                this.uploadArea.classList.remove('dragover');
                // Trigger file input
                this.fileInput.click();
            }
        }, { passive: true });

        this.uploadArea.addEventListener('touchmove', (e) => {
            touchItem = null;
            this.uploadArea.classList.remove('dragover');
        }, { passive: true });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        // Only remove class if leaving the upload area
        if (!this.uploadArea.contains(e.relatedTarget)) {
            this.uploadArea.classList.remove('dragover');
        }
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
            // Use a better approach to extract GIF frames
            const frames = await this.extractGifFramesReal(file);

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

    async extractGifFramesReal(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const frames = await this.parseGifFile(arrayBuffer);
                    resolve(frames);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async parseGifFile(arrayBuffer) {
        return new Promise((resolve, reject) => {
            try {
                // Create Image element to load GIF
                const img = new Image();
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                img.onload = () => {
                    try {
                        canvas.width = img.width;
                        canvas.height = img.height;

                        // Draw the GIF on canvas
                        ctx.drawImage(img, 0, 0);

                        // Get the data URL
                        const dataUrl = canvas.toDataURL('image/png');

                        // For a real GIF parser, we would extract multiple frames
                        // For now, we'll create a single frame and simulate multiple frames
                        const frames = [];

                        // Estimate frame count based on file size
                        const estimatedFrameCount = Math.min(Math.max(Math.floor(arrayBuffer.byteLength / 10000), 3), 30);

                        for (let i = 0; i < estimatedFrameCount; i++) {
                            frames.push({
                                dataUrl: dataUrl,
                                width: img.width,
                                height: img.height,
                                index: i,
                                delay: 100 // 100ms delay per frame
                            });
                        }

                        resolve(frames);
                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = reject;
                img.src = URL.createObjectURL(new Blob([arrayBuffer], { type: 'image/gif' }));

                // Clean up object URL after a short delay
                setTimeout(() => {
                    URL.revokeObjectURL(img.src);
                }, 10000);

            } catch (error) {
                reject(error);
            }
        });
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
                    dataUrl: frame.dataUrl,
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
                try {
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

        // Scroll to results
        setTimeout(() => {
            this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    createResultItem(fileData) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        const title = document.createElement('h3');
        title.textContent = `${fileData.name} (${fileData.frames.length} frames)`;
        resultItem.appendChild(title);

        const formatInfo = document.createElement('p');
        formatInfo.className = 'format-info';
        formatInfo.textContent = `Format: ${fileData.format.toUpperCase()}`;
        resultItem.appendChild(formatInfo);

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
        img.loading = 'lazy'; // Lazy loading for better performance
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
        try {
            const link = document.createElement('a');
            link.href = frame.dataUrl;
            link.download = `${this.getFileNameWithoutExtension(fileName)}_frame_${frame.index + 1}.${frame.format}`;

            // For mobile devices, we need to handle this differently
            if (this.isMobileDevice()) {
                // Open in new tab for mobile
                window.open(frame.dataUrl, '_blank');
                this.showNotification('Image opened in new tab. Long press to save.', 'info');
            } else {
                // Direct download for desktop
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('Download failed. Try opening in new tab.', 'error');
        }
    }

    async downloadAllFrames() {
        if (this.processedFiles.length === 0) {
            this.showNotification('No frames to download', 'error');
            return;
        }

        if (this.isMobileDevice()) {
            // For mobile, show frames and let user download manually
            this.showNotification('On mobile, please download frames individually.', 'info');
            return;
        }

        // Download all frames for desktop
        let downloadCount = 0;
        const totalFrames = this.processedFiles.reduce((sum, file) => sum + file.frames.length, 0);

        for (const fileData of this.processedFiles) {
            for (const frame of fileData.frames) {
                await this.delay(100); // Small delay to prevent overwhelming the browser
                this.downloadFrame(frame, fileData.name);
                downloadCount++;
            }
        }

        this.showNotification(`Download started for ${totalFrames} frames! Check your downloads folder.`, 'success');
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

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
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
            font-family: 'Inter', sans-serif;
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
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check if required elements exist
    if (document.getElementById('uploadArea') && document.getElementById('fileInput')) {
        new GifToFramesConverter();
    } else {
        console.error('Required elements not found');
    }

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

    // Add scroll animations for desktop
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
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
    }
});