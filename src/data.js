// Module catalogue taken from the UOVT Student Handbook 2023-24
// (Faculty of Information Technology, B.Tech. degree programme tables).
//
// Each module: code, title, credits, gpa (true = counts toward GPA,
// false = non-GPA / NG), type ('C' = compulsory, 'E' = elective).
//
// Reconciled totals per programme (handbook summary tables):
//   compulsory GPA credits 167, NG credits 18 for all three programmes;
//   elective GPA credits: Multimedia 8, Software 9, Network 11.
// Semester GPA totals: Sem 1 = 24, Sem 2 = 31,
//   Sem 3 = 33 Multimedia / 32 Software / 32 Network,
//   Sem 4 = 31 Multimedia / 28 Software / 34 Network,
//   Sem 5 = 14 (Industrial Training only),
//   Sem 6 = 42 Multimedia / 47 Software / 43 Network (incl. electives).

const YEAR_1_SEM_1 = [
  { code: "IT103011", title: "Mathematics for ICT I", credits: 3, gpa: true, type: "C" },
  { code: "IT104021", title: "Computer Programming", credits: 4, gpa: true, type: "C" },
  { code: "IT104031", title: "Software Development Practices", credits: 4, gpa: true, type: "C" },
  { code: "IT103041", title: "Digital Electronics", credits: 3, gpa: true, type: "C" },
  { code: "IT103051", title: "Data Communication and Networks", credits: 3, gpa: true, type: "C" },
  { code: "IT103061", title: "Database Design", credits: 3, gpa: true, type: "C" },
  { code: "IT104071", title: "Internet Technologies", credits: 4, gpa: true, type: "C" },
  { code: "LS103101", title: "Communication Skills in English I", credits: 3, gpa: false, type: "C" },
];

const YEAR_1_SEM_2 = [
  { code: "IT202011", title: "Operating Systems", credits: 2, gpa: true, type: "C" },
  { code: "IT203021", title: "Mathematics for ICT II", credits: 3, gpa: true, type: "C" },
  { code: "IT203031", title: "Computer Architecture", credits: 3, gpa: true, type: "C" },
  { code: "IT204041", title: "Data Structures and Algorithms", credits: 4, gpa: true, type: "C" },
  { code: "IT206051", title: "Database Systems and Programming", credits: 6, gpa: true, type: "C" },
  { code: "IT204061", title: "Visual Programming I", credits: 4, gpa: true, type: "C" },
  { code: "IT206071", title: "Web Programming", credits: 6, gpa: true, type: "C" },
  { code: "IT203081", title: "Computer Networks", credits: 3, gpa: true, type: "C" },
  { code: "LS203111", title: "Communication Skills in English II", credits: 3, gpa: false, type: "C" },
];

const YEAR_3_SEM_1 = [
  { code: "IT514011", title: "Work Based / Industrial Training", credits: 14, gpa: true, type: "C" },
];

const NG_ELECTIVES_Y2S1 = [
  { code: "IT302160", title: "Psychology", credits: 2, gpa: false, type: "E" },
  { code: "IT302170", title: "Soft Skills and Personal development", credits: 2, gpa: false, type: "E" },
];

const NG_ELECTIVES_Y2S2 = [
  { code: "IT402170", title: "Meditation & Stress Management", credits: 2, gpa: false, type: "E" },
  { code: "EE402911", title: "Energy Management in IT Environment", credits: 2, gpa: false, type: "E" },
];

const NG_ELECTIVES_Y3S2 = [
  { code: "IT602080", title: "Photography", credits: 2, gpa: false, type: "E" },
  { code: "MS602910", title: "Occupational Health and Safety", credits: 2, gpa: false, type: "E" },
];

