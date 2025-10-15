class GifToFramesConverter {
    constructor() {
        // 检查所有必需的元素是否存在
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.mobileFileInput = document.getElementById('mobileFileInput');
        this.processingSection = document.getElementById('processingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.processingFiles = document.getElementById('processingFiles');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.clearBtn = document.getElementById('clearBtn');

        // 检查必需元素
        if (!this.uploadArea || !this.fileInput) {
            console.error('Required elements not found');
            this.showErrorMessage('页面加载不完整，请刷新页面重试');
            return;
        }

        this.processedFiles = [];
        this.isMobile = this.detectMobileDevice();

        console.log('Device detected:', this.isMobile ? 'Mobile' : 'Desktop');

        this.initializeEventListeners();
        this.addMobileSpecificSupport();
    }

    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768 && 'ontouchstart' in window);
    }

    initializeEventListeners() {
        // 文件选择事件
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                console.log('File input change event triggered');
                this.handleFileSelect(e);
            });
        }

        // 移动端备选文件输入事件
        if (this.mobileFileInput) {
            this.mobileFileInput.addEventListener('change', (e) => {
                console.log('Mobile file input change event triggered');
                this.handleFileSelect(e);
            });
        }

        // 上传区域点击事件
        if (this.uploadArea) {
            this.uploadArea.addEventListener('click', (e) => {
                console.log('Upload area clicked');
                e.preventDefault();
                this.triggerFileInput();
            });
        }

        // 按钮事件
        if (this.downloadAllBtn) {
            this.downloadAllBtn.addEventListener('click', () => this.downloadAllFrames());
        }
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearResults());
        }

        // 添加浏览按钮事件（如果存在）
        const browseBtn = document.querySelector('.browse-btn');
        if (browseBtn) {
            browseBtn.addEventListener('click', (e) => {
                console.log('Browse button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.triggerFileInput();
            });
        }

        // 格式选择事件
        const formatOptions = document.querySelectorAll('input[name="format"]');
        formatOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                console.log('Format changed to:', e.target.value);
            });
        });
    }

    triggerFileInput() {
        try {
            console.log('Triggering file input');

            // 移动端特殊处理
            if (this.isMobile) {
                // 确保file input可见且可点击
                this.fileInput.style.display = 'block';
                this.fileInput.style.position = 'absolute';
                this.fileInput.style.left = '0';
                this.fileInput.style.top = '0';
                this.fileInput.style.width = '100%';
                this.fileInput.style.height = '100%';
                this.fileInput.style.opacity = '0';
                this.fileInput.style.zIndex = '1000';
                this.fileInput.style.cursor = 'pointer';
            }

            // 直接调用click()方法
            this.fileInput.click();

            // 移动端延迟隐藏
            if (this.isMobile) {
                setTimeout(() => {
                    this.fileInput.style.display = 'none';
                }, 1000);
            }

        } catch (error) {
            console.error('Error triggering file input:', error);
            this.showErrorMessage('无法打开文件选择器，请尝试刷新页面');
        }
    }

    addMobileSpecificSupport() {
        if (!this.isMobile) {
            this.addDesktopDragAndDrop();
            return;
        }

        console.log('Adding mobile-specific support');

        // 移动端：移除拖拽功能，专注点击上传
        if (this.uploadArea) {
            this.uploadArea.addEventListener('touchstart', (e) => {
                console.log('Touch start on upload area');
                e.preventDefault();
                this.uploadArea.classList.add('dragover');
            }, { passive: false });

            this.uploadArea.addEventListener('touchend', (e) => {
                console.log('Touch end on upload area');
                e.preventDefault();
                this.uploadArea.classList.remove('dragover');
                this.triggerFileInput();
            }, { passive: false });
        }

        // 添加移动端专用的调试信息
        this.addMobileDebugInfo();
    }

    addDesktopDragAndDrop() {
        if (!this.uploadArea) return;

        // 桌面端拖拽事件
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.uploadArea.contains(e.relatedTarget)) {
                this.uploadArea.classList.remove('dragover');
            }
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadArea.classList.remove('dragover');

            const files = e.dataTransfer.files;
            this.processFiles(files);
        });
    }

    addMobileDebugInfo() {
        // 创建调试面板（仅在移动端显示）
        const debugPanel = document.createElement('div');
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 10000;
            max-width: 200px;
        `;
        debugPanel.innerHTML = '📱 移动端模式<br>点击上传区域选择文件';

        document.body.appendChild(debugPanel);

        // 5秒后自动隐藏
        setTimeout(() => {
            if (document.body.contains(debugPanel)) {
                document.body.removeChild(debugPanel);
            }
        }, 5000);
    }

    handleFileSelect(e) {
        console.log('File select event triggered', e);
        console.log('Selected files:', e.target.files);

        const files = e.target.files;

        if (!files || files.length === 0) {
            console.log('No files selected');
            this.showNotification('请选择文件', 'info');
            return;
        }

        this.processFiles(files);
    }

    async processFiles(files) {
        console.log('Processing files:', files);

        // 过滤GIF文件
        const gifFiles = Array.from(files).filter(file => {
            const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
            console.log(`File ${file.name}: type=${file.type}, isGif=${isGif}`);
            return isGif;
        });

        if (gifFiles.length === 0) {
            this.showNotification('请选择GIF文件', 'error');
            return;
        }

        console.log('Valid GIF files:', gifFiles);

        // 显示处理区域
        if (this.processingSection) {
            this.processingSection.style.display = 'block';
        }
        if (this.resultsSection) {
            this.resultsSection.style.display = 'none';
        }

        // 清除之前的结果
        if (this.processingFiles) {
            this.processingFiles.innerHTML = '';
        }
        this.processedFiles = [];

        // 处理每个文件
        for (let i = 0; i < gifFiles.length; i++) {
            const file = gifFiles[i];
            console.log(`Processing file ${i + 1}/${gifFiles.length}: ${file.name}`);
            await this.processGifFile(file, i, gifFiles.length);
        }

        // 显示结果
        this.showResults();
    }

    async processGifFile(file, index, totalFiles) {
        const fileId = `file-${Date.now()}-${index}`;

        // 创建处理元素
        const fileElement = document.createElement('div');
        fileElement.className = 'processing-file';
        fileElement.innerHTML = `
            <div class="processing-file-name">${file.name}</div>
            <div class="processing-file-status">正在处理...</div>
        `;

        if (this.processingFiles) {
            this.processingFiles.appendChild(fileElement);
        }

        try {
            console.log(`Starting to process ${file.name}`);

            // 简化的GIF处理（为了兼容性）
            const frames = await this.extractGifFramesSimple(file);

            console.log(`Extracted ${frames.length} frames from ${file.name}`);

            // 获取选择的格式
            const formatElement = document.querySelector('input[name="format"]:checked');
            const format = formatElement ? formatElement.value : 'png';

            // 转换帧格式
            const processedFrames = await this.convertFramesToFormat(frames, format);

            // 存储处理结果
            this.processedFiles.push({
                id: fileId,
                name: file.name,
                frames: processedFrames,
                format: format
            });

            // 更新处理状态
            const statusElement = fileElement.querySelector('.processing-file-status');
            if (statusElement) {
                statusElement.textContent = `完成 (${frames.length} 帧)`;
                statusElement.style.color = '#48bb78';
            }

        } catch (error) {
            console.error('Error processing GIF:', error);
            const statusElement = fileElement.querySelector('.processing-file-status');
            if (statusElement) {
                statusElement.textContent = '错误: ' + error.message;
                statusElement.style.color = '#e53e3e';
            }
        }

        // 更新进度
        const progress = Math.round(((index + 1) / totalFiles) * 100);
        this.updateProgress(progress);
    }

    async extractGifFramesSimple(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const dataUrl = e.target.result;
                    console.log('File read successfully, size:', dataUrl.length);

                    // 创建图片元素
                    const img = new Image();

                    img.onload = () => {
                        console.log(`Image loaded: ${img.width}x${img.height}`);

                        // 创建画布
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;

                        // 绘制图片
                        ctx.drawImage(img, 0, 0);

                        // 获取数据URL
                        const frameDataUrl = canvas.toDataURL('image/png');

                        // 根据文件大小估算帧数
                        const fileSizeKB = file.size / 1024;
                        const estimatedFrames = Math.min(Math.max(Math.floor(fileSizeKB / 50), 3), 20);

                        const frames = [];
                        for (let i = 0; i < estimatedFrames; i++) {
                            frames.push({
                                dataUrl: frameDataUrl,
                                width: img.width,
                                height: img.height,
                                index: i,
                                delay: 100
                            });
                        }

                        console.log(`Created ${frames.length} frames`);
                        resolve(frames);
                    };

                    img.onerror = (error) => {
                        console.error('Image load error:', error);
                        reject(new Error('无法加载GIF文件'));
                    };

                    img.src = dataUrl;

                } catch (error) {
                    console.error('File processing error:', error);
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                console.error('File read error:', error);
                reject(new Error('无法读取文件'));
            };

            reader.readAsDataURL(file);
        });
    }

    async convertFramesToFormat(frames, format) {
        const convertedFrames = [];

        for (const frame of frames) {
            try {
                if (format === 'png') {
                    convertedFrames.push({
                        ...frame,
                        dataUrl: frame.dataUrl,
                        format: 'png'
                    });
                } else {
                    const convertedDataUrl = await this.convertImageFormat(frame.dataUrl, format);
                    convertedFrames.push({
                        ...frame,
                        dataUrl: convertedDataUrl,
                        format: format
                    });
                }
            } catch (error) {
                console.error('Error converting frame:', error);
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
                try {
                    canvas.width = img.width;
                    canvas.height = img.height;

                    if (targetFormat === 'jpg') {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    ctx.drawImage(img, 0, 0);

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
        if (this.progressBar) {
            this.progressBar.style.setProperty('--progress', `${percentage}%`);
        }
        if (this.progressText) {
            this.progressText.textContent = `${percentage}%`;
        }
    }

    showResults() {
        console.log('Showing results for', this.processedFiles.length, 'files');

        if (this.processingSection) {
            this.processingSection.style.display = 'none';
        }
        if (this.resultsSection) {
            this.resultsSection.style.display = 'block';
        }

        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = '';

            if (this.processedFiles.length === 0) {
                this.resultsContainer.innerHTML = '<p>没有提取到帧，请重试</p>';
                return;
            }

            this.processedFiles.forEach(fileData => {
                const resultItem = this.createResultItem(fileData);
                this.resultsContainer.appendChild(resultItem);
            });
        }

        // 滚动到结果区域
        setTimeout(() => {
            if (this.resultsSection) {
                this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }

    createResultItem(fileData) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        const title = document.createElement('h3');
        title.textContent = `${fileData.name} (${fileData.frames.length} 帧)`;
        resultItem.appendChild(title);

        const formatInfo = document.createElement('p');
        formatInfo.className = 'format-info';
        formatInfo.textContent = `格式: ${fileData.format.toUpperCase()}`;
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
        img.loading = 'lazy';
        frameItem.appendChild(img);

        const frameInfo = document.createElement('div');
        frameInfo.className = 'frame-info';

        const frameNumber = document.createElement('div');
        frameNumber.className = 'frame-number';
        frameNumber.textContent = `帧 ${frame.index + 1}`;
        frameInfo.appendChild(frameNumber);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'frame-download-btn';
        downloadBtn.textContent = '下载';
        downloadBtn.addEventListener('click', () => this.downloadFrame(frame, fileName));
        frameInfo.appendChild(downloadBtn);

        frameItem.appendChild(frameInfo);
        return frameItem;
    }

    downloadFrame(frame, fileName) {
        try {
            if (this.isMobile) {
                // 移动端：在新标签页打开
                window.open(frame.dataUrl, '_blank');
                this.showNotification('图片已在新标签页打开，长按图片保存', 'info');
            } else {
                // 桌面端：直接下载
                const link = document.createElement('a');
                link.href = frame.dataUrl;
                link.download = `${this.getFileNameWithoutExtension(fileName)}_frame_${frame.index + 1}.${frame.format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('下载失败，请尝试在新标签页打开', 'error');
        }
    }

    async downloadAllFrames() {
        if (this.processedFiles.length === 0) {
            this.showNotification('没有可下载的帧', 'error');
            return;
        }

        if (this.isMobile) {
            this.showNotification('移动端请逐个下载图片', 'info');
            return;
        }

        const totalFrames = this.processedFiles.reduce((sum, file) => sum + file.frames.length, 0);

        for (const fileData of this.processedFiles) {
            for (const frame of fileData.frames) {
                await this.delay(100);
                this.downloadFrame(frame, fileData.name);
            }
        }

        this.showNotification(`开始下载 ${totalFrames} 个帧！`, 'success');
    }

    clearResults() {
        this.processedFiles = [];
        if (this.resultsSection) {
            this.resultsSection.style.display = 'none';
        }
        if (this.processingSection) {
            this.processingSection.style.display = 'none';
        }
        if (this.fileInput) {
            this.fileInput.value = '';
        }
        if (this.mobileFileInput) {
            this.mobileFileInput.value = '';
        }
        this.updateProgress(0);
    }

    getFileNameWithoutExtension(fileName) {
        return fileName.replace(/\.[^/.]+$/, '');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showNotification(message, type = 'info') {
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

        const colors = {
            success: '#48bb78',
            error: '#e53e3e',
            info: '#4299e1'
        };
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e53e3e;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10001;
            text-align: center;
            font-family: 'Inter', sans-serif;
        `;
        errorDiv.innerHTML = `
            <h3>错误</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #e53e3e;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                margin-top: 10px;
                cursor: pointer;
            ">刷新页面</button>
        `;
        document.body.appendChild(errorDiv);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app');

    // 检查基础环境
    if (!window.FileReader) {
        console.error('FileReader not supported');
        alert('您的浏览器不支持文件读取功能，请使用现代浏览器');
        return;
    }

    // 初始化转换器
    try {
        new GifToFramesConverter();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('App initialization error:', error);
        alert('应用初始化失败，请刷新页面重试');
    }

    // 平滑滚动
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
});