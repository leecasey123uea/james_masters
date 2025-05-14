//ensure that it does not listen for input until the sounds have all played smdt

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

    for (let i = 0; i < 9; i++) {
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
          window.removeEventListener("keydown", keyListener);  // Remove listener after key press
          messageDiv.style.display = "none";  // Hide the message
          resolve();  // Resolve the promise once a key is pressed
        };
        window.addEventListener("keydown", keyListener);  // Add listener to wait for a key
      }
      
      // Wait for click if needed
      if (waitForClick) {
        const clickListener = function waitingForClick() {
          window.removeEventListener("click", clickListener);  // Remove listener after click
          messageDiv.style.display = "none";  // Hide the message
          resolve();  // Resolve the promise once clicked
        };
        window.addEventListener("click", clickListener);  // Add listener to wait for a click
      }
    });
  }

  function playMelody(melody) {
    return new Promise(async (resolve) => {
      for (let i = 0; i < melody.length; i++) {
        const audio = new Audio(melody[i]);
        drawRectangles(melody.length);
        drawHighlight(i);
        await new Promise((noteDone) => {
          audio.onended = noteDone;
          audio.play();
        });
        await new Promise(r => setTimeout(r, 100)); // small gap between notes (optional)
      }
      resolve();
    });
  }
  
  function getUserResponse(melodyLength) {
    return new Promise((resolve) => {
      window.addEventListener('keydown', function waitingForKey(event) {
        const validKeys = Array.from({ length: melodyLength }, (_, i) => `${i + 1}`);
        if (validKeys.includes(event.key)) {
          resolve(parseInt(event.key));
          window.removeEventListener('keydown', waitingForKey); // Stop listening after a valid key
        }
      });
    });
  }
  
  function generateTrials(limit = null) {
    const trials = [];
    for (let melodyLength = 4; melodyLength < 10; melodyLength++) {
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

  async function run_smdt(testMode = true) { //change when in test mode
    // Show the instructions at the start and wait for key press to continue
    showText(INSTRUCTION_TEXT, true);
    await waitForKeyPress();
    
    // Generate trials (you can modify this if you'd like fewer trials in test mode)
    const trials = generateTrials(testMode ? 3 : null);
    const results = [];
  
    // Loop through trials
    for (let [melody1, melody2, correctAnswer] of trials) {
      showText("Listen to the first melody...");
      await new Promise(resolve => setTimeout(resolve, 1000));  // Wait between melodies
      await playMelody(melody1);  // Play the first melody
      showText("Wait...");
      await new Promise(resolve => setTimeout(resolve, 1000));  // Wait before second melody
      showText("Listen to the second melody...");
      await playMelody(melody2);  // Play the second melody
  
      showText("Press the number of the note that was different.");
      
      // Capture user response and wait for key press
      const userResponse = await getUserResponse(melody1.length);
      results.push({
        melody1: melody1.join('-'),
        melody2: melody2.join('-'),
        response: userResponse,
        correctAnswer
      });
  
      // Wait for a short break between trials
      await new Promise(resolve => setTimeout(resolve, 1000));  // 1 second break
    }
  
    // Show completion message and wait for a click before continuing
    redrawCanvas();
    await showText("Task Complete! You will now be asked to choose between repeating a harder version for more money or an easier version for less money. Click when ready.", false, true);
    return results;  // Add this line
    // The code will now wait until the user clicks anywhere on the screen
  }  
  
  function calculatePerformanceLevel(results) {
    const correctCount = results.filter(r => r.response === r.correctAnswer).length;
    const total = results.length;
    const accuracy = correctCount / total;
  
    if (accuracy === 1.0) return 9;
    if (accuracy >= 0.85) return 8;
    if (accuracy >= 0.70) return 7;
    if (accuracy >= 0.55) return 6;
    return 5;
  }
  
  // Function to wait for a key press
  async function waitForKeyPress() {
    return new Promise(resolve => {
      const keyListener = () => {
        window.removeEventListener("keydown", keyListener);  // Remove listener after first key press
        resolve();  // Resolve the promise once a key is pressed
      };
      window.addEventListener("keydown", keyListener);
    });
  }

  async function runCogedp() {
    // Simulate the analysis logic
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
  
        let choice = await getUserResponse(2); // 1 for easy, 2 for hard
        let choiceLabel = (choice === 1) ? 'easy' : 'hard';
  
        // Save trial data
        coged_data.push({
          rewardPair: `${easyAmountStart}-${hardAmount}`,
          trial: trialNum + 1,
          offerAmount: parseFloat(mid.toFixed(2)),
          choice: choiceLabel
        });
  
        // Adjust bounds for next trial
        if (choice === 1) {
          high = mid;
        } else {
          low = mid;
        }
  
        await new Promise(resolve => setTimeout(resolve, 500));  // Wait between trials
      }
    }
  
    try {
      redrawCanvas(); 
    } catch (error) {
      console.error("Error occurred while trying to run redrawCanvas:", error);
    }
  
    showText("COGEDP Task Complete!");
  
    // Store globally or externally
    window.coged_data = coged_data;
  }
  

  // Main function to run both tasks
  async function run_Experiment() {
    const smdtResults = await run_smdt();
  
    // 🔽 Make SMDT results globally accessible
    window.smdt_data = smdtResults;
  
    bestHardLevel = calculatePerformanceLevel(smdtResults);
    bestEasyLevel = Math.max(bestHardLevel - 1, 1);
  
    await runCogedp();  
  }
  
  window.run_Experiment = run_Experiment;
});