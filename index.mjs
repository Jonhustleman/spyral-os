import { generateText } from 'ai';

const { text } = await generateText({
  model: 'openai/gpt-5.5',
  prompt: 'Explain quantum computing in simple terms in one paragraph.',
});

console.log(text);
