export interface Port {
  id: number;
  name: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
}

export interface QuizState {
  ports: Port[];
  markers: Map<string, Port>;
  answers: Map<string, string>;
  isSubmitted: boolean;
  score: number;
}

export interface QuizResult {
  letter: string;
  selectedPort: string;
  correctPort: string;
  isCorrect: boolean;
}

export interface PortList {
  id: string;
  name: string;
  portKeys: string[]; // Array of "portName-country" keys
  isBuiltIn: boolean;
}

export interface PortListItem {
  Number: number;
  "Port Name": string;
  Country: string;
  Region: string;
}

export interface QuizHistory {
  id: string;
  date: number;
  score: number;
  total: number;
  accuracy: number;
  duration: number;
  difficulty: 'easy' | 'normal' | 'hard';
  regions: string[];
  countries: string[];
  results: {
    port: string;
    isCorrect: boolean;
  }[];
}
