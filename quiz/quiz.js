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
        label.addEventListener("click", () => { quiz.select(label); }, { once: true} );
        quiz.hAns.appendChild(label);
      }
  },

  correctAllOrNoneInAnswers: (answers) => {
      const none = "None of the above";
      const all = "All of the above";
      // Some answers will contain these special options; they should appear last.
      for (let i=0; i< answers.length-1; i++) { // Just loop to the second-last element
          let currentAnswer = answers[i];
          if (currentAnswer == none || currentAnswer == all) {
              // swap current element with second-last element in array, and return the result.
              let result = [].concat(answers);
              let temp = result[i];
              result[i] = result[result.length-1];
              result[result.length-1]=temp;
              return result;
          }
      }
      return answers;
  },

  // Draw a page
  draw: () => {
    if (quiz.state == 0) { // Show menu

// Why the frig can't I just do:
//      let menuItems = all.concat(quiz.sectonNames);
//    So weird

      const menuItems = ["All"];
      quiz.sectionNames.forEach(val=>{
          menuItems.push(val);
      });

      quiz.drawRadios("Choose your topic:",menuItems);
    } else if (quiz.state == 1) { // Show latest question
      // clone the original array of answers
      // FIXME: not sure if this is necessary, the shuffle probably fixes it anyway
      let unshuffledAnswers = [].concat(quiz.operativeQas[quiz.currentQuestionIndex].answers);
      let correctAnswer = unshuffledAnswers[0];
      let shuffledAnswers = quiz.shuffle(unshuffledAnswers);
      let correctedShuffledAnswers = quiz.correctAllOrNoneInAnswers(shuffledAnswers);

      // Find the index of the correct answer - there's gotta be a better way, but fuck it
      let i=0;
      for (let answer of correctedShuffledAnswers) {
        if (answer == correctAnswer) {
            correctAnswerIndex = i;
            break;
        }
        i++;
      }
      
      quiz.operativeQas[quiz.currentQuestionIndex].correctAnswerIndex = correctAnswerIndex;
      quiz.drawRadios(quiz.operativeQas[quiz.currentQuestionIndex].question,correctedShuffledAnswers);
    } else if (quiz.state == 2) { // Show summary
      quiz.hQn.innerHTML = `You have answered ${quiz.score} of ${quiz.operativeQas.length} correctly.`;
      quiz.hAns.innerHTML = "";
      quiz.state = 0;
      setTimeout(() => {
          quiz.draw(); 
      }, 5000);
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

        let unshuffled = [];

        if (option.dataset.idx == 0) { // "All" case
            // Try to to create and destroy a zillion arrays here, use forach and push.
            for (i in quiz.sectionNames) {
                quiz.data[quiz.sectionNames[i]].qas.forEach(val=>{
                    unshuffled.push(val);
                });
            }
        } else {
            // Randomize order of questions in a shallow copy of the array
            // use idx-1 because idx=0 is the "All" option.
            unshuffled = [].concat(quiz.data[quiz.sectionNames[option.dataset.idx-1]].qas);
        }

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
            let correctOption = all[correctAnswerIndex];
            correctOption.classList.add("correct");
        }

        quiz.currentQuestionIndex++;
        if (quiz.state == 1 && quiz.currentQuestionIndex == quiz.operativeQas.length) {
            quiz.state = 2; // Display summary info
        }
    }
    

    setTimeout(() => {
      quiz.draw(); 
    }, timeout);

  },


  // (E) RESTART QUIZ
  reset : () => {
    quiz.score = 0;
    quiz.draw();
  }
};
window.addEventListener("load", quiz.init);
