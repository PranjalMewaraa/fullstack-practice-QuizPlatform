<h1 align="center">🧩 FullStack Quiz Platform</h1>

<p align="center">
  A complete Quiz Management System built with <strong>Node.js</strong> (Backend) and <strong>React</strong> (Frontend).<br/>
  Supports Admin & User roles, Scoring, Reports, and Skill-based Quizzes.
</p>

<hr/>

<h2>📑 Table of Contents</h2>
<ol>
  <li><a href="#setup-instruction">Setup Instruction</a></li>
  <li><a href="#entities--schema-overview">Entities & Schema Overview</a></li>
  <li><a href="#relationships">Relationships</a></li>
  <li><a href="#suggested-indexes">Suggested Indexes</a></li>
  <li><a href="#api-documentation">API Documentation</a></li>
  <ul>
    <li><a href="#auth">Auth</a></li>
    <li><a href="#users-admin-only">Users (Admin Only)</a></li>
    <li><a href="#skills">Skills</a></li>
    <li><a href="#quizzes">Quizzes</a></li>
    <li><a href="#questions-linked-to-a-quiz">Questions</a></li>
    <li><a href="#taking-quizzes--scoring">Taking Quizzes & Scoring</a></li>
    <li><a href="#reports-admin">Reports (Admin)</a></li>
  </ul>
</ol>

<hr/>

<h2 id="setup-instruction">⚙️ Setup Instruction</h2>
<ol>
  <li>Clone the Repository</li>
  <li>Open <code>BackendQuiz</code> folder, install dependencies, and start the server:</li>
</ol>

<pre><code>cd BackendQuiz
npm install
npm run dev
</code></pre>

<ol start="3">
  <li>Open <code>FrontendQuiz</code> folder, install dependencies, and start the frontend:</li>
</ol>

<pre><code>cd ../FrontendQuiz
npm install
npm run dev
</code></pre>

<hr/>

<h2 id="entities--schema-overview">📘 Entities & Schema Overview</h2>

<h3>🧑‍💻 Users</h3>
<ul>
  <li><strong>id</strong> (PK)</li>
  <li><strong>name</strong></li>
  <li><strong>email</strong> (unique)</li>
  <li><strong>password_hash</strong></li>
  <li><strong>role</strong> (enum: <code>admin | user</code>)</li>
  <li><em>Timestamps</em></li>
</ul>

<h3>🧠 Skills</h3>
<ul>
  <li><strong>id</strong> (PK)</li>
  <li><strong>name</strong> (unique)</li>
  <li><strong>description</strong></li>
</ul>

<h3>📝 Quizzes</h3>
<ul>
  <li><strong>id</strong> (PK)</li>
  <li><strong>title</strong></li>
  <li><strong>description</strong></li>
  <li><strong>time_limit_sec</strong> (int, nullable)</li>
  <li><strong>pass_score</strong> (int, nullable)</li>
  <li><strong>SkillId</strong> (FK → <code>Skills.id</code>)</li>
</ul>

<h3>❓ Questions</h3>
<ul>
  <li><strong>id</strong> (PK)</li>
  <li><strong>question_text</strong></li>
  <li><strong>options</strong> (JSON)</li>
  <li><strong>correct_answer</strong> (string)</li>
  <li><strong>QuizId</strong> (FK → <code>Quizzes.id</code>)</li>
</ul>

<h3>📊 QuizAttempts</h3>
<ul>
  <li><strong>id</strong> (PK)</li>
  <li><strong>total_score</strong> (float)</li>
  <li><strong>duration</strong> (int, seconds, nullable)</li>
  <li><strong>UserId</strong> (FK → <code>Users.id</code>)</li>
  <li><strong>QuizId</strong> (FK → <code>Quizzes.id</code>)</li>
  <li><em>Timestamps (createdAt = submission time)</em></li>
</ul>

<h3>🧾 QuizAnswers</h3>
<ul>
  <li><strong>id</strong> (PK)</li>
  <li><strong>selected_option</strong></li>
  <li><strong>is_correct</strong> (bool)</li>
  <li><strong>QuizAttemptId</strong> (FK → <code>QuizAttempts.id</code>)</li>
  <li><strong>QuestionId</strong> (FK → <code>Questions.id</code>)</li>
</ul>

<hr/>

<h2 id="relationships">🔗 Relationships</h2>
<ul>
  <li><strong>User</strong> 1 — * <strong>QuizAttempt</strong></li>
  <li><strong>Skill</strong> 1 — * <strong>Quiz</strong></li>
  <li><strong>Quiz</strong> 1 — * <strong>Question</strong></li>
  <li><strong>QuizAttempt</strong> 1 — * <strong>QuizAnswer</strong></li>
  <li><strong>Question</strong> 1 — * <strong>QuizAnswer</strong></li>
</ul>

<p><em>(Skill → Quiz → Question)</em> forms the topic → quiz → items chain.</p>

<hr/>

