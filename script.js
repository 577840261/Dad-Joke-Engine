class DadJokeEngine {
    constructor() {
        this.apiKey = 'sk-0340d946851046c1a0cef9cc7d435276';
        this.baseUrl = 'https://api.deepseek.com/v1';
        this.model = 'deepseek-chat';
        this.selectedJoke = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateTimestamp();
    }

    bindEvents() {
        document.getElementById('generateBtn').addEventListener('click', () => this.generateJokes());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadImage());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyText());
    }

    async generateJokes() {
        const keywords = document.getElementById('keywords').value.trim();
        const jokeType = document.getElementById('jokeType').value;

        if (!keywords) {
            alert('请输入关键词！');
            return;
        }

        this.showLoading(true);
        this.hideResults();

        try {
            const jokes = await this.callAI(keywords, jokeType);
            this.displayJokes(jokes);
        } catch (error) {
            console.error('生成笑话失败: - script.js:37', error);
            alert('生成失败，请稍后重试！');
        } finally {
            this.showLoading(false);
        }
    }

    async callAI(keywords, jokeType) {
        const prompt = this.buildPrompt(keywords, jokeType);
        
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的中文冷笑话创作者，擅长创造有趣、幽默且适合社交分享的笑话。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.9,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        return this.parseJokes(data.choices[0].message.content);
    }

    buildPrompt(keywords, jokeType) {
        const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
        
        return `请基于关键词"${keywordList.join('、')}"创作3个${jokeType}类型的中文冷笑话。

要求：
1. 每个笑话都要包含至少一个关键词
2. 适合社交媒体分享，长度控制在50字以内
3. 幽默有趣，容易理解
4. 避免敏感内容

请按以下格式输出：
1. [笑话内容]
2. [笑话内容]  
3. [笑话内容]`;
    }

    parseJokes(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const jokes = [];
        
        for (const line of lines) {
            const match = line.match(/^\d+\.\s*(.+)$/);
            if (match) {
                jokes.push(match[1].trim());
            }
        }
        
        return jokes.length > 0 ? jokes : [content.trim()];
    }

    displayJokes(jokes) {
        const jokesList = document.getElementById('jokesList');
        jokesList.innerHTML = '';

        jokes.forEach((joke, index) => {
            const jokeItem = document.createElement('div');
            jokeItem.className = 'joke-item';
            jokeItem.innerHTML = `
                <div class="joke-text">${joke}</div>
                <div class="joke-rating">
                    <span>笑话 #${index + 1}</span>
                    <button class="select-btn">选择这个</button>
                </div>
            `;
            
            const selectBtn = jokeItem.querySelector('.select-btn');
            selectBtn.addEventListener('click', () => this.selectJoke(joke));
            
            jokesList.appendChild(jokeItem);
        });

        this.showResults();
    }

    selectJoke(joke) {
        this.selectedJoke = joke;
        document.getElementById('selectedJoke').textContent = joke;
        this.updateTimestamp();
        this.showShareSection();

        // 高亮选中的笑话
        document.querySelectorAll('.joke-item').forEach(item => {
            item.classList.remove('selected');
            if (item.querySelector('.joke-text').textContent === joke) {
                item.classList.add('selected');
            }
        });

        // 自动生成并下载图片
        setTimeout(() => this.downloadImage(), 500);
    }

    async downloadImage() {
        if (!this.selectedJoke) {
            alert('请先选择一个笑话！');
            return;
        }

        try {
            const shareCard = document.getElementById('shareCard');
            const canvas = await html2canvas(shareCard, {
                backgroundColor: null,
                scale: 2,
                useCORS: true
            });

            const link = document.createElement('a');
            link.download = `冷笑话_${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (error) {
            console.error('下载失败: - script.js:170', error);
            alert('下载失败，请稍后重试！');
        }
    }

    copyText() {
        if (!this.selectedJoke) {
            alert('请先选择一个笑话！');
            return;
        }

        navigator.clipboard.writeText(this.selectedJoke).then(() => {
            alert('笑话已复制到剪贴板！');
        }).catch(() => {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = this.selectedJoke;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('笑话已复制到剪贴板！');
        });
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.classList.toggle('hidden', !show);
        document.getElementById('generateBtn').disabled = show;
    }

    showResults() {
        document.getElementById('resultsSection').classList.remove('hidden');
    }

    hideResults() {
        document.getElementById('resultsSection').classList.add('hidden');
        document.getElementById('shareSection').classList.add('hidden');
    }

    showShareSection() {
        document.getElementById('shareSection').classList.remove('hidden');
    }

    updateTimestamp() {
        const now = new Date();
        const timestamp = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('timestamp').textContent = timestamp;
    }
}

// 初始化应用
const dadJokeEngine = new DadJokeEngine();