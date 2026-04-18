export type QuestionType = 'multiple_choice' | 'essay' | 'true_false';
export type Difficulty = 'Fácil' | 'Médio' | 'Difícil';

export interface QuestionImage {
  id: string;
  url: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation?: number;
}

export interface QuestionTextElement {
  id: string;
  text: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  letterSpacing?: number;
  lineHeight?: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  imageUrl?: string;
  images?: QuestionImage[];
  textElements?: QuestionTextElement[];
  imageAreaHeight?: number;
  layoutAreaWidth?: number;
  layoutPosition?: 'top' | 'bottom' | 'left' | 'right';
  options?: string[];
  answer: string;
  explanation?: string;
  difficulty: Difficulty;
  aiGenerated: boolean;
  points?: number;
}

export interface School {
  id: string;
  name: string;
  abbreviation?: string;
  cnpj?: string;
  educationLevels?: string[];
  logo?: string;
  address?: string;
}

export interface Classroom {
  id: string;
  schoolId: string;
  name: string;
  period: 'Manhã' | 'Tarde' | 'Noite';
}

export interface ExamHeader {
  schoolId?: string;
  classroomId?: string;
  schoolName: string;
  schoolLogo?: string;
  teacherName: string;
  subject: string;
  className: string;
  date: string;
  instructions: string;
  showDate?: boolean;
  showScore?: boolean;
  showStudentId?: boolean;
  headerColor?: string;
  headerTextColor?: string;
  customFields?: { label: string; value: string }[];
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
}

export interface Exam {
  id: string;
  title: string;
  version?: string;
  schoolId?: string;
  classroomId?: string;
  subjectId?: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  header: ExamHeader;
  questions: Question[];
  columns?: 1 | 2;
}

export interface TeacherSettings {
  name: string;
  defaultInstructions: string;
  geminiApiKey?: string;
  headerTemplate: {
    showDate: boolean;
    showScore: boolean;
    showStudentId: boolean;
    customFields: string[];
  };
}
