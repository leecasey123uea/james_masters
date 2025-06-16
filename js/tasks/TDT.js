document.addEventListener("DOMContentLoaded", () => {

  const canvas = document.getElementById("experimentCanvas");
  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  let durationPairs = [
    [1.00, 1.0100], [0.9800, 1.00], [1.00, 1.0300], [0.9600, 1.00], [1.00, 1.0500], [0.9400, 1.00], [1.00, 1.0700], [0.9200, 1.00], [1.00, 1.0900], [0.9000, 1.00],
    [1.00, 1.1020], [0.8960, 1.00], [1.00, 1.1060], [0.8920, 1.00], [1.00, 1.1100], [0.8880, 1.00], [1.00, 1.1140], [0.8840, 1.00], [1.1180, 1.00], [1.00, 0.8815], 
    [1.1190, 1.00], [1.00, 0.8805], [1.1200, 1.00], [1.00, 0.8795], [1.1210, 1.00], [1.00, 0.8785], [1.1220, 1.00], [1.00, 0.8760], [1.1260, 1.00], [1.00, 0.8720], 
    [1.1300, 1.00], [1.00, 0.8680], [1.1340, 1.00], [1.00, 0.8640], [1.1380, 1.00], [1.00, 0.8600], [1.1500, 1.00], [1.00, 0.8400], [1.1700, 1.00], [1.00, 0.8200],
    [1.1900, 1.00], [1.00, 0.8000], [1.2100, 1.00], [1.00, 0.7800], [1.2300, 1.00], [1.00, 0.7600], [1.2800, 1.00], [1.00, 0.6800], [1.3600, 1.00], [1.00, 0.6000],
    [1.4400, 1.00], [1.00, 0.5200], [1.5200, 1.00], [1.00, 0.4400], [1.6000, 1.00], [1.0100, 1.00], [1.00, 0.9800], [1.0300, 1.00], [1.00, 0.9600], [1.0500, 1.00], 
    [1.00, 0.9400], [1.0700, 1.00], [1.00, 0.9200], [1.0900, 1.00], [1.00, 0.9000], [1.1020, 1.00], [1.00, 0.8960], [1.1060, 1.00], [1.00, 0.8920], [1.1100, 1.00], 
    [1.00, 0.8880], [1.1140, 1.00], [1.00, 0.8840], [1.00, 1.1180], [0.8815, 1.00], [1.00, 1.1190], [0.8805, 1.00], [1.00, 1.1200], [0.8795, 1.00], [1.00, 1.1210], 
    [0.8785, 1.00], [1.00, 1.1220], [0.8760, 1.00], [1.00, 1.1260], [0.8720, 1.00], [1.00, 1.1300], [0.8680, 1.00], [1.00, 1.1340], [0.8640, 1.00], [1.00, 1.1380], 
    [0.8600, 1.00], [1.00, 1.1500], [0.8400, 1.00], [1.00, 1.1700], [0.8200, 1.00], [1.00, 1.1900], [0.8000, 1.00], [1.00, 1.2100], [0.7800, 1.00], [1.00, 1.2300], 
    [0.7600, 1.00], [1.00, 1.2800], [0.6800, 1.00], [1.00, 1.3600], [0.6000, 1.00],
    [1.00, 1.4400], [0.5200, 1.00], [1.00, 1.5200], [0.4400, 1.00], [1.00, 1.6000]
  ];

  let trials = shuffle(durationPairs);
  let trialIndex = 0;
  let trialResults = [];

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function drawFixation() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2 - 20, HEIGHT / 2);
    ctx.lineTo(WIDTH / 2 + 20, HEIGHT / 2);
    ctx.moveTo(WIDTH / 2, HEIGHT / 2 - 20);
    ctx.lineTo(WIDTH / 2, HEIGHT / 2 + 20);
    ctx.stroke();
  }

  function drawText(lines) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const font = window.getComputedStyle(document.body).font;
    const color = window.getComputedStyle(document.body).color;

    ctx.fillStyle = color;
    ctx.font = font;

    const totalTextHeight = lines.length * 30;
    const startY = (HEIGHT - totalTextHeight) / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, WIDTH / 2 - ctx.measureText(line).width / 2, startY + i * 30);
    });
  }

  function playBeep(duration) {
    return new Promise(resolve => {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(600, context.currentTime);
      oscillator.connect(context.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        context.close().then(resolve); // Ensures the context is cleaned up
      }, duration * 1000);
    });
  }


  function showResponseScreen() {
    drawText([
      "Was the second sound shorter or longer?",
      "Up arrow for longer,",
      "Down arrow for shorter."
    ]);
  }

  async function runTrial(pair) {
    drawFixation();
    await new Promise(r => setTimeout(r, 1000));
    await playBeep(pair[0]);

    drawFixation();
    await new Promise(r => setTimeout(r, 500));
    await playBeep(pair[1]);

    showResponseScreen();
    return new Promise(resolve => {
      const listener = (event) => {
        if (["ArrowUp", "ArrowDown"].includes(event.key)) {
          const correct = (pair[1] > pair[0] && event.key === "ArrowUp") ||
                          (pair[1] < pair[0] && event.key === "ArrowDown");
          window.removeEventListener("keydown", listener);
          resolve(correct);
        }
      };
      window.addEventListener("keydown", listener);
    });
  }

  async function run_tdt() {
    redrawCanvas();
    drawText([
        "For the Temporal Discrimination task, you will hear a tone played for a fixed duration.",
        "You will then hear the same tone for a different duration, after a short period of silence.",
        "You will be asked whether you thought the second tone was for a longer, or shorter duration, than the first.",
        "Press any key to begin."
    ]);

    await new Promise(resolve => {
        const startListener = () => {
            window.removeEventListener("keydown", startListener);
            resolve();
        };
        window.addEventListener("keydown", startListener);
    });

    for (let i = 0; i < trials.length; i++) {
        const correct = await runTrial(trials[i]);
        trialResults.push({
            trial: i + 1,
            durations: trials[i],
            correct: correct
        });
        await new Promise(r => setTimeout(r, 1000));
    }

    window.tdt_data = trialResults;

    drawText([
        "Well done, you have now completed",
        "the Temporal Discrimination task!",
        "Thank you for your participation."
    ]);

    await new Promise(r => setTimeout(r, 7000));
  }


  window.run_tdt = run_tdt;
});
