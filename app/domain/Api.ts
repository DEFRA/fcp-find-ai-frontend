interface Item {
  title: string
  scheme?: string
  url: string
  summary: string
}

interface BotAnswer {
  role: string // assistant or user
  answer: string
  items: Item[]
}
