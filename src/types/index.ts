export interface Account {
  id?: string;
  Name: string;
  Phone?: string;
  Website?: string;
  Industry?: string;
  Description?: string;
  BillingStreet?: string;
  BillingCity?: string;
  BillingState?: string;
  BillingPostalCode?: string;
  BillingCountry?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id?: string;
  FirstName: string;
  LastName: string;
  Email?: string;
  Phone?: string;
  Title?: string;
  Department?: string;
  AccountId?: string;
  MailingStreet?: string;
  MailingCity?: string;
  MailingState?: string;
  MailingPostalCode?: string;
  MailingCountry?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Assessment {
  id?: string;
  name: string;
  templateId: string;
  status: 'Draft' | 'Sent' | 'In Progress' | 'Completed';
  dueDate: string;
  accountId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Template {
  id?: string;
  name: string;
  description?: string;
  sections: TemplateSection[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateSection {
  id?: string;
  title: string;
  description?: string;
  questions: TemplateQuestion[];
}

export interface TemplateQuestion {
  id?: string;
  text: string;
  type: 'text' | 'number' | 'multipleChoice' | 'checkboxes';
  required: boolean;
  options?: string[];
}

export interface AssessmentResponse {
  id?: string;
  assessmentId: string;
  accountId: string;
  status: 'Not Started' | 'In Progress' | 'Submitted';
  responses: QuestionResponse[];
  timeline: TimelineEvent[];
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
}

export interface QuestionResponse {
  questionId: string;
  sectionId: string;
  value: string | string[] | number | null;
  updatedAt?: string;
}

export interface TimelineEvent {
  id?: string;
  date: string;
  status: string;
  message: string;
  user?: string;
} 