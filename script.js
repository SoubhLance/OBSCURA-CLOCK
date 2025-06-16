class ObscuraClockPro {
    constructor() {
        this.currentMode = 'clock';
        this.is24HourFormat = false;
        this.soundEnabled = true;
        this.animationsEnabled = true;
        this.volume = 0.5;
        this.timezone = 'local';
        this.timerInterval = null;
        this.stopwatchInterval = null;
        this.timerTime = 0;
        this.totalTimerTime = 0;
        this.stopwatchTime = 0;
        this.timerRunning = false;
        this.stopwatchRunning = false;
        this.lapTimes = [];
        this.previousTime = '';
        this.alarms = [];
        
        this.initializeElements();
        this.bindEvents();
        this.startClock();
        this.createBackgroundAnimation();
        this.loadSettings();
        this.createAudioContext();
    }
    
    initializeElements() {
        this.timeDisplay = document.getElementById('timeDisplay');
        this.dateDisplay = document.getElementById('dateDisplay');
        this.timezoneDisplay = document.getElementById('timezoneDisplay');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.timerControls = document.getElementById('timerControls');
        this.stopwatchControls = document.getElementById('stopwatchControls');
        this.timerInput = document.getElementById('timerInput');
        this.timerPresets = document.getElementById('timerPresets');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.lapTimesContainer = document.getElementById('lapTimes');
        this.settingsToggle = document.getElementById('settingsToggle');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.notification = document.getElementById('notification');
        this.logo = document.getElementById('logo');
        
        // Settings elements
        this.themeSelect = document.getElementById('themeSelect');
        this.fontSelect = document.getElementById('fontSelect');
        this.timezoneSelect = document.getElementById('timezoneSelect');
        this.format12Btn = document.getElementById('format12');
        this.format24Btn = document.getElementById('format24');
        this.soundOnBtn = document.getElementById('soundOn');
        this.soundOffBtn = document.getElementById('soundOff');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.animOnBtn = document.getElementById('animOn');
        this.animOffBtn = document.getElementById('animOff');
    }
    
    bindEvents() {
        // Mode switching
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });
        
        // Timer controls
        document.getElementById('timerStart').addEventListener('click', () => this.startTimer());
        document.getElementById('timerPause').addEventListener('click', () => this.pauseTimer());
        document.getElementById('timerReset').addEventListener('click', () => this.resetTimer());
        
        // Timer presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setTimerPreset(parseInt(btn.dataset.time)));
        });
        
        // Stopwatch controls
        document.getElementById('stopwatchStart').addEventListener('click', () => this.startStopwatch());
        document.getElementById('stopwatchPause').addEventListener('click', () => this.pauseStopwatch());
        document.getElementById('stopwatchLap').addEventListener('click', () => this.lapStopwatch());
        document.getElementById('stopwatchReset').addEventListener('click', () => this.resetStopwatch());
        
        // Settings
        this.settingsToggle.addEventListener('click', () => this.toggleSettings());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.themeSelect.addEventListener('change', () => this.changeTheme());
        this.fontSelect.addEventListener('change', () => this.changeFont());
        this.timezoneSelect.addEventListener('change', () => this.changeTimezone());
        this.format12Btn.addEventListener('click', () => this.setTimeFormat(false));
        this.format24Btn.addEventListener('click', () => this.setTimeFormat(true));
        this.soundOnBtn.addEventListener('click', () => this.setSoundEnabled(true));
        this.soundOffBtn.addEventListener('click', () => this.setSoundEnabled(false));
        this.volumeSlider.addEventListener('input', () => this.setVolume());
        this.animOnBtn.addEventListener('click', () => this.setAnimationsEnabled(true));
        this.animOffBtn.addEventListener('click', () => this.setAnimationsEnabled(false));
        
        // Logo click for easter egg
        this.logo.addEventListener('click', () => this.logoEasterEgg());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Close settings when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.settingsPanel.contains(e.target) && !this.settingsToggle.contains(e.target)) {
                this.settingsPanel.classList.remove('open');
            }
        });
        
        // Visibility change detection for accurate timing
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateDisplay();
            }
        });
    }
    
    createAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume audio context if it's suspended
            if (this.audioContext.state === 'suspended') {
                document.addEventListener('click', () => {
                    this.audioContext.resume();
                }, { once: true });
            }
        } catch (error) {
            console.warn('Audio context not supported:', error);
            this.soundEnabled = false;
        }
    }
    
    playSound(frequency = 800, duration = 200, type = 'sine') {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }
    
    showNotification(message, duration = 3000) {
        this.notification.textContent = message;
        this.notification.classList.add('show');
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, duration);
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        
        // Update active button
        this.modeButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        // Hide all controls
        this.timerControls.classList.remove('active');
        this.stopwatchControls.classList.remove('active');
        this.timerInput.classList.remove('active');
        this.timerPresets.classList.remove('active');
        this.progressBar.classList.remove('active');
        this.lapTimesContainer.classList.remove('active');
        
        // Show relevant controls
        if (mode === 'timer') {
            this.timerControls.classList.add('active');
            this.timerInput.classList.add('active');
            this.timerPresets.classList.add('active');
            if (this.timerRunning) {
                this.progressBar.classList.add('active');
            }
        } else if (mode === 'stopwatch') {
            this.stopwatchControls.classList.add('active');
            if (this.lapTimes.length > 0) {
                this.lapTimesContainer.classList.add('active');
            }
        }
        
        this.playSound(600, 100);
        this.updateDisplay();
    }
    
    startClock() {
        this.clockInterval = setInterval(() => {
            if (this.currentMode === 'clock') {
                this.updateDisplay();
            }
            this.updateDateDisplay();
        }, 1000);
    }
    
    updateDisplay() {
        let displayTime = '';
        
        switch (this.currentMode) {
            case 'clock':
                displayTime = this.getCurrentTime();
                break;
            case 'timer':
                displayTime = this.formatTime(this.timerTime);
                this.updateProgressBar();
                break;
            case 'stopwatch':
                displayTime = this.formatTime(this.stopwatchTime);
                break;
            case 'alarm':
                displayTime = this.getCurrentTime();
                break;
        }
        
        if (this.animationsEnabled) {
            this.animateTimeChange(displayTime);
        } else {
            this.timeDisplay.textContent = displayTime;
        }
    }
    
    getCurrentTime() {
        const now = this.timezone === 'local' ? new Date() : new Date().toLocaleString("en-US", {timeZone: this.timezone});
        const date = new Date(now);
        
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        
        if (!this.is24HourFormat) {
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateDateDisplay() {
        const now = this.timezone === 'local' ? new Date() : new Date().toLocaleString("en-US", {timeZone: this.timezone});
        const date = new Date(now);
        
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        this.dateDisplay.textContent = date.toLocaleDateString('en-US', options);
        
        if (this.timezone !== 'local') {
            this.timezoneDisplay.textContent = `Timezone: ${this.timezone}`;
        } else {
            this.timezoneDisplay.textContent = '';
        }
    }
    
    formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    animateTimeChange(newTime) {
        if (this.previousTime !== newTime) {
            const digits = this.timeDisplay.querySelectorAll('.digit');
            digits.forEach(digit => {
                digit.classList.add('flip');
                setTimeout(() => digit.classList.remove('flip'), 600);
            });
            
            this.timeDisplay.innerHTML = this.wrapDigits(newTime);
            this.previousTime = newTime;
        }
    }
    
    wrapDigits(timeString) {
        return timeString.split('').map(char => 
            `<span class="digit-container"><span class="digit">${char}</span></span>`
        ).join('');
    }
    
    updateProgressBar() {
        if (this.timerRunning && this.totalTimerTime > 0) {
            const progress = ((this.totalTimerTime - this.timerTime) / this.totalTimerTime) * 100;
            this.progressFill.style.width = `${progress}%`;
        }
    }
    
    setTimerPreset(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        document.getElementById('timerHours').value = hours;
        document.getElementById('timerMinutes').value = minutes;
        document.getElementById('timerSeconds').value = remainingSeconds;
        
        this.playSound(500, 100);
        this.showNotification(`Timer preset: ${this.formatTime(seconds)}`);
    }
    
    // Timer functions
    startTimer() {
        if (!this.timerRunning) {
            if (this.timerTime === 0) {
                const hours = parseInt(document.getElementById('timerHours').value) || 0;
                const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
                const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
                this.timerTime = hours * 3600 + minutes * 60 + seconds;
                this.totalTimerTime = this.timerTime;
            }
            
            if (this.timerTime > 0) {
                this.timerRunning = true;
                this.progressBar.classList.add('active');
                this.playSound(800, 200);
                this.showNotification('Timer started!');
                
                this.timerInterval = setInterval(() => {
                    this.timerTime--;
                    this.updateDisplay();
                    
                    if (this.timerTime <= 0) {
                        this.timerComplete();
                    } else if (this.timerTime <= 10) {
                        this.playSound(1000, 100); // Countdown beep
                    }
                }, 1000);
            }
        }
    }
    
    pauseTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
        this.playSound(600, 150);
        this.showNotification('Timer paused');
    }
    
    resetTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
        this.timerTime = 0;
        this.totalTimerTime = 0;
        this.progressBar.classList.remove('active');
        this.progressFill.style.width = '0%';
        this.updateDisplay();
        this.playSound(400, 200);
        this.showNotification('Timer reset');
    }
    
    timerComplete() {
        this.resetTimer();
        this.playTimerAlarm();
        this.showNotification('⏰ Timer Complete!', 5000);
        
        // Flash the screen
        if (this.animationsEnabled) {
            document.body.style.animation = 'flash 0.5s ease-in-out 3';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 1500);
        }
    }
    
    playTimerAlarm() {
        if (!this.soundEnabled) return;
        
        let count = 0;
        const alarmInterval = setInterval(() => {
            this.playSound(1000, 500, 'square');
            count++;
            if (count >= 5) {
                clearInterval(alarmInterval);
            }
        }, 600);
    }
    
    // Stopwatch functions
    startStopwatch() {
        if (!this.stopwatchRunning) {
            this.stopwatchRunning = true;
            this.playSound(800, 200);
            this.showNotification('Stopwatch started!');
            
            this.stopwatchInterval = setInterval(() => {
                this.stopwatchTime++;
                this.updateDisplay();
            }, 1000);
        }
    }
    
    pauseStopwatch() {
        this.stopwatchRunning = false;
        clearInterval(this.stopwatchInterval);
        this.playSound(600, 150);
        this.showNotification('Stopwatch paused');
    }
    
    lapStopwatch() {
        if (this.stopwatchRunning) {
            const lapTime = this.formatTime(this.stopwatchTime);
            const lapNumber = this.lapTimes.length + 1;
            
            this.lapTimes.push({
                lap: lapNumber,
                time: lapTime,
                totalTime: this.stopwatchTime
            });
            
            this.updateLapDisplay();
            this.lapTimesContainer.classList.add('active');
            this.playSound(700, 100);
            this.showNotification(`Lap ${lapNumber}: ${lapTime}`);
        }
    }
    
    resetStopwatch() {
        this.stopwatchRunning = false;
        clearInterval(this.stopwatchInterval);
        this.stopwatchTime = 0;
        this.lapTimes = [];
        this.updateDisplay();
        this.updateLapDisplay();
        this.lapTimesContainer.classList.remove('active');
        this.playSound(400, 200);
        this.showNotification('Stopwatch reset');
    }
    
    updateLapDisplay() {
        this.lapTimesContainer.innerHTML = this.lapTimes
            .map((lap, index) => {
                const splitTime = index > 0 ? 
                    this.formatTime(lap.totalTime - this.lapTimes[index - 1].totalTime) : 
                    lap.time;
                
                return `
                    <div class="lap-time">
                        <span class="lap-number">Lap ${lap.lap}</span>
                        <span>${lap.time}</span>
                        <span style="opacity: 0.7; font-size: 0.9em;">(+${splitTime})</span>
                    </div>
                `;
            })
            .reverse()
            .join('');
    }
    
    // Settings functions
    toggleSettings() {
        this.settingsPanel.classList.toggle('open');
        this.playSound(500, 100);
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            this.showNotification('Entered fullscreen mode');
        } else {
            document.exitFullscreen();
            this.showNotification('Exited fullscreen mode');
        }
        this.playSound(600, 150);
    }
    
    changeTheme() {
        const theme = this.themeSelect.value;
        document.body.className = document.body.className.replace(/theme-\w+/, `theme-${theme}`);
        this.saveSettings();
        this.playSound(500, 100);
        this.showNotification(`Theme changed to ${theme}`);
    }
    
    changeFont() {
        const font = this.fontSelect.value;
        document.body.className = document.body.className.replace(/font-\w+/, `font-${font}`);
        this.saveSettings();
        this.playSound(500, 100);
        this.showNotification(`Font changed to ${font}`);
    }
    
    changeTimezone() {
        this.timezone = this.timezoneSelect.value;
        this.updateDisplay();
        this.updateDateDisplay();
        this.saveSettings();
        this.playSound(500, 100);
        this.showNotification(`Timezone changed to ${this.timezone}`);
    }
    
    setTimeFormat(is24Hour) {
        this.is24HourFormat = is24Hour;
        this.format12Btn.classList.toggle('active', !is24Hour);
        this.format24Btn.classList.toggle('active', is24Hour);
        if (this.currentMode === 'clock') {
            this.updateDisplay();
        }
        this.saveSettings();
        this.playSound(500, 100);
        this.showNotification(`Time format: ${is24Hour ? '24-hour' : '12-hour'}`);
    }
    
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        this.soundOnBtn.classList.toggle('active', enabled);
        this.soundOffBtn.classList.toggle('active', !enabled);
        this.saveSettings();
        if (enabled) {
            this.playSound(800, 200);
        }
        this.showNotification(`Sound ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    setVolume() {
        this.volume = this.volumeSlider.value / 100;
        this.saveSettings();
        this.playSound(600, 150);
    }
    
    setAnimationsEnabled(enabled) {
        this.animationsEnabled = enabled;
        this.animOnBtn.classList.toggle('active', enabled);
        this.animOffBtn.classList.toggle('active', !enabled);
        this.saveSettings();
        this.playSound(500, 100);
        this.showNotification(`Animations ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.switchMode('clock');
                    break;
                case '2':
                    e.preventDefault();
                    this.switchMode('timer');
                    break;
                case '3':
                    e.preventDefault();
                    this.switchMode('stopwatch');
                    break;
                case '4':
                    e.preventDefault();
                    this.switchMode('alarm');
                    break;
            }
        }
        
        if (e.key === ' ') {
            e.preventDefault();
            if (this.currentMode === 'timer') {
                if (this.timerRunning) {
                    this.pauseTimer();
                } else {
                    this.startTimer();
                }
            } else if (this.currentMode === 'stopwatch') {
                if (this.stopwatchRunning) {
                    this.pauseStopwatch();
                } else {
                    this.startStopwatch();
                }
            }
        }
        
        if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (this.currentMode === 'timer') {
                this.resetTimer();
            } else if (this.currentMode === 'stopwatch') {
                this.resetStopwatch();
            }
        }
        
        if (e.key === 'l' && this.currentMode === 'stopwatch') {
            e.preventDefault();
            this.lapStopwatch();
        }
        
        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreen();
        }
    }
    
    logoEasterEgg() {
        const messages = [
            "Time flies when you're having fun! ⏰",
            "Every second counts! ⚡",
            "Time is precious, use it wisely! 💎",
            "Tick tock, tick tock... ⏱️",
            "Time waits for no one! 🏃‍♂️"
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.showNotification(randomMessage);
        this.playSound(800, 300, 'triangle');
        
        // Rainbow effect
        this.logo.style.animation = 'gradientShift 0.5s ease-in-out';
        setTimeout(() => {
            this.logo.style.animation = 'gradientShift 4s ease-in-out infinite';
        }, 500);
    }
    
    createBackgroundAnimation() {
        const container = document.getElementById('backgroundAnimation');
        
        for (let i = 0; i < 60; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 15 + 20) + 's';
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            container.appendChild(particle);
        }
    }
    
    saveSettings() {
        const settings = {
            theme: this.themeSelect.value,
            font: this.fontSelect.value,
            timezone: this.timezone,
            is24Hour: this.is24HourFormat,
            soundEnabled: this.soundEnabled,
            volume: this.volume,
            animationsEnabled: this.animationsEnabled
        };
        
        localStorage.setItem('obscuraClockSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('obscuraClockSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            
            this.themeSelect.value = settings.theme || 'midnight';
            this.fontSelect.value = settings.font || 'digital';
            this.timezone = settings.timezone || 'local';
            this.timezoneSelect.value = this.timezone;
            this.is24HourFormat = settings.is24Hour || false;
            this.soundEnabled = settings.soundEnabled !== false;
            this.volume = settings.volume || 0.5;
            this.animationsEnabled = settings.animationsEnabled !== false;
            
            // Apply settings
            this.changeTheme();
            this.changeFont();
            this.setTimeFormat(this.is24HourFormat);
            this.setSoundEnabled(this.soundEnabled);
            this.volumeSlider.value = this.volume * 100;
            this.setAnimationsEnabled(this.animationsEnabled);
        }
    }
}

// Initialize the clock when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ObscuraClockPro();
});
