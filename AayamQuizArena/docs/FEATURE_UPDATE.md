# AAYAM Quiz Arena - Feature Updates & Bug Fixes Documentation

This document summarizes the updates, real-time enhancements, and bug-fix implementation details added to **AAYAM Quiz Arena**.

---

## 1. Rapid Fire Round
- **Admin Setup**: Admin selects a team from the console and triggers configuring/starting their Rapid Fire session.
- **Configurability**: Configurable fields (Total Round Time, Question Time Limit, Points Per Question, and Negative Marking On/Off) are passed to the socket server.
- **Dual-Timer System**: Uses a dual-interval loop:
  - Whole round timer (e.g. 60 seconds total).
  - Question countdown timer (e.g. 10 seconds per question).
- **Auto-Progression**: Automatically progresses to the next question when the team submits an answer or when the question's individual timer expires.
- **Scoring & Leaderboard**: Attempts, correct answers, wrong answers, and scores are tracked in real-time. Points are logged dynamically in `QuizAnswer` and `QuizScore` tables under a transaction.
- **Participant UI**: Playing team renders the active question and options; other teams spectate with a locked/waiting screen displaying the current timer status.

---

## 2. Hide Correct Answers & Edit MCQ Selections
- **Hiding Solutions**: The correct option ID is restricted only to host/admin screens. Players and the projector screen do not see correct answers, explanations, or option highlighting.
- **Personalized Feedback**: Individual participant sockets receive private evaluations ("Correct" or "Incorrect") on reveal.
- **Answer Editing**: Participants can change option selection as many times as they want while the timer is running. The socket server handles score delta adjustments in database transactions.

---

## 3. Exclusion of Used Questions
- **Schema model**: Added `QuizQuestionUsage` linked to `QuizSession`, `QuizRound`, and `QuizQuestion` to track pushed questions.
- **Exclusion Filter**: Pushed questions in completed sessions are excluded by default from the round questions pool list.
- **Manual Override Checkbox**: Added a checkbox `Show Used Questions` in the admin host panel to let hosts view and re-push used questions if desired.

---

## 4. Buzzer Countdown & Current rankings
- **Countdown Overlay**: Pushing a buzzer question automatically triggers a 3-second countdown ("3, 2, 1, BUZZ OPEN") showing a prominent overlay on both projector and contestant screens.
- **Countdown Locking**: Contestant buzzers are locked until the countdown reaches 0.
- **Rankings Cleanliness**: Projector screen displays only current question buzzer registrants, resetting the view immediately when a new question arrives.

---

## 5. Standardized Pass Turn Logic
- **Buzzer/Queue Pass**: Questions can be passed circularly. If in a Buzzer round, the queue of buzzed teams is checked first, falling back to a circular order of all teams if the queue is empty.
- **Double Pass Prevention**: Tracks `passCount` and `passHistory` array of team IDs to prevent passing a question to any team more than once.
- **Standardized Pass Panel**: Rendered for all non-MCQ, non-RAPID_FIRE round active questions.

---

## 6. Access Code Projection Short URLs
- **Dual Routing**: Upgraded `getSessionById` to resolve both standard 36-character UUIDs and 6-character short access codes.
- **Direct Access**: Enables the projector screen to load instantly via `/screen/[accessCode]` (e.g. `/screen/AB12CD`).
- **Auditorium URL Link**: Host panel shows the Auditorium Projector URL using the accessCode.
