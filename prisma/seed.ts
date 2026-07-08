import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import egeTop50 from "../src/data/hard-words/ege-top-50.json";

const prisma = new PrismaClient();

const orthographyQuestions = [
  {
    orderIndex: 0,
    type: "multiple_choice",
    prompt: "В каком слове пропущена буква И?",
    optionA: "пр…лестный",
    optionB: "об…дать",
    optionC: "с…грать",
    optionD: "п…сать",
    correctOption: "A",
    explanation: "Прелестный — проверочное слово «прелесть».",
  },
  {
    orderIndex: 1,
    type: "gap_fill",
    prompt: "Вставьте букву: пр…лестный",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "е",
    explanation: "Прелестный.",
  },
  {
    orderIndex: 2,
    type: "multiple_choice",
    prompt: "В каком слове пишется одна буква Н?",
    optionA: "деревянный",
    optionB: "стеклянный",
    optionC: "оловянный",
    optionD: "кожаный",
    correctOption: "D",
    explanation: "Кожаный — суффикс -ан-.",
  },
];

async function main() {
  await prisma.hardWordProgress.deleteMany();
  await prisma.hardWord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.questionAnswer.deleteMany();
  await prisma.result.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.group.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.text.deleteMany();

  const teacher = await prisma.teacher.create({
    data: {
      email: "teacher@example.com",
      passwordHash: await bcrypt.hash("teacher123", 10),
      fullName: "Чистякова Юлия Владимировна",
      emailVerified: true,
      subscriptionStatus: "active",
      subscriptionEndsAt: new Date("2030-01-01"),
    },
  });

  const group = await prisma.group.create({
    data: {
      name: "Выпускники-2026",
      teacherId: teacher.id,
    },
  });

  const students = await Promise.all([
    prisma.student.create({
      data: {
        fullName: "Иванов Петр Сергеевич",
        accessKey: "STUDENT1",
        groupId: group.id,
      },
    }),
    prisma.student.create({
      data: {
        fullName: "Смирнова Анна Дмитриевна",
        accessKey: "STUDENT2",
        groupId: group.id,
      },
    }),
    prisma.student.create({
      data: {
        fullName: "Козлов Максим Андреевич",
        accessKey: "STUDENT3",
        groupId: group.id,
      },
    }),
  ]);

  const categories = [
    { category: "orthography", taskName: "Текст №12 — пропущенные буквы" },
    { category: "task-9", taskName: "Задание 9 — корни слов" },
    { category: "adverbs", taskName: "Наречия — тренировка 3" },
    { category: "ege-tests", taskName: "Пробный вариант №5" },
    { category: "task-4", taskName: "Задание 4 — лексика" },
  ];

  for (const student of students) {
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      await prisma.result.create({
        data: {
          studentId: student.id,
          category: cat.category,
          taskName: cat.taskName,
          score: 6 + (i % 4),
          maxScore: 10,
          completedAt: new Date(Date.now() - i * 86400000 * 3),
        },
      });
    }
  }

  const texts = [
    {
      title: "Весенний лес",
      author: "Астафьев В.П.",
      textType: "Художественные тексты",
      year: 2024,
      topic: "Природа",
      content:
        "Весной лес просыпается медленно, словно не решается сразу поверить в тепло. Снег ещё лежит в тени, но солнце уже пробивается сквозь голые ветви...",
    },
    {
      title: "О роли чтения",
      author: "Авдеев А.С.",
      textType: "Публицистические тексты",
      year: 2023,
      topic: "Образование",
      content:
        "Чтение формирует не только словарный запас, но и способность мыслить образами, сопереживать героям и анализировать текст...",
    },
    {
      title: "Семейные традиции",
      author: "Абрамов Ф.А.",
      textType: "Очерки",
      year: 2022,
      topic: "Семья",
      content:
        "Семейные традиции — это невидимая нить, связывающая поколения. Они передаются не через слова, а через поступки и общие ритуалы...",
    },
    {
      title: "Наука и общество",
      author: "Толстой Л.Н.",
      textType: "Научные тексты",
      year: 2025,
      topic: "Наука",
      content:
        "Развитие науки неразрывно связано с потребностями общества. Каждое открытие меняет не только технологии, но и сам способ нашего мышления...",
    },
    {
      title: "Город и человек",
      author: "Чехов А.П.",
      textType: "Художественные тексты",
      year: 2021,
      topic: "Общество",
      content:
        "Город живёт своей жизнью, не замечая отдельных людей. Но именно в этих людях — его настоящая душа, его история и будущее...",
    },
  ];

  for (const text of texts) {
    await prisma.text.create({ data: text });
  }

  const assignment = await prisma.assignment.create({
    data: {
      title: "Орфография — тренировка 1",
      category: "orthography",
      description: "Пробное задание по орфографии",
      groupId: group.id,
      published: true,
      allowRetake: true,
      questions: { create: orthographyQuestions },
    },
    include: { questions: true },
  });

  const studentAnswers = [
    ["A", "е", "D"],
    ["A", "а", "C"],
    ["B", "е", "D"],
  ];

  for (let si = 0; si < students.length; si++) {
    const student = students[si];
    const answers = studentAnswers[si];
    let score = 0;

    const attempt = await prisma.attempt.create({
      data: {
        assignmentId: assignment.id,
        studentId: student.id,
        attemptNumber: 1,
        status: "completed",
        maxScore: assignment.questions.length,
        completedAt: new Date(),
      },
    });

    for (let qi = 0; qi < assignment.questions.length; qi++) {
      const q = assignment.questions[qi];
      const chosen = answers[qi];
      const isCorrect = chosen === q.correctOption;
      if (isCorrect) score++;

      await prisma.questionAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: q.id,
          chosenOption: chosen,
          isCorrect,
        },
      });
    }

    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { score },
    });

    await prisma.result.create({
      data: {
        studentId: student.id,
        category: assignment.category,
        taskName: `${assignment.title} (попытка 1)`,
        score,
        maxScore: assignment.questions.length,
        attemptId: attempt.id,
      },
    });
  }

  for (const s of students) {
    await prisma.notification.create({
      data: {
        studentId: s.id,
        assignmentId: assignment.id,
        type: "new_assignment",
        title: "Новое задание",
        message: `Вам назначено задание: «${assignment.title}»`,
      },
    });
  }

  await prisma.hardWord.createMany({
    data: egeTop50.map((w) => ({
      teacherId: teacher.id,
      topic: w.topic,
      word: w.word,
      definition: w.definition,
      example: w.example,
    })),
  });

  console.log("Seed completed!");
  console.log("Teacher: teacher@example.com / teacher123");
  console.log("Students:");
  for (const s of students) {
    console.log(`  ${s.fullName} — ключ: ${s.accessKey}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
