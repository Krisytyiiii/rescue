import type {
  LearningModule,
  LearningModuleSummary,
} from "@/domain/learning";

/** Read-only port for the learning content published by the City Vet team. */
export interface LearningDataSource {
  loadModules(): Promise<LearningModuleSummary[]>;
  loadModule(id: number): Promise<LearningModule>;
}
