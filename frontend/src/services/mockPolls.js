export const INITIAL_POLLS = [
  {
    id: 'poll-101',
    title: 'Which Go Web Framework do you use in production?',
    description: 'Real-time benchmark survey comparing Go HTTP frameworks for high-concurrency microservices.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 20).toISOString(), // 20 hours remaining
    allowMultiple: false,
    restrictFingerprint: true,
    restrictIP: true,
    totalVotes: 342,
    options: [
      { id: 'opt-1', text: 'Gin Framework', votes: 168 },
      { id: 'opt-2', text: 'Fiber (Express-like)', votes: 94 },
      { id: 'opt-3', text: 'Echo', votes: 52 },
      { id: 'opt-4', text: 'Standard net/http (Go 1.22+ router)', votes: 28 },
    ],
    creator: 'Senior Architecture Team',
    category: 'Backend Architecture',
    isLive: true,
  },
  {
    id: 'poll-102',
    title: 'Preferred In-Memory Real-Time Database Strategy',
    description: 'Comparing sub-millisecond atomic counters and pub/sub message brokers.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 2).toISOString(), // 2 hours remaining
    allowMultiple: false,
    restrictFingerprint: true,
    restrictIP: true,
    totalVotes: 512,
    options: [
      { id: 'opt-1', text: 'Redis (INCR + Pub/Sub Websockets)', votes: 340 },
      { id: 'opt-2', text: 'Apache Kafka + Redis Cache', votes: 110 },
      { id: 'opt-3', text: 'NATS JetStream', votes: 42 },
      { id: 'opt-4', text: 'RabbitMQ', votes: 20 },
    ],
    creator: 'DevOps Lead',
    category: 'Real-time Data',
    isLive: true,
  },
  {
    id: 'poll-103',
    title: 'Modern Frontend Styling Engine Choice',
    description: 'Evaluating developer velocity, bundle impact, and runtime design system flexibility.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    expiresAt: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
    allowMultiple: false,
    restrictFingerprint: true,
    restrictIP: false,
    totalVotes: 820,
    options: [
      { id: 'opt-1', text: 'Tailwind CSS v4', votes: 492 },
      { id: 'opt-2', text: 'Vanilla CSS / CSS Modules', votes: 164 },
      { id: 'opt-3', text: 'Styled Components / Emotion', votes: 98 },
      { id: 'opt-4', text: 'Chakra UI / Radix Themes', votes: 66 },
    ],
    creator: 'Frontend Guild',
    category: 'Frontend Engineering',
    isLive: false,
  }
];
