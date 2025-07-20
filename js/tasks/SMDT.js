document.addEventListener("DOMContentLoaded", () => {

  const sounds = [
    'assets/sounds/SMDT/A-sharp4.wav', 'assets/sounds/SMDT/A-sharp5.wav',
    'assets/sounds/SMDT/A4.wav',  'assets/sounds/SMDT/A5.wav',
    'assets/sounds/SMDT/B4.wav',  'assets/sounds/SMDT/C-sharp4.wav',
    'assets/sounds/SMDT/C-sharp5.wav', 'assets/sounds/SMDT/C4.wav',
    'assets/sounds/SMDT/C5.wav',  'assets/sounds/SMDT/D-sharp4.wav',
    'assets/sounds/SMDT/D-sharp5.wav', 'assets/sounds/SMDT/D4.wav',
    'assets/sounds/SMDT/D5.wav',  'assets/sounds/SMDT/E4.wav',
    'assets/sounds/SMDT/E5.wav',  'assets/sounds/SMDT/F-sharp4.wav',
    'assets/sounds/SMDT/F-sharp5.wav', 'assets/sounds/SMDT/F4.wav',
    'assets/sounds/SMDT/F5.wav',  'assets/sounds/SMDT/G-sharp4.wav',
    'assets/sounds/SMDT/G-sharp5.wav', 'assets/sounds/SMDT/G4.wav',
    'assets/sounds/SMDT/G5.wav'
  ];

  const INSTRUCTION_TEXT = (
    "In this task, you will hear melodies. You will hear two melodies in each task. " +
    "Within each pair of melodies, only one note differs. " +
    "Your task is to determine at which position in the melodies the note differs. " +
    "After the melodies have been played, you should press the number key " +
    "on the position you believe is correct.\n\nPress any key when you are ready to start."
  );

  let screen;

  // New: Store preloaded audio elements here keyed by src
  const audioBufferMap = {};

  // New: Preload all audio files and store in audioBufferMap
  async function preloadAudioFiles(sounds) {
    const promises = sounds.map(src => {
      return new Promise((resolve) => {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.oncanplaythrough = () => resolve();
        audio.onerror = (e) => {
          console.error("Failed to preload:", src, e);
          resolve();  // Continue even if some fail
        };
        audioBufferMap[src] = audio;
      });
    });
    return Promise.all(promises);
  }

  function initializeScreen() {
    screen = document.getElementById('experimentCanvas');
    if (!screen) {
      console.error('Canvas element with id "experimentCanvas" not found!');
      return;
    }
    screen.width = window.innerWidth;
    screen.height = window.innerHeight;
  }

  function drawRectangles(melodyLength) {
    screen = document.getElementById('experimentCanvas');
    if (!screen) {
      console.error("Canvas not initialized properly.");
      return;
    }

    const rectWidth = 70;
    const rectHeight = 20;
    const padding = 10;
    const xStart = (screen.width - (rectWidth * 9 + padding * 8)) / 2;

    const ctx = screen.getContext('2d');
    if (!ctx) {
      console.error("Failed to get canvas context.");
      return;
    }

    for (let i = 0; i < 7; i++) {
      const color = i < melodyLength ? 'white' : 'black';
      drawRectangle(xStart + i * (rectWidth + padding), 550, rectWidth, rectHeight, color, ctx);
    }
  }

  function drawRectangle(x, y, width, height, color, ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }

  function drawHighlight(soundIndex) {
    if (!screen) {
      console.error("Canvas not initialized properly.");
      return;
    }

    const rectWidth = 70;
    const rectHeight = 20;
    const padding = 10;
    const xStart = (screen.width - (rectWidth * 9 + padding * 8)) / 2;

    const ctx = screen.getContext('2d');
    if (!ctx) {
      console.error("Failed to get canvas context.");
      return;
    }

    // Draw highlight rectangle
    drawRectangle(xStart + soundIndex * (rectWidth + padding), 550, rectWidth, rectHeight, 'red', ctx);
  }

  function showText(text, waitForKey = false, waitForClick = false) {
    const messageDiv = document.getElementById("message");
    messageDiv.innerText = text;
    messageDiv.style.display = "block";
  
    return new Promise(resolve => {
      // Wait for key press if needed
      if (waitForKey) {
        const keyListener = function waitingForKey(event) {
          window.removeEventListener("keydown", keyListener);
          messageDiv.style.display = "none";
          resolve();
        };
        window.addEventListener("keydown", keyListener);
      }
      
      // Wait for click if needed
      if (waitForClick) {
        const clickListener = function waitingForClick() {
          window.removeEventListener("click", clickListener);
          messageDiv.style.display = "none";
          resolve();
        };
        window.addEventListener("click", clickListener);
      }
    });
  }

  async function playMelody(melody) {
    drawRectangles(melody.length);
    for (let i = 0; i < melody.length; i++) {
      drawHighlight(i);
      try {
        await playSoundWithRetry(melody[i]);
      } catch (error) {
        console.error("Critical audio playback failure:", error);
        alert("There was a problem playing the audio. Please check your connection and try again.");
        throw error;
      }
      await new Promise(r => setTimeout(r, 100));
    }
  }

  function getUserResponse(melodyLength) {
    return new Promise((resolve) => {
      window.addEventListener('keydown', function waitingForKey(event) {
        const validKeys = Array.from({ length: melodyLength }, (_, i) => `${i + 1}`);
        if (validKeys.includes(event.key)) {
          resolve(parseInt(event.key));
          window.removeEventListener('keydown', waitingForKey);
        }
      });
    });
  }

  // Modified: Reuse preloaded audio elements with cloneNode
  function playSoundWithRetry(src, maxRetries = 99999, retryDelay = 500) {
    return new Promise((resolve, reject) => {
      let retries = 0;

      function attemptPlay() {
        // Clone preloaded audio element for playback
        const originalAudio = audioBufferMap[src];

        if (!originalAudio) {
          console.error(`❌ Audio for src not found in buffer: ${src}`);
          if (retries < maxRetries) {
            retries++;
            setTimeout(attemptPlay, retryDelay);
          } else {
            reject(new Error(`Audio not found after ${maxRetries} attempts: ${src}`));
          }
          return;
        }

        const audio = originalAudio.cloneNode();

        let played = false;

        audio.addEventListener('playing', () => {
          played = true;
        });

        audio.onended = () => {
          resolve();
        };

        audio.onerror = (e) => {
          console.error(`Audio error on attempt ${retries + 1} for ${src}`, e);
          if (retries < maxRetries) {
            retries++;
            setTimeout(attemptPlay, retryDelay);
          } else {
            reject(new Error(`Failed to play sound after ${maxRetries} attempts: ${src}`));
          }
        };

        audio.play().catch((err) => {
          console.error(`Audio play() promise rejected on attempt ${retries + 1} for ${src}`, err);
          if (retries < maxRetries) {
            retries++;
            setTimeout(attemptPlay, retryDelay);
          } else {
            reject(new Error(`Failed to play sound after ${maxRetries} attempts: ${src}`));
          }
        });

        setTimeout(() => {
          if (!played) {
            console.warn(`Audio did not start playing within 1 second on attempt ${retries + 1} for ${src}`);
            if (retries < maxRetries) {
              retries++;
              audio.pause();
              setTimeout(attemptPlay, retryDelay);
            } else {
              reject(new Error(`Sound did not start playing after ${maxRetries} attempts: ${src}`));
            }
          }
        }, 1000);
      }

      attemptPlay();
    });
  }

  function generateTrials(limit = null) {
    const trials = [];
    for (let melodyLength = 4; melodyLength < 8; melodyLength++) {
      for (let i = 0; i < 3; i++) {
        let melody1 = getRandomSounds(melodyLength);
        let melody2 = melody1.slice();
        let diffIndex = Math.floor(Math.random() * melodyLength);
        let newNote = sounds.filter(s => s !== melody1[diffIndex])[Math.floor(Math.random() * sounds.length)];
        melody2[diffIndex] = newNote;
        let correctAnswer = diffIndex + 1;
        trials.push([melody1, melody2, correctAnswer]);
      }
    }
    return limit ? trials.slice(0, limit) : trials;
  }

  function getRandomSounds(length) {
    return Array.from({ length }, () => sounds[Math.floor(Math.random() * sounds.length)]);
  }

  async function run_smdt(testMode = false) {
    showText(INSTRUCTION_TEXT, true);
    await waitForKeyPress();

    const trials = generateTrials(testMode ? 3 : null);
    const results = [];

    for (let [melody1, melody2, correctAnswer] of trials) {
      showText("Listen to the first melody...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      await playMelody(melody1);
      showText("Wait...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      showText("Listen to the second melody...");
      await playMelody(melody2);

      showText("Press the number of the note that was different.");

      const userResponse = await getUserResponse(melody1.length);
      results.push({
        melody1: melody1,
        melody2: melody2,
        response: userResponse,
        correctAnswer
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    redrawCanvas();
    await showText(
      "You will now be asked to make several choices between repeating either an Easy or Hard version of this task. " +
      "The offers will always be between repeating an Easier version of the task for lesser reward, " +
      "or a Harder version for greater reward. Though you will not be paid for each choice you make, " +
      "your responses will be submitted into a prize draw. Decisions are also self-paced, " +
      "so take your time and decide carefully which task you would rather do based on the amount." +
      "Click to begin",
      false,
      true
    );
    return results;
  }

  function calculatePerformanceLevel(results) {
    const correctCount = results.filter(r => r.response === r.correctAnswer).length;
    const total = results.length;
    const accuracy = correctCount / total;
    if (accuracy === 0.90) return 7;
    if (accuracy >= 0.80) return 6;
    return 5;
  }

  async function waitForKeyPress() {
    return new Promise(resolve => {
      const keyListener = () => {
        window.removeEventListener("keydown", keyListener);
        resolve();
      };
      window.addEventListener("keydown", keyListener);
    });
  }

  async function runCogedp() {
    const rewardPairs = [[1, 2], [2, 4]];
    const nTrialsPerPair = 6;
    const coged_data = [];

    for (let [easyAmountStart, hardAmount] of rewardPairs) {
      let low = 0;
      let high = hardAmount;
      for (let trialNum = 0; trialNum < nTrialsPerPair; trialNum++) {
        let mid = (low + high) / 2;
        let easyStr = `£${mid.toFixed(2)} for ${bestEasyLevel} sounds`;
        let hardStr = `£${hardAmount} for ${bestHardLevel} sounds`;
        let choiceText = `Choice ${trialNum + 1}:\n\nPress 1 for:\n${easyStr}\n\nPress 2 for:\n${hardStr}`;
        showText(choiceText);

        let choice = await getUserResponse(2);
        let choiceLabel = (choice === 1) ? 'easy' : 'hard';

        coged_data.push({
          rewardPair: `${easyAmountStart}-${hardAmount}`,
          trial: trialNum + 1,
          offerAmount: parseFloat(mid.toFixed(2)),
          choice: choiceLabel
        });

        if (choice === 1) {
          high = mid;
        } else {
          low = mid;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    try {
      redrawCanvas();
    } catch (error) {
      console.error("Error occurred while trying to run redrawCanvas:", error);
    }

    showText("COGEDP Task Complete!");

    window.coged_data = coged_data;
  }

  async function run_Experiment() {
    // New: Preload all sounds before experiment starts
    await preloadAudioFiles(sounds);

    const smdtResults = await run_smdt();

    window.smdt_data = smdtResults;

    bestHardLevel = calculatePerformanceLevel(smdtResults);
    bestEasyLevel = Math.max(bestHardLevel - 1, 1);

    await runCogedp();
  }

    async function run_Experiment() {
    // Preload all audio files before starting the experiment
    await preloadAudioFiles(sounds);
    console.log("All audio files preloaded successfully.");


    const smdtResults = await run_smdt();

    // Make SMDT results globally accessible
    window.smdt_data = smdtResults;

    bestHardLevel = calculatePerformanceLevel(smdtResults);
    bestEasyLevel = Math.max(bestHardLevel - 1, 1);

    await runCogedp();
  }

  // Expose the run_Experiment function globally so it can be triggered externally as before
  window.run_Experiment = run_Experiment;


});