export const PROGRAMMES = {
  multimedia: {
    label: "B.Tech in Multimedia & Web Technology",
    short: "Multimedia & Web Technology",
    semesters: [
      { id: "y1s1", label: "Year 1 — Semester 1", modules: YEAR_1_SEM_1 },
      { id: "y1s2", label: "Year 1 — Semester 2", modules: YEAR_1_SEM_2 },
      {
        id: "y2s1",
        label: "Year 2 — Semester 1",
        modules: [
          { code: "IT304011", title: "Web Technology and Applications", credits: 4, gpa: true, type: "C" },
          { code: "IT304021", title: "Platform Independent Programming", credits: 4, gpa: true, type: "C" },
          { code: "IT304071", title: "Fundamentals of Mass Communication and Media Design", credits: 4, gpa: true, type: "C" },
          { code: "IT303081", title: "Art and Design", credits: 3, gpa: true, type: "C" },
          { code: "IT306091", title: "2D and 3D Graphics", credits: 6, gpa: true, type: "C" },
          { code: "IT304101", title: "Video Production Techniques", credits: 4, gpa: true, type: "C" },
          { code: "IT304111", title: "Animation Technology and Applications", credits: 4, gpa: true, type: "C" },
          { code: "MS304121", title: "Entrepreneurship Development and Management", credits: 4, gpa: true, type: "C" },
          ...NG_ELECTIVES_Y2S1,
        ],
      },
      {
        id: "y2s2",
        label: "Year 2 — Semester 2",
        modules: [
          { code: "IT404010", title: "Mobile Application Development", credits: 4, gpa: true, type: "C" },
          { code: "IT404020", title: "Cloud Based Application Development", credits: 4, gpa: true, type: "C" },
          { code: "IT402030", title: "Human Computer Interaction", credits: 2, gpa: true, type: "C" },
          { code: "IT406081", title: "Digital Signal Processing Techniques and Image Processing", credits: 6, gpa: true, type: "C" },
          { code: "IT402090", title: "Audio Editing and Music Production", credits: 2, gpa: true, type: "C" },
          { code: "IT404101", title: "Audio and Video Postproduction Techniques", credits: 4, gpa: true, type: "C" },
          { code: "IT406111", title: "Multimedia Product Development", credits: 6, gpa: true, type: "C" },
          { code: "MS403130", title: "Research Methodology", credits: 3, gpa: true, type: "C" },
          ...NG_ELECTIVES_Y2S2,
        ],
      },
      { id: "y3s1", label: "Year 3 — Semester 1 (Industrial Training)", modules: YEAR_3_SEM_1 },
      {
        id: "y3s2",
        label: "Year 3 — Semester 2",
        modules: [
          { code: "IT604011", title: "Professional Issues in Information Technology", credits: 4, gpa: true, type: "C" },
          { code: "IT604021", title: "Enterprise System Design", credits: 4, gpa: true, type: "C" },
          { code: "IT604121", title: "Multimedia Project Management", credits: 4, gpa: true, type: "C" },
          { code: "IT603130", title: "Content Management Systems and Frameworks", credits: 3, gpa: true, type: "C" },
          { code: "IT604141", title: "Multimedia Data Processing", credits: 4, gpa: true, type: "C" },
          { code: "IT603100", title: "Digital Marketing", credits: 3, gpa: true, type: "C" },
          ...NG_ELECTIVES_Y3S2,
          { code: "IT604090", title: "Game Development and Programming", credits: 4, gpa: true, type: "E" },
          { code: "IT604040", title: "Intelligent Systems", credits: 4, gpa: true, type: "E" },
          { code: "IT612111", title: "Final Year Project (Multimedia and Web Development Project)", credits: 12, gpa: true, type: "C" },
        ],
      },
    ],
  },

  software: {
    label: "B.Tech in Software Technology",
    short: "Software Technology",
    semesters: [
      { id: "y1s1", label: "Year 1 — Semester 1", modules: YEAR_1_SEM_1 },
      { id: "y1s2", label: "Year 1 — Semester 2", modules: YEAR_1_SEM_2 },
      {
        id: "y2s1",
        label: "Year 2 — Semester 1",
        modules: [
          { code: "IT304011", title: "Web Technology and Applications", credits: 4, gpa: true, type: "C" },
          { code: "IT304021", title: "Platform Independent Programming", credits: 4, gpa: true, type: "C" },
          { code: "IT306031", title: "Visual Programming II", credits: 6, gpa: true, type: "C" },
          { code: "IT306041", title: "Software Architectures and Design", credits: 6, gpa: true, type: "C" },
          { code: "IT304051", title: "Software Deployment and Evolution", credits: 4, gpa: true, type: "C" },
          { code: "IT304061", title: "Database Implementation", credits: 4, gpa: true, type: "C" },
          { code: "MS304121", title: "Entrepreneurship Development and Management", credits: 4, gpa: true, type: "C" },
          ...NG_ELECTIVES_Y2S1,
        ],
      },
      {
        id: "y2s2",
        label: "Year 2 — Semester 2",
        modules: [
          { code: "IT404010", title: "Mobile Application Development", credits: 4, gpa: true, type: "C" },
          { code: "IT404020", title: "Cloud Based Application Development", credits: 4, gpa: true, type: "C" },
          { code: "IT402030", title: "Human Computer Interaction", credits: 2, gpa: true, type: "C" },
          { code: "IT404041", title: "Real-Time Programming", credits: 4, gpa: true, type: "C" },
          { code: "IT406051", title: "Software Testing and Reliability", credits: 6, gpa: true, type: "C" },
          { code: "IT403061", title: "Enterprise System Technologies and Architectures", credits: 3, gpa: true, type: "C" },
          { code: "IT402070", title: "UX Engineering", credits: 2, gpa: true, type: "E" },
          { code: "MS403130", title: "Research Methodology", credits: 3, gpa: true, type: "C" },
          ...NG_ELECTIVES_Y2S2,
        ],
      },
      { id: "y3s1", label: "Year 3 — Semester 1 (Industrial Training)", modules: YEAR_3_SEM_1 },
      {
        id: "y3s2",
        label: "Year 3 — Semester 2",
        modules: [
          { code: "IT604011", title: "Professional Issues in Information Technology", credits: 4, gpa: true, type: "C" },
          { code: "IT604021", title: "Enterprise System Design", credits: 4, gpa: true, type: "C" },
          { code: "IT604030", title: "Enterprise Resource Planning Systems", credits: 4, gpa: true, type: "C" },
          { code: "IT604040", title: "Intelligent Systems", credits: 4, gpa: true, type: "C" },
          { code: "IT604051", title: "Information Systems Security and Practices", credits: 4, gpa: true, type: "C" },
          { code: "IT604061", title: "Software Project Management", credits: 4, gpa: true, type: "C" },
          { code: "IT604071", title: "Enterprise Application Development", credits: 4, gpa: true, type: "C" },
          ...NG_ELECTIVES_Y3S2,
          { code: "IT604090", title: "Game Development and Programming", credits: 4, gpa: true, type: "E" },
          { code: "IT603100", title: "Digital Marketing", credits: 3, gpa: true, type: "E" },
          { code: "IT612111", title: "Final Year Project (Software Development Project)", credits: 12, gpa: true, type: "C" },
        ],
      },
    ],
  },

  network: {
    label: "B.Tech in Network Technology",
    short: "Network Technology",
    semesters: [
      { id: "y1s1", label: "Year 1 — Semester 1", modules: YEAR_1_SEM_1 },
      { id: "y1s2", label: "Year 1 — Semester 2", modules: YEAR_1_SEM_2 },
      {
        id: "y2s1",
        label: "Year 2 — Semester 1",
        modules: [
          { code: "IT304011", title: "Web Technology and Applications", credits: 4, gpa: true, type: "C" },
          { code: "IT304021", title: "Platform Independent Programming", credits: 4, gpa: true, type: "C" },
          { code: "IT304121", title: "Network Administration", credits: 4, gpa: true, type: "C" },
          { code: "IT306131", title: "Internetwork Switching", credits: 6, gpa: true, type: "C" },
          { code: "IT306141", title: "System Administration", credits: 6, gpa: true, type: "C" },
          { code: "IT304151", title: "Wireless Communication", credits: 4, gpa: true, type: "C" },
          { code: "MS304121", title: "Entrepreneurship Development and Management", credits: 4, gpa: true, type: "C" },
          ...NG_ELECTIVES_Y2S1,
        ],
      },
      {
        id: "y2s2",
        label: "Year 2 — Semester 2",
        modules: [
          { code: "IT404010", title: "Mobile Application Development", credits: 4, gpa: true, type: "C" },
          { code: "IT404020", title: "Cloud Based Application Development", credits: 4, gpa: true, type: "C" },
          { code: "IT404121", title: "Internetwork Routing", credits: 4, gpa: true, type: "C" },
          { code: "IT406131", title: "Windows Server Administration", credits: 6, gpa: true, type: "C" },
          { code: "IT406141", title: "Network Systems Implementation", credits: 6, gpa: true, type: "C" },
          { code: "IT404150", title: "Network Programming", credits: 4, gpa: true, type: "C" },
          { code: "IT403160", title: "IoT Device Programming", credits: 3, gpa: true, type: "C" },
          { code: "MS403130", title: "Research Methodology", credits: 3, gpa: true, type: "C" },
          ...NG_ELECTIVES_Y2S2,
        ],
      },
      { id: "y3s1", label: "Year 3 — Semester 1 (Industrial Training)", modules: YEAR_3_SEM_1 },
      {
        id: "y3s2",
        label: "Year 3 — Semester 2",
        modules: [
          { code: "IT604011", title: "Professional Issues in Information Technology", credits: 4, gpa: true, type: "C" },
          { code: "IT604051", title: "Information Systems Security and Practices", credits: 4, gpa: true, type: "C" },
          { code: "IT604151", title: "Network Project Management", credits: 4, gpa: true, type: "C" },
          { code: "IT604161", title: "Broadband Networks", credits: 4, gpa: true, type: "C" },
          { code: "IT604171", title: "Photonics and Fiber Optics", credits: 4, gpa: true, type: "C" },
          { code: "IT603100", title: "Digital Marketing", credits: 3, gpa: true, type: "E" },
          { code: "IT604030", title: "Enterprise Resource Planning Systems", credits: 4, gpa: true, type: "E" },
          { code: "IT604040", title: "Intelligent Systems", credits: 4, gpa: true, type: "E" },
          ...NG_ELECTIVES_Y3S2,
          { code: "IT612111", title: "Final Year Project (Network Development Project)", credits: 12, gpa: true, type: "C" },
        ],
      },
    ],
  },
};
