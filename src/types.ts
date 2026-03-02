export interface AppSpecs {
  objective: string;
  roles: string;
  dataModels: string;
  constraints: string;
  branding: string;
  pages: string;
  integrations: string;
  doneState: string;
}

export const INITIAL_SPECS: AppSpecs = {
  objective: '',
  roles: '',
  dataModels: '',
  constraints: '',
  branding: '',
  pages: '',
  integrations: '',
  doneState: '',
};

export interface FileContent {
  path: string;
  content: string;
  language: string;
}

export interface GeneratedApp {
  files: FileContent[];
  summary: string;
}