<h2 id="suggested-indexes">⚙️ Suggested Indexes</h2>
<ul>
  <li><code>Users.email</code> (UNIQUE)</li>
  <li><code>Skills.name</code> (UNIQUE)</li>
  <li><code>Quizzes.SkillId</code> (INDEX)</li>
  <li><code>Questions.QuizId</code> (INDEX)</li>
  <li><code>QuizAttempts.UserId</code>, <code>QuizAttempts.QuizId</code>, <code>QuizAttempts.createdAt</code> (INDEX)</li>
  <li><code>QuizAnswers.QuizAttemptId</code>, <code>QuizAnswers.QuestionId</code> (INDEX)</li>
  <li><em>Functional/date indexes</em> on <code>QuizAttempts.createdAt</code> for reporting</li>
</ul>

<hr/>

<h2 id="api-documentation">📚 API Documentation</h2>

<h3 id="auth">🔐 Auth</h3>

<h4>POST /api/auth/register</h4>
<p>Create a user. Admins can create both roles; open registration defaults to <code>user</code>.</p>

<pre><code>// Request
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "StrongPass!123",
  "role": "admin" // optional
}

// Response
{ "message": "User registered" }
</code></pre>

<h4>POST /api/auth/login</h4>
<pre><code>// Request
{ "email": "alice@example.com", "password": "StrongPass!123" }

// Response
{
  "token": "&lt;JWT&gt;",
  "user": { "id": 1, "name": "Alice", "email": "alice@example.com", "role": "admin" }
}
</code></pre>

<p><strong>Authorization:</strong> Include <code>Authorization: Bearer &lt;JWT&gt;</code> on all protected routes.</p>

<hr/>

<h3 id="users-admin-only">👥 Users (Admin Only)</h3>
<h4>GET /api/users</h4>
<pre><code>[
  { "id":1, "name":"Alice", "email":"alice@example.com", "role":"admin", "createdAt":"...", "updatedAt":"..." }
]
</code></pre>

<h4>PUT /api/users/:id</h4>
<pre><code>{ "name":"New Name", "email":"new@example.com", "password":"optional", "role":"user|admin" }</code></pre>

<h4>DELETE /api/users/:id</h4>

<hr/>

<h3 id="skills">🧠 Skills</h3>
<pre><code>POST /api/skills (admin)
{ "name":"JavaScript", "description":"Core JS questions" }

GET /api/skills
[
  { "id":1, "name":"JavaScript", "description":"...", "createdAt":"...", "updatedAt":"..." }
]

PUT /api/skills/:id (admin)
{ "name":"JS (Updated)", "description":"..." }

DELETE /api/skills/:id (admin)
</code></pre>

<hr/>

<h3 id="quizzes">📝 Quizzes</h3>
<p>A Skill can have many Quizzes. Each Quiz has many Questions.</p>

<pre><code>POST /api/quizzes (admin)
{
  "title": "JavaScript Basics - Set 1",
  "description": "Core fundamentals",
  "time_limit_sec": 900,
  "pass_score": 7,
  "SkillId": 1
}

GET /api/quizzes?skillId=1&page=1&limit=10&sort=createdAt&dir=DESC&q=title
{
  "page":1, "pageSize":10, "total":3, "items":[
    { "id":10,"title":"JS Basics - Set 1","SkillId":1,"questionCount":12, "time_limit_sec":900, "pass_score":7 }
  ]
}

GET /api/quizzes/:id
{
  "id":10, "title":"JS Basics - Set 1", "Skill": { "id":1, "name":"JavaScript" },
  "time_limit_sec":900, "pass_score":7,
  "questions":[ { "id":101, "question_text":"What is ...?", "options":["a","b","c","d"] } ]
}
</code></pre>

<hr/>

<h3 id="questions-linked-to-a-quiz">❓ Questions (linked to a quiz)</h3>
<pre><code>POST /api/questions (admin)
{
  "question_text":"Choose correct output of ...",
  "options":["1","2","3","4"],
  "correct_answer":"2",
  "QuizId": 10
}

GET /api/questions?quizId=10&page=1&limit=10
{
  "page":1,"total":56,"items":[
    { "id":101,"question_text":"...","options":["1","2","3","4"],"correct_answer":"2","QuizId":10 }
  ]
}

GET /api/questions/quiz/:quizId?shuffle=true
{
  "quizId":10, "items":[ { "id":101,"question_text":"...","options":["a","b","c","d"] } ]
}
</code></pre>

<hr/>

<h3 id="taking-quizzes--scoring">🎯 Taking Quizzes & Scoring</h3>
<pre><code>POST /api/quiz/submit
{
  "userId": 42,
  "quizId": 10,
  "answers": [
    { "questionId": 101, "selected_option": "2" },
    { "questionId": 102, "selected_option": "A" }
  ]
}

// Response
{
  "message":"Quiz submitted",
  "quizId":10,
  "score":8,
  "totalQuestions":10,
  "percentage":80,
  "passed": true,
  "attemptId": 555
}
</code></pre>

<p><strong>Scoring model:</strong> one attempt per quiz; score = count of correct answers.</p>

<hr/>

<h3 id="reports-admin">📈 Reports (Admin)</h3>
<pre><code>GET /api/reports/group?page=1&limit=10&orderBy=avgScore&dir=DESC
GET /api/reports/user/:userId
GET /api/reports/user/:userId/skills?minAttempts=3
GET /api/reports/time?period=week&groupBy=day
GET /api/reports/skill/:skillId/leaderboard?minAnswers=3&limit=20
</code></pre>

<p>Reports include leaderboard data, per-user accuracy, skill analysis, and time-based stats.</p>
