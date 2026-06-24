// Abstract interface — swap providers without touching business logic
export interface AIProvider {
  generateText(prompt: string): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
}
