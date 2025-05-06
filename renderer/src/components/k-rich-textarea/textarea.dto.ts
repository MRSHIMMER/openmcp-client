
interface PromptTextItem {
    type: 'prompt'
    text: string
}

interface ResourceTextItem {
    type: 'resource'
    text: string
}

interface TextItem {
    type: 'text'
    text: string
}

export type RichTextItem = PromptTextItem | ResourceTextItem | TextItem;