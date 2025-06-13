document.addEventListener("DOMContentLoaded", () => {

  const canvas = document.getElementById("experimentCanvas");
  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  let durationPairs = [
    [1.0, 0.400], [1.0, 0.450], [1.0, 0.500], [1.0, 0.550], [1.0, 0.600], [1.0, 0.650], [1.0, 0.700], [1.0, 0.750], [1.0, 0.754], [1.0, 0.758],
    [1.0, 0.762], [1.0, 0.766], [1.0, 0.770], [1.0, 0.774], [1.0, 0.778], [1.0, 0.782], [1.0, 0.786], [1.0, 0.790], [1.0, 0.794], [1.0, 0.798],
    [1.0, 0.802], [1.0, 0.806], [1.0, 0.810], [1.0, 0.814], [1.0, 0.818], [1.0, 0.822], [1.0, 0.826], [1.0, 0.830], [1.0, 0.834], [1.0, 0.838],
    [1.0, 0.842], [1.0, 0.846], [1.0, 0.850], [1.0, 0.900], [1.0, 0.950], [1.0, 1.050], [1.0, 1.100], [1.0, 1.150], [1.0, 1.154], [1.0, 1.158],
    [1.0, 1.162], [1.0, 1.166], [1.0, 1.170], [1.0, 1.174], [1.0, 1.178], [1.0, 1.182], [1.0, 1.186], [1.0, 1.190], [1.0, 1.194], [1.0, 1.198],
    [1.0, 1.202], [1.0, 1.206], [1.0, 1.210], [1.0, 1.214], [1.0, 1.218], [1.0, 1.222], [1.0, 1.226], [1.0, 1.230], [1.0, 1.234], [1.0, 1.238],
    [1.0, 1.242], [1.0, 1.246], [1.0, 1.250], [1.0, 1.300], [1.0, 1.350], [1.0, 1.400], [1.0, 1.450], [1.0, 1.500], [1.0, 1.550], [1.0, 1.600]
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
