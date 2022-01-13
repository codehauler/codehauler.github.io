var quiz = {
  state : 0, // Display menu
  sectionNames: [
      "1. Conservation",
      "2. Ethics",
      "3. Laws And Regulations",
      "4. Outdoor Survival and Safety",
      "5. Firearms Safety",
      "6. Animal Identification",
      "7. Bird Identification",
      "8. Indigenous Peoples",
  ],
  jsonFilenames: [
      "ReviewTest.json",
      "ExtraQuestions.json"
  ],

  data: [],

  // (A2) HTML ELEMENTS
  hWrap: null, // HTML quiz container
  hQn: null, // HTML question wrapper
  hAns: null, // HTML answers wrapper

  // (A3) GAME FLAGS
  score: 0, // current score

  // (B) INIT QUIZ HTML
  init: () => {
    // (B1) WRAPPER
    quiz.hWrap = document.getElementById("quizWrap");

    // (B2) QUESTIONS SECTION
    quiz.hQn = document.createElement("div");
    quiz.hQn.id = "quizQn";
    quiz.hWrap.appendChild(quiz.hQn);

    // (B3) ANSWERS SECTION
    quiz.hAns = document.createElement("div");
    quiz.hAns.id = "quizAns";
    quiz.hWrap.appendChild(quiz.hAns);

    // (B4) GO!
    quiz.readDataAndDraw();
  },

  readDataAndDraw: () => {
    let promises = [];
    let subpromises = [];

    for (let i in quiz.sectionNames) {
        let section = new Object();
        quiz.data[quiz.sectionNames[i]] = new Object();
        quiz.data[quiz.sectionNames[i]]["qas"] = [];

        for (let j in quiz.jsonFilenames) {
            let fullPath = "./coredata/"+quiz.sectionNames[i]+"/"+quiz.jsonFilenames[j];
//            console.log("Loading: "+fullPath);
            
            let p = fetch(fullPath)
                .then(response => {
                    let subpromise = response.json();
                    subpromises.push(subpromise);
                    return subpromise;
                })
                .then(jsondata => {
                    for (let k in jsondata["qas"]) {
                        quiz.data[quiz.sectionNames[i]]["qas"].push(jsondata["qas"][k]);
                    }
                });
            promises.push(p);
        }
    }
    Promise.all(promises).then(p => {
        Promise.all(subpromises).then( sp => {
            quiz.draw();
        });
    });
  },

  drawRadios: (question, answers) => {
      quiz.hQn.innerHTML = question;
      quiz.hAns.innerHTML = "";
      for (let i in answers) {
        let radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "quiz";
        radio.id = "quizo" + i;
        quiz.hAns.appendChild(radio);
        let label = document.createElement("label");
        label.innerHTML = answers[i];
        label.setAttribute("for", "quizo" + i);
        label.dataset.idx = i;
        label.addEventListener("click", () => { quiz.select(label); });
        quiz.hAns.appendChild(label);
      }
  },

  // Draw top level menu
  draw: () => {
    if (quiz.state == 0) { // Show menu
      console.log("Drawing Menu");
      quiz.drawRadios("What would you like to be quizzed on?",quiz.sectionNames);
    } else if (quiz.state == 1) { // Show question
      console.log("Drawing Question");
      // clone the original array of answers
      // FIXME: not sure if this is necessary, the shuffle probably fixes it anyway
      let unshuffledAnswers = [].concat(quiz.operativeQas[quiz.currentQuestionIndex].answers);
      let correctAnswer = unshuffledAnswers[0];


      let shuffledAnswers = quiz.shuffle(unshuffledAnswers);

      // Find the index of the correct answer - there's gotta be a better way, but fuck it
      let i=0;
      for (let answer of shuffledAnswers) {
        if (answer == correctAnswer) {
            correctAnswerIndex = i;
            break;
        }
        i++;
      }
      
      quiz.operativeQas[quiz.currentQuestionIndex].correctAnswerIndex = correctAnswerIndex;
      quiz.drawRadios(quiz.operativeQas[quiz.currentQuestionIndex].question,shuffledAnswers);
    } else if (quiz.state == 2) { // Show summary
        quiz.hQn.innerHTML = `You have answered ${quiz.score} of ${quiz.data.length} correctly.`;
        quiz.hAns.innerHTML = "";
        // FIXME : need some items here to allow us to go back to state==0
    }
  },

  // Random shuffle list of answers.  Readable by the kind of people who like this sort of thing.
  shuffle: (unshuffled) => {
      shuffled = unshuffled
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
      return shuffled;
  },

  // OPTION SELECTED
  select: (option) => {
    // DETACH ALL ONCLICK
    let all = quiz.hAns.getElementsByTagName("label");
    for (let label of all) {
      label.removeEventListener("click", quiz.select);
    }

    let timeout = 0;
    if (quiz.state ==0) { // displaying main menu
        quiz.score = 0;
        quiz.state = 1; // move to displaying questions
        quiz.currentQuestionIndex = 0;

        // Randomize order of questions in a shallow copy of the array
        let unshuffled = [].concat(quiz.data[quiz.sectionNames[option.dataset.idx]].qas);
        let shuffled = quiz.shuffle(unshuffled);

        quiz.operativeQas = shuffled;

        // Identify appropriate section
    } else if (quiz.state == 1 && quiz.currentQuestionIndex < quiz.operativeQas.length) {
        timeout = 2000;
        let correctAnswerIndex = quiz.operativeQas[quiz.currentQuestionIndex].correctAnswerIndex;
        let correct = option.dataset.idx == correctAnswerIndex;
        if (correct) {
            quiz.score++;
            option.classList.add("correct");
        } else {
            option.classList.add("wrong");
            let all = quiz.hAns.getElementsByTagName("label");
            let answers = quiz.operativeQas[quiz.currentQuestionIndex].answers;
            let correctOption = all[correctAnswerIndex];
            correctOption.classList.add("correct");
        }
        quiz.currentQuestionIndex++;
    } else if (quiz.state == 1 && quiz.currentQuestionIndex == quiz.operativeQas.length) {
        quiz.state = 2; // Display summary page
        timeout = 2000;
    }
    

    setTimeout(() => {
      quiz.draw(); 
    }, timeout);

  },

  // (D) OPTION SELECTED
  selectold: (option) => {
    // (D1) DETACH ALL ONCLICK
    let all = quiz.hAns.getElementsByTagName("label");
    for (let label of all) {
      label.removeEventListener("click", quiz.select);
    }

    // (D2) CHECK IF CORRECT
    let correct = option.dataset.idx == quiz.data[quiz.now].a;
    if (correct) {
      quiz.score++;
      option.classList.add("correct");
    } else {
      option.classList.add("wrong");
      let correctOption = all[quiz.data[quiz.now].a];
      correctOption.classList.add("correct");
    }

    // (D3) NEXT QUESTION OR END GAME
    quiz.now++;
    setTimeout(() => {
      if (quiz.now < quiz.data.length) { quiz.draw(); }
      else {
        quiz.hQn.innerHTML = `You have answered ${quiz.score} of ${quiz.data.length} correctly.`;
        quiz.hAns.innerHTML = "";
      }
    }, 2000);
  },

  // (E) RESTART QUIZ
  reset : () => {
    quiz.now = 0;
    quiz.score = 0;
    quiz.draw();
  }
};
window.addEventListener("load", quiz.init);
