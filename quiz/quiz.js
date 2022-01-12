var quiz = {
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
  now: 0, // current question
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
            console.log("Loading: "+fullPath);
            
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
            console.log("Finished.  quiz keys are = ");
            console.log(Object.keys(quiz.data));
            quiz.draw();
        });
    });
  },

  // Draw top level menu
  draw: () => {
    quiz.hQn.innerHTML = "What would you like to be quizzed on?";
    quiz.hAns.innerHTML = "";

    for (let i in quiz.sectionNames) {
      let radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "quiz";
      radio.id = "quizo" + i;
      quiz.hAns.appendChild(radio);
      let label = document.createElement("label");
      label.innerHTML = quiz.sectionNames[i];
      label.setAttribute("for", "quizo" + i);
      label.dataset.idx = i;
      label.addEventListener("click", () => { quiz.select(label); });
      quiz.hAns.appendChild(label);
    }
  },

  // OPTION SELECTED
  select: (option) => {
    // DETACH ALL ONCLICK
    let all = quiz.hAns.getElementsByTagName("label");
    for (let label of all) {
      label.removeEventListener("click", quiz.select);
    }

    // Identify appropriate section

    
    // Show some feedback for now
    console.log("section name = ");
    console.log(quiz.sectionNames[option.dataset.idx]);
    console.log("section qas = ");
    console.log(quiz.data[quiz.sectionNames[option.dataset.idx]].qas);
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
