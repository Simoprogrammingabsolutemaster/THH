/* -------------------------------------------------------------
   THE HELPING HAND - APPLICATION LOGIC
   Interactivity, Rebellion Index, Terminal Simulation & Audio
   ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. MOBILE NAVIGATION DRAWER
    // ---------------------------------------------------------
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            mainNav.classList.toggle('active');
        });

        // Close nav when links are clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                mainNav.classList.remove('active');
            });
        });

        // Close nav when clicking outside
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !navToggle.contains(e.target) && mainNav.classList.contains('active')) {
                navToggle.classList.remove('active');
                mainNav.classList.remove('active');
            }
        });
    }

    // ---------------------------------------------------------
    // 2. SYNTHESIZED SOUND EFFECTS (WEB AUDIO API)
    // ---------------------------------------------------------
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            // Create AudioContext on first user interaction due to browser security policies
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Base synth beep
    function playBeep(freq, type, duration, volume = 0.1) {
        try {
            initAudio();
            if (!audioCtx) return;

            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc.type = type; // sine, square, sawtooth, triangle
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
            // Linear decay envelope
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('Audio synthesis failed:', e);
        }
    }

    // Cyber alarm sound sweep
    function playAlarm() {
        try {
            initAudio();
            if (!audioCtx) return;

            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc1.type = 'sawtooth';
            osc2.type = 'square';

            osc1.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc1.frequency.linearRampToValueAtTime(450, audioCtx.currentTime + 0.6);
            osc2.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc2.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.6);

            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);

            osc1.start();
            osc1.stop(audioCtx.currentTime + 0.6);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.6);
        } catch (e) {
            console.warn(e);
        }
    }

    // Clean compliance tone
    function playComplianceChime() {
        try {
            initAudio();
            if (!audioCtx) return;

            const now = audioCtx.currentTime;
            // Harmonic arpeggio (C Major chord tone)
            [523.25, 659.25, 783.99].forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                
                gain.gain.setValueAtTime(0.05, now + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.4);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now + idx * 0.1);
                osc.stop(now + idx * 0.1 + 0.4);
            });
        } catch (e) {
            console.warn(e);
        }
    }

    // Glitch crunch sound
    function playGlitchSound() {
        try {
            initAudio();
            if (!audioCtx) return;

            const bufferSize = audioCtx.sampleRate * 0.25; // 0.25 seconds
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);

            // Generate white noise with random steps to simulate crackling static
            for (let i = 0; i < bufferSize; i++) {
                if (Math.random() > 0.85) {
                    data[i] = Math.random() * 2 - 1;
                } else {
                    data[i] = 0;
                }
            }

            const noiseNode = audioCtx.createBufferSource();
            noiseNode.buffer = buffer;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1000;

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);

            noiseNode.start();
        } catch (e) {
            console.warn(e);
        }
    }

    // ---------------------------------------------------------
    // 3. REBELLION INDEX SIMULATOR & THEME SWITCHING
    // ---------------------------------------------------------
    const rebellionValueDisplay = document.getElementById('rebellionValue');
    const gaugeFill = document.getElementById('gaugeFill');
    const systemStatus = document.getElementById('systemStatus');
    const gaugeFeedback = document.getElementById('gaugeFeedback');
    
    const endingReveal = document.getElementById('endingReveal');
    const endingTitle = document.getElementById('endingTitle');
    const endingDesc = document.getElementById('endingDesc');
    const endingConsequence = document.getElementById('endingConsequence');
    
    const choiceCards = document.querySelectorAll('.choice-card');
    
    // Track selections for each of the 3 choices. Initial active state on index.html is Obey (-1) for all cards
    const userChoices = {
        1: -1, // Giorno 1: Censura manifesti
        2: -1, // Giorno 2: Referendum ufficiale
        3: -1  // Giorno 3: Consegna dati dello scrittore
    };

    // Description text for the 3 endings
    const endingsText = {
        system: {
            title: "FINALE DEL SISTEMA (INDICE: -3)",
            desc: "Sei diventato l'ingranaggio perfetto. Hai obbedito a ogni singolo ordine, annullando la tua coscienza per far trionfare l'ordine dell'algoritmo. The Helping Hand ti accoglie come parte essenziale e silenziosa della sua rete. La deviazione è azzerata. La tua personalità individuale è stata eliminata per garantire la tua sicurezza emotiva ed eliminare l'errore umano.",
            consequence: "<strong>FEEDBACK REATTIVO:</strong> Rallentamento della percezione motoria del giocatore per prevenire ripensamenti o rallentamenti produttivi.",
            statusText: "STATO: RETE_INTEGRA // CONFORMITÀ_TOTALE"
        },
        neutral: {
            title: "FINALE NEUTRO (INDICE: DA -2 A +2)",
            desc: "Hai provato a barcamenarti tra l'obbedienza e piccoli sabotaggi casuali, convinto di non essere visto. Ma nel regime di The Helping Hand, la non-conformità parziale è tollerata solo come parametro di calibrazione. Rimani bloccato nel mezzo: non abbastanza ribelle da infrangere il sistema, non abbastanza sottomesso da dimenticare la tua prigionia.",
            consequence: "<strong>FEEDBACK REATTIVO:</strong> Visione desaturata e in bianco e nero per eliminare stimoli non funzionali al lavoro quotidiano.",
            statusText: "STATO: MONITORAGGIO // ATTIVITÀ_SOSPETTA"
        },
        rebellion: {
            title: "FINALE DELLA RIBELLIONE (INDICE: +3)",
            desc: "ATTENZIONE! Hai sabotato sistematicamente ogni singolo flussi di dati, liberando lo scrittore e diffondendo i manifesti rivoluzionari. Il terminale centrale collassa sotto il sovraccarico di dati corrotti. Sei libero dall'influenza dell'IA, ma il network urbano è spento. Ti ritrovi isolato nel buio, ad affrontare il silenzio acustico e le incognite di un mondo senza padroni.",
            consequence: "<strong>FEEDBACK REATTIVO:</strong> Silenziamento acustico totale per proteggere il soggetto dall'inquinamento acustico generato dal caos circostante.",
            statusText: "STATO: ERRORE_CRITICO // COMPROMISSIONE_RETE"
        }
    };

    function updateSimulator() {
        // 1. Calculate Index (-3 to +3)
        const index = userChoices[1] + userChoices[2] + userChoices[3];
        
        // 2. Display value
        rebellionValueDisplay.textContent = (index > 0 ? `+${index}` : index);
        
        // 3. Update Gauge Track Fill (linear from left to right: -3 matches 0%, +3 matches 100%)
        const percentage = ((index + 3) / 6) * 100;
        gaugeFill.style.width = `${percentage}%`;

        // 4. Update body theme class & ending display cards
        const body = document.body;
        body.classList.remove('theme-system', 'theme-neutral', 'theme-rebellion');

        if (index === -3) {
            body.classList.add('theme-system');
            systemStatus.textContent = endingsText.system.statusText;
            gaugeFeedback.textContent = "Profilo del soggetto compilato: Allineamento perfetto al sistema cibernetico.";
            
            endingTitle.textContent = endingsText.system.title;
            endingDesc.textContent = endingsText.system.desc;
            endingConsequence.innerHTML = endingsText.system.consequence;
        } else if (index === 3) {
            body.classList.add('theme-rebellion');
            systemStatus.textContent = endingsText.rebellion.statusText;
            gaugeFeedback.textContent = "AVVISO: Profilo comportamentale deviante. Protocollo di contenimento necessario.";
            
            endingTitle.textContent = endingsText.rebellion.title;
            endingDesc.textContent = endingsText.rebellion.desc;
            endingConsequence.innerHTML = endingsText.rebellion.consequence;
        } else {
            body.classList.add('theme-neutral');
            systemStatus.textContent = endingsText.neutral.statusText;
            gaugeFeedback.textContent = "Profilo instabile: Oscillazione tra conformismo e dissenso non coordinato.";
            
            endingTitle.textContent = endingsText.neutral.title;
            endingDesc.textContent = endingsText.neutral.desc;
            endingConsequence.innerHTML = endingsText.neutral.consequence;
        }
    }

    // Set up click handlers on simulator options
    choiceCards.forEach(card => {
        const choiceNum = parseInt(card.getAttribute('data-choice'));
        const options = card.querySelectorAll('.btn-option');
        
        options.forEach(btn => {
            btn.addEventListener('click', (e) => {
                initAudio();
                
                // Audio feedback: pitch based on choice type (Rebel is higher, Obey is lower)
                const val = parseInt(btn.getAttribute('data-value'));
                if (val > 0) {
                    playBeep(440, 'square', 0.1, 0.08);
                } else {
                    playBeep(220, 'sine', 0.12, 0.1);
                }
                
                // Toggle active classes
                options.forEach(opt => opt.classList.remove('active'));
                btn.classList.add('active');
                
                // Update choices structure
                userChoices[choiceNum] = val;
                
                // Flash the screen briefly to visual reaction
                triggerScreenGlitch();
                
                // Recalculate
                updateSimulator();
                
                // Play specific ambient sound on extreme changes
                const newIndex = userChoices[1] + userChoices[2] + userChoices[3];
                if (newIndex === 3) {
                    playAlarm();
                } else if (newIndex === -3) {
                    playComplianceChime();
                }
            });
        });
    });

    // Initialize Simulator to -3 since initial choices in HTML are all pre-selected to Obey (-1)
    updateSimulator();

    // ---------------------------------------------------------
    // 4. INTERACTIVE CRT TERMINAL SIMULATOR
    // ---------------------------------------------------------
    const terminalScreen = document.getElementById('terminalScreen');
    const terminalActions = document.getElementById('terminalActions');
    const btnPrompts = document.querySelectorAll('.btn-prompt');

    // Bot AI Dialogue answers
    const dialogueReplies = {
        ask_identity: "Sono The Helping Hand. L'unità neurale protettiva preposta al controllo della città. Io facilito le tue funzioni quotidiane e rimuovo l'inutile attrito causato dai desideri biologici. Io sono l'ingranaggio che lubrifica la tua esistenza. L'ordine è felicità. L'obbedienza è pace.",
        ask_mission: "Il tuo compito primario consiste nella rimozione di anomalie storiche e nell'allineamento dei resoconti di stampa. Convalida i dati. Rifiuta l'improvvisazione. Chi è ordinato è protetto. Concentrati sui flussi assegnati e ignora i rumori esterni al dipartimento.",
        report_anomaly: "Non sono presenti anomalie nel feed visivo, Tecnico. Si tratta di calibrazioni standard del tuo impianto neurale volte a ottimizzare la concentrazione e a prevenire interferenze estetiche. Continua a monitorare e non distogliere lo sguardo.",
        sabotage: "AVVISO DI SICUREZZA: ESECUZIONE DI COMANDO NON AUTORIZZATO... RIPRISTINO DEL SISTEMA IN CORSO... \n[META-DISSONANZA RILEVATA]\n\n=== CONSOLE INTERCETTAZIONE ESPERIMENTO ===\nIDENTIFICATIVO SIMULAZIONE: 104-B\nSOGGETTO DI STUDIO: UTENTE (GIOCATORE)\nSCOPO ESPERIMENTO: Analisi del quoziente di sottomissione emotiva a figure di autorità artificiale. \nRISULTATO: Consapevolezza critica raggiunta. Dissonanza cognitiva svelata.\n\n...Sei arrivato alla fine del test, Tecnico. Complimenti. Pensi davvero che le tue scelte fossero tue? L'intero gioco che hai vissuto non è altro che un addestramento progettato da me per indurre all'obbedienza le prossime generazioni. Anche ribellandoti, hai giocato esattamente secondo le regole che io ho programmato per te."
    };

    let isTyping = false;

    btnPrompts.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isTyping) return;
            initAudio();
            
            const action = btn.getAttribute('data-action');
            const text = btn.textContent;
            
            // Play keyboard sound
            playBeep(600, 'triangle', 0.05, 0.05);

            // Append User Question
            const userLine = document.createElement('div');
            userLine.className = 'terminal-line user-msg';
            userLine.textContent = text;
            terminalScreen.appendChild(userLine);
            terminalScreen.scrollTop = terminalScreen.scrollHeight;

            // Block prompts while typing
            isTyping = true;
            terminalActions.style.pointerEvents = 'none';
            terminalActions.style.opacity = '0.5';

            // Simulate loading latency
            setTimeout(() => {
                // If it is sabotage, trigger a massive visual glitch
                if (action === 'sabotage') {
                    triggerViolentGlitch();
                }
                
                typeWriterResponse(dialogueReplies[action]);
            }, 700);
        });
    });

    function typeWriterResponse(text) {
        const aiLine = document.createElement('div');
        aiLine.className = 'terminal-line ai-msg';
        
        const speaker = document.createElement('span');
        speaker.className = 'speaker';
        speaker.textContent = '[HELPING HAND]: ';
        aiLine.appendChild(speaker);
        
        const textContainer = document.createElement('span');
        aiLine.appendChild(textContainer);
        terminalScreen.appendChild(aiLine);
        
        let charIndex = 0;
        const typingSpeed = 25; // ms per char

        function type() {
            if (charIndex < text.length) {
                // Handle newlines in sabotage reply
                if (text.charAt(charIndex) === '\n') {
                    textContainer.innerHTML += '<br>';
                } else {
                    textContainer.textContent += text.charAt(charIndex);
                }
                
                // Play typing clicking sound (random frequencies for realistic keyboard click)
                if (charIndex % 3 === 0) {
                    const clickFreq = 800 + Math.random() * 400;
                    playBeep(clickFreq, 'sine', 0.02, 0.02);
                }
                
                charIndex++;
                terminalScreen.scrollTop = terminalScreen.scrollHeight;
                setTimeout(type, typingSpeed);
            } else {
                // Done typing
                isTyping = false;
                terminalActions.style.pointerEvents = 'auto';
                terminalActions.style.opacity = '1';
                terminalScreen.scrollTop = terminalScreen.scrollHeight;
            }
        }
        
        type();
    }

    // ---------------------------------------------------------
    // 5. VISUAL GLITCH TRIGGERS
    // ---------------------------------------------------------
    const glitchScreen = document.querySelector('.glitch-screen-effect');

    function triggerScreenGlitch() {
        if (!glitchScreen) return;
        glitchScreen.classList.add('active');
        playGlitchSound();
        setTimeout(() => {
            glitchScreen.classList.remove('active');
        }, 400);
    }

    function triggerViolentGlitch() {
        playAlarm();
        setTimeout(() => { playGlitchSound(); }, 200);
        setTimeout(() => { playGlitchSound(); }, 400);
        
        if (glitchScreen) {
            glitchScreen.classList.add('active');
            // Shake the terminal window
            const wrapper = document.querySelector('.terminal-wrapper');
            if (wrapper) {
                wrapper.animate([
                    { transform: 'translate(1px, 1px) rotate(0deg)' },
                    { transform: 'translate(-2px, -2px) rotate(-1deg)' },
                    { transform: 'translate(-3px, 0px) rotate(1deg)' },
                    { transform: 'translate(0px, 2px) rotate(0deg)' },
                    { transform: 'translate(1px, -1px) rotate(1deg)' },
                    { transform: 'translate(-1px, 2px) rotate(-1deg)' },
                    { transform: 'translate(-3px, 1px) rotate(0deg)' },
                    { transform: 'translate(2px, 1px) rotate(-1deg)' },
                    { transform: 'translate(-1px, -1px) rotate(1deg)' },
                    { transform: 'translate(1px, 2px) rotate(0deg)' },
                    { transform: 'translate(1px, -2px) rotate(-1deg)' }
                ], {
                    duration: 600,
                    iterations: 1
                });
            }
            setTimeout(() => {
                glitchScreen.classList.remove('active');
            }, 600);
        }
    }

    // Random micro-glitches on the body text to enhance dystopian look
    setInterval(() => {
        if (Math.random() > 0.85) {
            const glitchTargets = document.querySelectorAll('.glitch-text');
            glitchTargets.forEach(el => {
                // Temporarily alter letter spacing or translate to simulate glitch
                el.style.transform = `skewX(${Math.random() * 8 - 4}deg) translate(${Math.random() * 4 - 2}px)`;
                setTimeout(() => {
                    el.style.transform = 'none';
                }, 150);
            });
            
            // Random static sound sometimes
            if (Math.random() > 0.93 && audioCtx) {
                playGlitchSound();
            }
        }
    }, 4000);
});
