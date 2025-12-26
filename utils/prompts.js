export const prompts = [
  {
    id: 1,
    question: "Artist or genre that defined your year?",
    type: "text",
    placeholder: "e.g., Kendrick, Aphex Twin, drill, shoegaze...",
    maxLength: 30,
    required: false,
  },
  {
    id: 2,
    question: "Your soundtrack?",
    type: "text",
    placeholder: "album, song, or vibe",
    maxLength: 40,
    required: false,
  },
]

export const getPromptById = (id) => {
  return prompts.find((p) => p.id === id)
}

export const totalPrompts = prompts.length

