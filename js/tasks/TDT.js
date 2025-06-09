document.addEventListener("DOMContentLoaded", () => {

  const canvas = document.getElementById("experimentCanvas");
  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  let durationPairs = [
    [1.0, 0.98], [1.0, 0.96], [1.0, 0.945], [1.0, 0.935], [1.0, 0.925], [1.0, 0.915], [1.0, 0.905], 
    [1.0, 0.895], [1.0, 0.885], [1.0, 0.875], [1.0, 0.865], [1.0, 0.855], [1.0, 0.845], [1.0, 0.835], 
    [1.0, 0.825], [1.0, 0.815], [1.0, 0.805], [1.0, 0.78], [1.0, 0.74], [1.0, 0.70], [1.0, 0.66], [1.0, 0.62], 
    [1.0, 0.58], [1.0, 0.54], [1.0, 0.50], [1.0, 0.46], [1.0, 1.42], [1.0, 1.01], [1.0, 1.03], [1.0, 1.05], 
    [1.0, 1.06], [1.0, 1.07], [1.0, 1.08], [1.0, 1.09], [1.0, 1.10], [1.0, 1.11], [1.0, 1.12], [1.0, 1.13],
    [1.0, 1.14], [1.0, 1.15], [1.0, 1.16], [1.0, 1.17], [1.0, 1.18], [1.0, 1.19], [1.0, 1.2], [1.0, 1.24],
    [1.0,1.28], [1.0, 1.32], [1.0, 1.36], [1.0, 1.40], [1.0, 1.44], [1.0, 1.48], [1.0, 1.52], [1.0, 1.56], [1.0, 1.60]
  ];

  let trials = shuffle([...durationPairs, ...durationPairs]);
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
