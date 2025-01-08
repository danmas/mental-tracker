// keepAlive.js

class ServerKeepAlive {
    constructor(options = {}) {
        this.interval = options.interval || 40000;
        this.pingUrl = options.pingUrl || '/ping';
        this.enabled = false;
        this.pingInterval = null;
        this.lastPingTime = null;
        this.retryCount = 0;
        this.maxRetries = options.maxRetries || 3;
        this.serverStatus = 'unknown'; // 'active', 'inactive', 'unknown'
        
        // Создаем и добавляем индикатор на страницу
        this.createStatusIndicator();
    }

    createStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'server-status-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background-color: #808080;
            border: 2px solid white;
            box-shadow: 0 0 5px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        // Добавляем тултип
        const tooltip = document.createElement('div');
        tooltip.id = 'server-status-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            top: 35px;
            right: 10px;
            background-color: #333;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            display: none;
            white-space: nowrap;
            z-index: 1000;
        `;
        
        // Обработчики для тултипа
        indicator.addEventListener('mouseenter', () => {
            this.updateTooltip();
            tooltip.style.display = 'block';
        });
        
        indicator.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });

        document.body.appendChild(indicator);
        document.body.appendChild(tooltip);
    }

    updateStatus(status) {
        this.serverStatus = status;
        const indicator = document.getElementById('server-status-indicator');
        if (!indicator) return;

        switch (status) {
            case 'active':
                indicator.style.backgroundColor = '#4CAF50'; // Зеленый
                break;
            case 'inactive':
                indicator.style.backgroundColor = '#f44336'; // Красный
                break;
            default:
                indicator.style.backgroundColor = '#808080'; // Серый
        }

        this.updateTooltip();
    }

    updateTooltip() {
        const tooltip = document.getElementById('server-status-tooltip');
        if (!tooltip) return;

        const lastPingTimeStr = this.lastPingTime 
            ? new Date(this.lastPingTime).toLocaleTimeString()
            : 'нет данных';

        tooltip.textContent = `Статус сервера: ${this.getStatusText()}
Последний пинг: ${lastPingTimeStr}`;
    }

    getStatusText() {
        switch (this.serverStatus) {
            case 'active':
                return 'Активен';
            case 'inactive':
                return 'Не активен';
            default:
                return 'Неизвестно';
        }
    }

    start() {
        if (this.enabled) return;

        this.enabled = true;
        this.ping(); // Первый пинг сразу
        this.pingInterval = setInterval(() => this.ping(), this.interval);
        console.log('KeepAlive: Started');
    }

    stop() {
        this.enabled = false;
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        this.updateStatus('inactive');
        console.log('KeepAlive: Stopped');
    }

    async ping() {
        try {
            const response = await fetch(this.pingUrl);
            if (response.ok) {
                this.lastPingTime = new Date();
                this.retryCount = 0;
                this.updateStatus('active');
                // console.log('KeepAlive: Server is alive');
            } else {
                this.handleError('Server returned error status');
            }
        } catch (error) {
            this.handleError(error.message);
        }
    }

    handleError(message) {
        this.retryCount++;
        this.updateStatus('inactive');
        console.warn(`KeepAlive: Ping failed (${this.retryCount}/${this.maxRetries}): ${message}`);
        
        if (this.retryCount >= this.maxRetries) {
            console.error('KeepAlive: Max retries reached, stopping ping');
            this.stop();
        }
    }

    getStatus() {
        return {
            enabled: this.enabled,
            lastPing: this.lastPingTime,
            retryCount: this.retryCount,
            serverStatus: this.serverStatus
        };
    }
}

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServerKeepAlive;
}