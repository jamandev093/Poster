export interface InterestSection {
  title: string;
  topics: string[];
}

export const INTEREST_SECTIONS: InterestSection[] = [
  {
    title: "Artificial Intelligence",
    topics: [
      "Artificial Intelligence",
      "Machine Learning",
      "Deep Learning",
      "Generative AI",
      "Large Language Models",
      "Computer Vision",
      "Natural Language Processing",
      "AI Research",
      "AI Safety",
      "Robotics",
    ],
  },
  {
    title: "Software & Development",
    topics: [
      "Programming",
      "Software Development",
      "Web Development",
      "Mobile Development",
      "Frontend Development",
      "Backend Development",
      "Cloud Computing",
      "DevOps",
      "Open Source",
      "Data Science",
      "Databases",
      "Developer Tools",
    ],
  },
  {
    title: "Technology",
    topics: [
      "Technology",
      "Consumer Technology",
      "Android",
      "Apple",
      "Microsoft",
      "Google",
      "Hardware",
      "Semiconductors",
      "Quantum Computing",
      "Virtual Reality",
      "Augmented Reality",
      "Internet of Things",
    ],
  },
  {
    title: "Cybersecurity",
    topics: [
      "Cybersecurity",
      "Information Security",
      "Data Privacy",
      "Ethical Hacking",
      "Network Security",
      "Cloud Security",
      "Digital Forensics",
      "Malware Research",
      "Online Safety",
      "Cryptography",
    ],
  },
  {
    title: "Science & Space",
    topics: [
      "Science",
      "Space",
      "Astronomy",
      "Physics",
      "Chemistry",
      "Biology",
      "Neuroscience",
      "Earth Science",
      "Scientific Research",
      "Space Exploration",
      "Climate Science",
    ],
  },
  {
    title: "Business & Finance",
    topics: [
      "Business",
      "Finance",
      "Startups",
      "Entrepreneurship",
      "Economics",
      "Investing",
      "Stock Markets",
      "Personal Finance",
      "Banking",
      "Fintech",
      "Leadership",
      "Marketing",
    ],
  },
  {
    title: "Health & Medicine",
    topics: [
      "Health",
      "Medicine",
      "Public Health",
      "Mental Wellness",
      "Nutrition",
      "Fitness",
      "Medical Research",
      "Biotechnology",
      "Healthcare Technology",
      "Pharmaceuticals",
    ],
  },
  {
    title: "World & Society",
    topics: [
      "World News",
      "Geopolitics",
      "Politics",
      "International Relations",
      "Public Policy",
      "Education",
      "Environment",
      "Climate",
      "Social Issues",
      "Law",
    ],
  },
  {
    title: "Creative & Lifestyle",
    topics: [
      "Design",
      "Photography",
      "Movies",
      "Music",
      "Entertainment",
      "Gaming",
      "Travel",
      "Food",
      "Architecture",
      "Books",
      "Writing",
      "Culture",
    ],
  },
  {
    title: "Sports",
    topics: [
      "Sports",
      "Football",
      "Cricket",
      "Basketball",
      "Tennis",
      "Formula One",
      "Athletics",
      "Esports",
      "Olympics",
      "Sports Science",
    ],
  },
];

export const ALL_INTEREST_OPTIONS = Array.from(
  new Set(
    INTEREST_SECTIONS.flatMap(
      (section) => section.topics
    )
  )
);