import { Article } from "../types/article";

export type FeedItem = Article;

export const mockFeed: FeedItem[] = [
  {
    id: "home-openai-gpt5",
    title:
      "OpenAI introduces GPT-5 with major reasoning improvements",
    summary:
      "OpenAI says the new model improves multi-step reasoning, coding assistance, instruction following, and reliability across complex tasks. The update is designed to handle longer workflows while producing clearer answers and reducing avoidable mistakes. Developers are expected to receive expanded controls for building applications, while ChatGPT users may see faster responses and stronger performance on research, planning, and technical questions. The company also emphasized continued safety testing before broader availability across products and regions.",
    publisher: "OpenAI",
    publisherUrl: "openai.com",
    image:
      "https://picsum.photos/id/180/900/600",
    publishedAt: "2 hours ago",
    discoveredAt: "12 minutes ago",
    category: "AI",
    originalUrl: "https://openai.com",
    verified: true,
  },
  {
    id: "home-nasa-artemis",
    title:
      "NASA confirms another successful Artemis mission milestone",
    summary:
      "NASA reported that the latest Artemis program milestone was completed successfully, keeping preparations for future lunar missions on track. Engineers evaluated key spacecraft systems, mission procedures, communications, and recovery operations during the test. The results will help teams refine upcoming crewed missions and reduce technical risk before launch. Artemis is intended to support sustained exploration around the Moon while developing experience and technologies that may later contribute to human missions deeper into the solar system.",
    publisher: "NASA",
    publisherUrl: "nasa.gov",
    image:
      "https://picsum.photos/id/1015/900/600",
    publishedAt: "4 hours ago",
    discoveredAt: "30 minutes ago",
    category: "Space",
    originalUrl: "https://www.nasa.gov",
    verified: true,
  },
  {
    id: "home-google-gemini",
    title:
      "Google announces new Gemini updates for developers",
    summary:
      "Google announced a new set of Gemini improvements aimed at developers building AI-powered applications. The update includes stronger reasoning, better tool use, improved code generation, and more reliable handling of longer prompts. New development options are expected to help teams connect Gemini with existing products, data sources, and automated workflows. Google also highlighted performance and efficiency improvements intended to make advanced AI features easier to test, deploy, monitor, and scale across different application environments.",
    publisher: "Google",
    publisherUrl: "blog.google",
    image:
      "https://picsum.photos/id/1043/900/600",
    publishedAt: "5 hours ago",
    discoveredAt: "55 minutes ago",
    category: "Technology",
    originalUrl: "https://blog.google",
    verified: true,
  },
  {
    id: "home-quantum-breakthrough",
    title:
      "Researchers achieve a breakthrough in quantum computing",
    summary:
      "Researchers have reported progress on a quantum-computing technique that could improve the stability and accuracy of future systems. The work focuses on reducing errors that occur when fragile quantum states are manipulated or measured. Although practical, large-scale quantum computers remain difficult to build, the result may offer a useful path toward more dependable calculations. Scientists will now need to reproduce the findings, test them on larger devices, and determine whether the approach remains effective under real operating conditions.",
    publisher: "Nature",
    publisherUrl: "nature.com",
    image:
      "https://picsum.photos/id/1039/900/600",
    publishedAt: "8 hours ago",
    discoveredAt: "1 hour ago",
    category: "Science",
    originalUrl: "https://nature.com",
    verified: true,
  },
  {
    id: "home-phishing-campaign",
    title:
      "Cybersecurity experts warn about new phishing campaign",
    summary:
      "Security researchers are warning users and organizations about a phishing campaign that imitates trusted services to steal login credentials and financial information. The messages may use urgent language, realistic branding, and links leading to convincing fake sign-in pages. Experts recommend checking sender addresses carefully, avoiding unexpected links, and using multi-factor authentication wherever possible. Organizations should also update filtering rules, educate employees, and monitor accounts for unusual sign-in attempts or unauthorized changes following suspicious messages.",
    publisher: "The Hacker News",
    publisherUrl: "thehackernews.com",
    image:
      "https://picsum.photos/id/1060/900/600",
    publishedAt: "11 hours ago",
    discoveredAt: "2 hours ago",
    category: "Cybersecurity",
    originalUrl: "https://thehackernews.com",
    verified: true,
  },
  {
    id: "home-apple-device-ai",
    title:
      "Apple expands on-device AI features across its ecosystem",
    summary:
      "Apple is expanding on-device artificial intelligence features across more parts of its hardware and software ecosystem. Processing selected tasks directly on a device can improve responsiveness and reduce the amount of personal information sent to external servers. The features are expected to support writing assistance, image tools, smarter suggestions, and more contextual actions across applications. Apple is also emphasizing privacy controls, hardware compatibility, and a gradual rollout as developers adapt their apps to the new capabilities.",
    publisher: "Apple",
    publisherUrl: "apple.com",
    image:
      "https://picsum.photos/id/0/900/600",
    publishedAt: "14 hours ago",
    discoveredAt: "3 hours ago",
    category: "Technology",
    originalUrl: "https://apple.com",
    verified: true,
  },
  {
    id: "home-isro-reusable-launch",
    title:
      "ISRO prepares next-generation reusable launch vehicle tests",
    summary:
      "ISRO is preparing additional tests for technologies that could support a reusable launch vehicle. Reusability may eventually reduce launch costs, shorten preparation time, and allow important vehicle components to fly more than once. Upcoming work is expected to examine guidance, navigation, controlled descent, landing accuracy, structural performance, and recovery operations. Each test will provide engineering data needed to refine the design before more advanced demonstrations and any future operational system can be considered.",
    publisher: "ISRO",
    publisherUrl: "isro.gov.in",
    image:
      "https://picsum.photos/id/1011/900/600",
    publishedAt: "18 hours ago",
    discoveredAt: "4 hours ago",
    category: "Space",
    originalUrl: "https://isro.gov.in",
    verified: true,
  },
  {
    id: "home-microsoft-productivity-ai",
    title:
      "Microsoft introduces new AI productivity features",
    summary:
      "Microsoft introduced additional artificial intelligence tools intended to help people summarize information, draft content, organize work, and automate routine tasks. The features are being integrated across productivity applications so users can access assistance within familiar workflows. Microsoft says organizations will receive administrative controls for deployment, security, and data protection. The company is also focusing on improving response quality and making generated results easier to review, edit, verify, and share with colleagues.",
    publisher: "Microsoft",
    publisherUrl: "microsoft.com",
    image:
      "https://picsum.photos/id/1025/900/600",
    publishedAt: "Yesterday",
    discoveredAt: "5 hours ago",
    category: "AI",
    originalUrl: "https://microsoft.com",
    verified: true,
  },
];
